-- =============================================================================
-- Migration: customers and profiles
-- Purpose : Multi-tenant foundation. Every piece of clinical data will belong
--           to a customer. A profile ties an auth user to a customer + role.
-- =============================================================================


-- ── customers ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.customers (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;


-- ── profiles ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid  PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id uuid  NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  role        text  NOT NULL DEFAULT 'regular' CHECK (role IN ('admin', 'regular')),
  full_name   text  NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_customer_id ON public.profiles(customer_id);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;


-- ── updated_at trigger ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER customers_set_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ── SECURITY DEFINER helper ───────────────────────────────────────────────────
-- Returns the customer_id of the current auth user.
-- Must be SECURITY DEFINER so it bypasses RLS when called from inside a policy,
-- which avoids infinite recursion on the profiles table.

CREATE OR REPLACE FUNCTION public.my_customer_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT customer_id FROM public.profiles WHERE id = auth.uid();
$$;


-- ── RLS policies: customers ───────────────────────────────────────────────────

-- Any authenticated user can read their own customer row
CREATE POLICY "customers_select"
  ON public.customers FOR SELECT TO authenticated
  USING (id = public.my_customer_id());

-- Only admins can update their customer (e.g. clinic name/settings)
CREATE POLICY "customers_update"
  ON public.customers FOR UPDATE TO authenticated
  USING (
    id = public.my_customer_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (id = public.my_customer_id());


-- ── RLS policies: profiles ────────────────────────────────────────────────────

-- Any user can read all profiles that belong to their own customer
CREATE POLICY "profiles_select"
  ON public.profiles FOR SELECT TO authenticated
  USING (customer_id = public.my_customer_id());

-- A user can update their own profile (full_name)
-- Role changes are blocked by the trigger below regardless of this policy
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE TO authenticated
  USING  (id = auth.uid())
  WITH CHECK (id = auth.uid() AND customer_id = public.my_customer_id());

-- Admins can update any profile inside their customer (e.g. change role)
CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE TO authenticated
  USING (
    customer_id = public.my_customer_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (customer_id = public.my_customer_id());

-- Admins can insert new profiles (when inviting a new user)
CREATE POLICY "profiles_insert_admin"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (
    customer_id = public.my_customer_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can remove profiles — but not their own
CREATE POLICY "profiles_delete_admin"
  ON public.profiles FOR DELETE TO authenticated
  USING (
    id != auth.uid()
    AND customer_id = public.my_customer_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- ── Prevent role escalation ───────────────────────────────────────────────────
-- Stops a regular user from changing their own role to 'admin'.

CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = OLD.role THEN
    RETURN NEW; -- no role change, always fine
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RETURN NEW; -- requester is admin, allowed
  END IF;

  RAISE EXCEPTION 'Apenas administradores podem alterar funções de usuário';
END;
$$;

CREATE TRIGGER profiles_prevent_role_escalation
  BEFORE UPDATE OF role ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_escalation();
