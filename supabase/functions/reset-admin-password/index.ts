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
  const allowedOrigin = isAllowed ? origin : (ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]);

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
        JSON.stringify({ error: 'Forbidden: Super Admin role required to reset administrator credentials.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Parse & Validate Payload
    const body = await req.json();
    const { targetUserId, newPassword } = body;

    if (!targetUserId) {
      return new Response(JSON.stringify({ error: 'targetUserId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cleanPassword = (newPassword || '').trim();
    if (cleanPassword.length < 8) {
      return new Response(JSON.stringify({ error: 'Password must be at least 8 characters.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 5. Update password via Supabase Auth Admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
      password: cleanPassword,
      user_metadata: { must_change_password: true },
    });

    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 6. Update profiles must_change_password flag
    await supabaseAdmin
      .from('profiles')
      .update({ must_change_password: true, updated_at: new Date().toISOString() })
      .eq('id', targetUserId);

    // 7. Record audit log in editorial_activity
    try {
      await supabaseAdmin.from('editorial_activity').insert({
        user_id: callerUser.id,
        action: 'admin_password_reset',
        details: {
          target_user_id: targetUserId,
          target_email: authData.user.email,
        },
        created_at: new Date().toISOString(),
      });
    } catch (_auditErr) {
      // Non-blocking
    }

    // 8. Return success without echoing password
    return new Response(
      JSON.stringify({ success: true, message: 'Password reset successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
