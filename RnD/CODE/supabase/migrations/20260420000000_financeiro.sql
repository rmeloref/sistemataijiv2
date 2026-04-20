-- =============================================================================
-- Migration: financeiro
-- Purpose : Add payment fields to appointments + manual lancamentos table.
-- =============================================================================

-- Payment tracking on appointments (already in TS types, now in DB)
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS payment_amount numeric(10,2),
  ADD COLUMN IF NOT EXISTS paid           boolean NOT NULL DEFAULT false;

-- =============================================================================
-- lancamentos — manual financial entries (receita or despesa)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.lancamentos (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     uuid        NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,

  tipo            text        NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  categoria       text        NOT NULL DEFAULT 'Outros',
  descricao       text,
  valor           numeric(10,2) NOT NULL CHECK (valor > 0),
  data            date        NOT NULL DEFAULT CURRENT_DATE,
  forma_pagamento text,
  observacoes     text,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lancamentos_customer_id_data_idx
  ON public.lancamentos(customer_id, data);

ALTER TABLE public.lancamentos ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER lancamentos_updated_at
  BEFORE UPDATE ON public.lancamentos
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ── RLS policies ──────────────────────────────────────────────────────────────

CREATE POLICY "lancamentos: select own customer"
  ON public.lancamentos FOR SELECT
  TO authenticated
  USING (customer_id = my_customer_id());

CREATE POLICY "lancamentos: insert own customer"
  ON public.lancamentos FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = my_customer_id());

CREATE POLICY "lancamentos: update own customer"
  ON public.lancamentos FOR UPDATE
  TO authenticated
  USING (customer_id = my_customer_id());

CREATE POLICY "lancamentos: delete own customer"
  ON public.lancamentos FOR DELETE
  TO authenticated
  USING (customer_id = my_customer_id());
