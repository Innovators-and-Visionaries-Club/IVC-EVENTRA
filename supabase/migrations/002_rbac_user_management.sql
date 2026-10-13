-- ==============================================================================
-- IVC PULSE: Role-Based Access Control (RBAC) & Profile Security Migration
-- Target: Supabase PostgreSQL (auth schema integration + RLS + Triggers)
-- File: supabase/migrations/002_rbac_user_management.sql
-- ==============================================================================

-- 1. EXTEND USER ROLE ENUM TO INCLUDE 'leader'
DO $$ BEGIN
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'leader';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. HARDENED TRIGGER: Automatic Participant Default on Signup
-- Ensures public signups are ALWAYS 'participant', strictly ignoring any client-sent role metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    created_at
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    'participant'::user_role, -- STRICT: Always default to participant. Never trust client metadata for roles.
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name);
    -- NOTE: DO NOT update role on conflict here; only admins can alter roles via admin actions.
  RETURN new;
END;
$$;

-- Drop and re-attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2.5 FIX SUPABASE AUTH NULL TOKEN BUG (Causes "Database error querying schema")
-- Supabase GoTrue expects token columns to be empty strings (''), not NULL.
UPDATE auth.users
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  reauthentication_token = COALESCE(reauthentication_token, '')
WHERE 
  confirmation_token IS NULL
  OR recovery_token IS NULL
  OR email_change_token_new IS NULL
  OR email_change IS NULL
  OR phone_change IS NULL
  OR phone_change_token IS NULL
  OR email_change_token_current IS NULL
  OR reauthentication_token IS NULL;

-- 3. HELPER FUNCTION: Check Admin Role Safely (Supports service_role & avoids recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Service role / backend execution always has full admin privilege
  IF (current_user = 'postgres' OR auth.role() = 'service_role') THEN
    RETURN true;
  END IF;

  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- 4. DATABASE-LEVEL DEFENSE: Prevent Non-Admins From Modifying the 'role' Column
CREATE OR REPLACE FUNCTION public.prevent_non_admin_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If role is being changed and the executing user is not an admin or service_role, reject
  IF (NEW.role IS DISTINCT FROM OLD.role) AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden: Only administrators can modify user roles or elevate permissions.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_role_change_permissions ON public.profiles;
CREATE TRIGGER enforce_role_change_permissions
  BEFORE UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_non_admin_role_change();

-- 5. ROW LEVEL SECURITY (RLS) POLICIES FOR public.profiles (NON-RECURSIVE)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing profiles policies
DROP POLICY IF EXISTS "Profiles readable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins have full access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile non-role fields" ON public.profiles;

-- Policy 1: Authenticated users can view profiles
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Policy 2: Users can update their own personal info (name, email)
CREATE POLICY "Users can update own profile non-role fields"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

