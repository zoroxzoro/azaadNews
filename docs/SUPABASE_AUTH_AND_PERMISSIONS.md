# Supabase Authentication & Role-Based Permissions: Azaad Samachar

## 1. Authentication Architecture Overview

Phase 2 transitions **Azaad Samachar (आज़ाद समाचार)** from client-side mock authentication to real **Supabase Auth** with role-based access control (RBAC), Row Level Security (RLS) enforcement, and session restoration.

### Core Security Invariants
- **Zero Plaintext Passwords:** Handled entirely by Supabase GoTrue with bcrypt/argon2 hashing.
- **No Secret Keys in Frontend:** Only the public publishable anon key (`VITE_SUPABASE_PUBLISHABLE_KEY`) is bundled into the client.
- **Database-Enforced Roles:** Roles (`super_admin`, `admin`, `editor`, `author`) and account status (`active`, `suspended`, `invited`) are stored in `public.profiles` and enforced via `SECURITY DEFINER` functions in PostgreSQL RLS policies.
- **Anti-Self-Promotion:** The database trigger `trigger_prevent_role_escalation` strictly forbids users from elevating their own role or modifying their account status.
- **Immediate Suspension Enforcement:** Suspended staff accounts are immediately signed out by the client and blocked from any database reads or mutations.

---

## 2. Staff Roles & Permissions Matrix

| Capability / Action | Super Admin | Admin | Editor | Author | Anonymous Public |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **View Published Articles** | Yes | Yes | Yes | Yes | Yes (Live only) |
| **Create Draft Articles** | Yes | Yes | Yes | Yes | No |
| **Edit Own Articles** | Yes | Yes | Yes | Yes (Draft/In Review) | No |
| **Edit Any Article** | Yes | Yes | Yes | No | No |
| **Submit for Review** | Yes | Yes | Yes | Yes | No |
| **Publish Articles** | Yes | Yes | Yes | No | No |
| **Schedule Articles** | Yes | Yes | Yes | No | No |
| **Unpublish / Delete Articles** | Yes | Yes | Yes (Unpublish) / Admin (Delete) | No | No |
| **Manage Media Library** | Yes | Yes | Upload & Edit | Upload only | No (View only) |
| **Manage Categories & Tags** | Yes | Yes | Tags only | No | No |
| **System Settings** | Yes | Yes | Read-only | Read-only | Read-only |
| **Staff Role Management** | Yes | No | No | No | No |
| **Migration & Audit Logs** | Yes | Yes (Read) | No | No | No |

---

## 3. Super Admin Bootstrap Procedure (How to Create the First Super Admin)

> [!CRITICAL]
> **Never create public self-service administrator registration.**
> **Never promote the first person who registers automatically.**
> The initial Super Admin must be created using an explicitly verified administrative SQL operation.

### Step 1: Create the User Account in Supabase Auth
Option A (Via Supabase Web Dashboard):
1. Go to your Supabase Dashboard: [https://supabase.com/dashboard/project/mqbegmviywgktnstaxpk/auth/users](https://supabase.com/dashboard/project/mqbegmviywgktnstaxpk/auth/users)
2. Click **Add User** -> **Create User**.
3. Enter the designated Chief Editor email (e.g. `admin@azaadsamachar.com`) and a strong temporary password.
4. Check **Auto Confirm User?** -> Click **Create User**.
5. Note down the generated `User UID` (e.g. `a1b2c3d4-e5f6-7890-abcd-ef1234567890`).

### Step 2: Execute the Secure Bootstrap SQL Script
Open the **SQL Editor** in the Supabase Dashboard and run:

```sql
-- Replace 'admin@azaadsamachar.com' with your actual registered email
SELECT public.bootstrap_super_admin('admin@azaadsamachar.com');
```

Alternatively, run the direct verified upsert query:

```sql
INSERT INTO public.profiles (
  id,
  display_name,
  display_name_hindi,
  email,
  role,
  status,
  desk,
  bio
) VALUES (
  'PASTE_USER_UID_HERE'::uuid,
  'Chief Editor',
  'प्रधान संपादक',
  'admin@azaadsamachar.com',
  'super_admin',
  'active',
  'Executive Desk',
  'Chief Editor and Administrator of Azaad Samachar Media Network'
)
ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin',
  status = 'active',
  updated_at = NOW();
```

### Step 3: Verify Role Grant
Verify by running:
```sql
SELECT id, display_name, email, role, status FROM public.profiles WHERE email = 'admin@azaadsamachar.com';
```
Output must show `role = 'super_admin'` and `status = 'active'`.

---

## 4. Supabase Dashboard URL Configuration

To ensure seamless authentication, session restoration, and password recovery redirects:

1. Open your Supabase Dashboard: **Authentication** -> **URL Configuration**.
2. **Site URL:**
   - Development: `http://localhost:5173`
   - Production (Hostinger): `https://azaadsamachar.com`
3. **Redirect URLs (Allow list):** Add the following trusted origins:
   ```
   http://localhost:5173/**
   http://localhost:5173/admin/login
   https://azaadsamachar.com/**
   https://azaadsamachar.com/admin/login
   ```
4. **Email Templates:**
   - Under **Authentication** -> **Email Templates** -> **Reset Password**, ensure the action URL is set to `{{ .ConfirmationURL }}`.

---

## 5. Local Testing & Verification Guide

### 1. Test Demo Mode (Offline / Prototype Validation)
- Navigate to `/admin/login`.
- Click **"Enter Demo Dashboard"**.
- Confirms entry into `/admin` without requiring network credentials.

### 2. Test Invalid Credentials
- Enter `unknown@azaadsamachar.com` and password `wrongpass`.
- Click **Sign In**.
- Confirms generic error message: *"अमान्य ईमेल या पासवर्ड। कृपया अपने विवरण पुनः जांचें।"* (Prevents account existence leakage).

### 3. Test Password Recovery Request
- Click **"पासवर्ड भूल गए?"**.
- Enter your email and click **"रीसेट लिंक भेजें"**.
- Confirms receipt of generic confirmation notice without leaking unregistered emails.

### 4. Test Protected Route Guard
- Open incognito window and navigate directly to `http://localhost:5173/admin/news`.
- Verify automatic redirection to `http://localhost:5173/admin/login?redirect=%2Fadmin%2Fnews`.
- Verify that attempting open redirects (e.g. `?redirect=https://evil.com`) is sanitized to `/admin`.
