-- =============================================================================
-- Migration: patients
-- Purpose : Core patient registry. Belongs to a customer (multi-tenant).
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.patients (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  uuid        NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  full_name    text        NOT NULL,
  email        text,
  phone        text,
  date_of_birth date,
  cpf          text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS patients_customer_id_idx ON public.patients(customer_id);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Trigger: keep updated_at fresh
CREATE TRIGGER patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ── RLS policies ──────────────────────────────────────────────────────────────

-- SELECT: any profile of the same customer
CREATE POLICY "patients: select own customer"
  ON public.patients FOR SELECT
  TO authenticated
  USING (customer_id = my_customer_id());

-- INSERT: any profile of the same customer (customer_id must match)
CREATE POLICY "patients: insert own customer"
  ON public.patients FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = my_customer_id());

-- UPDATE: any profile of the same customer
CREATE POLICY "patients: update own customer"
  ON public.patients FOR UPDATE
  TO authenticated
  USING (customer_id = my_customer_id());

-- DELETE: admin only
CREATE POLICY "patients: delete admin only"
  ON public.patients FOR DELETE
  TO authenticated
  USING (
    customer_id = my_customer_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
