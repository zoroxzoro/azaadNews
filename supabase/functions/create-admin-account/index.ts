import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// Explicit allowed origins for administrative operations
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:4173',
  'https://azaadsamacharindia.com',
  'https://www.azaadsamacharindia.com',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') ?? '';
  const isAllowed = ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.azaadsamacharindia.com');
  const allowedOrigin = isAllowed ? origin : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  // 1. Handle CORS Preflight OPTIONS request immediately BEFORE authentication
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || supabaseServiceKey;

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error: missing credentials' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Authenticate caller independently on the server
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing or malformed authorization token.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Privileged service role client (isolated on server, never exposed to client)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Verify caller JWT directly with Supabase Auth
    const { data: { user: callerUser }, error: callerError } = await supabaseAdmin.auth.getUser(token);
    if (callerError || !callerUser) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid, expired, or anonymous session.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Verify Super Admin role and active status in profiles table
    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, role, status')
      .eq('id', callerUser.id)
      .maybeSingle();

    if (profileError || !callerProfile) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Caller profile record not found.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (callerProfile.status !== 'active') {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Caller account is suspended or inactive.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (callerProfile.role !== 'super_admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Super Admin role required to create newsroom administrators.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Parse & Validate Payload
    const body = await req.json();
    const cleanName = (body.name || body.fullName || '').trim();
    const cleanEmail = (body.email || '').trim().toLowerCase();
    const cleanPassword = (body.password || '').trim();

    if (cleanName.length < 2) {
      return new Response(JSON.stringify({ error: 'Admin name must be at least 2 characters.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return new Response(JSON.stringify({ error: 'A valid email address is required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (cleanPassword.length < 8) {
      return new Response(JSON.stringify({ error: 'Password must be at least 8 characters.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 5. Create user in Supabase Auth Admin API (pre-confirmed, active immediately)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: cleanPassword,
      email_confirm: true,
      user_metadata: {
        full_name: cleanName,
      },
    });

    if (authError || !authData?.user?.id) {
      return new Response(JSON.stringify({ error: authError?.message || 'Failed to create user account in auth system.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const newUserId: string = authData.user.id;

    // 6. Update profile for the newly created user
    // The auth.users trigger (on_auth_user_created) creates the initial profile row with role='author'.
    // To satisfy "Super Admin Update Any Profile" RLS and trigger_prevent_profile_escalation,
    // we perform the role update using the authenticated Super Admin caller's client.
    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error: updateError } = await callerClient
      .from('profiles')
      .update({
        full_name: cleanName,
        display_name: cleanName,
        display_name_hindi: cleanName,
        role: 'admin',
        status: 'active',
        created_by: callerUser.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', newUserId);

    if (updateError) {
      console.error('[create-admin-account] profile update error:', updateError);

      // Safe Rollback: delete the newly created auth user so an orphaned auth user is not left behind
      try {
        await supabaseAdmin.auth.admin.deleteUser(newUserId);
        console.info('[create-admin-account] Successfully rolled back newly created auth user:', newUserId);
      } catch (rollbackErr) {
        console.error('[create-admin-account] Rollback failed for newly created user:', newUserId, rollbackErr);
      }

      return new Response(
        JSON.stringify({ error: updateError.message || 'Profile setup failed after auth account creation.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 7. Record audit event in editorial_activity
    try {
      await supabaseAdmin.from('editorial_activity').insert({
        user_id: callerUser.id,
        action: 'admin_created',
        details: {
          created_user_id: newUserId,
          email: cleanEmail,
          full_name: cleanName,
          role: 'admin',
        },
        created_at: new Date().toISOString(),
      });
    } catch (_auditErr) {
      // Non-blocking
    }

    // 8. Return success matching contract (never return plaintext password)
    return new Response(
      JSON.stringify({
        success: true,
        admin: {
          id: newUserId,
          name: cleanName,
          email: cleanEmail,
          role: 'admin',
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
