-- =============================================================================
-- Migration: appointments
-- Purpose : Clinic scheduling. Multi-tenant, RLS enforced.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.appointments (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id      uuid        NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  patient_id       uuid        REFERENCES public.patients(id) ON DELETE SET NULL,

  starts_at        timestamptz NOT NULL,
  ends_at          timestamptz NOT NULL,

  status           text        NOT NULL DEFAULT 'a_confirmar'
                               CHECK (status IN ('a_confirmar', 'confirmado', 'cancelado')),

  -- recurrence
  recurrence       text        NOT NULL DEFAULT 'none'
                               CHECK (recurrence IN ('none', 'weekly', 'biweekly', 'monthly')),
  recurrence_until date,

  notes            text,

  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS appointments_customer_id_idx  ON public.appointments(customer_id);
CREATE INDEX IF NOT EXISTS appointments_patient_id_idx   ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS appointments_starts_at_idx    ON public.appointments(starts_at);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ── RLS policies ──────────────────────────────────────────────────────────────

CREATE POLICY "appointments: select own customer"
  ON public.appointments FOR SELECT
  TO authenticated
  USING (customer_id = my_customer_id());

CREATE POLICY "appointments: insert own customer"
  ON public.appointments FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = my_customer_id());

CREATE POLICY "appointments: update own customer"
  ON public.appointments FOR UPDATE
  TO authenticated
  USING (customer_id = my_customer_id());

CREATE POLICY "appointments: delete own customer"
  ON public.appointments FOR DELETE
  TO authenticated
  USING (customer_id = my_customer_id());
