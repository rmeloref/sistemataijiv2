-- =============================================================================
-- Migration: anamnese
-- Purpose : Patient anamnesis. One record per patient (upsert pattern).
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.anamnese (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id            uuid        NOT NULL UNIQUE REFERENCES public.patients(id) ON DELETE CASCADE,
  customer_id           uuid        NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,

  -- Queixas e histórico
  queixa_principal      text,
  queixas_secundarias   text,
  historico_queixa      text,
  motivo_tratamento     text,

  -- Tratamentos anteriores
  tratamentos_anteriores  text[]    NOT NULL DEFAULT '{}',
  tratamento_outro        text,

  -- Condições de saúde
  diabetes              text        CHECK (diabetes IN ('nao', 'sim', 'pre')),
  hipertensao           text        CHECK (hipertensao IN ('nao', 'sim', 'controlada')),

  -- Contraindicações
  marcapasso            boolean     NOT NULL DEFAULT false,
  desfibrilador         boolean     NOT NULL DEFAULT false,
  gestante_1tri         boolean     NOT NULL DEFAULT false,
  hemofilia             boolean     NOT NULL DEFAULT false,
  implante_metalico     boolean     NOT NULL DEFAULT false,
  contra_outro          text,

  -- Alerta de segurança (texto livre adicional)
  alerta_seguranca      text,

  -- Saúde feminina (only populated when patient.sex = 'feminino')
  saude_feminina        jsonb,

  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS anamnese_patient_id_idx  ON public.anamnese(patient_id);
CREATE INDEX IF NOT EXISTS anamnese_customer_id_idx ON public.anamnese(customer_id);

ALTER TABLE public.anamnese ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER anamnese_updated_at
  BEFORE UPDATE ON public.anamnese
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ── RLS policies ──────────────────────────────────────────────────────────────

CREATE POLICY "anamnese: select own customer"
  ON public.anamnese FOR SELECT
  TO authenticated
  USING (customer_id = my_customer_id());

CREATE POLICY "anamnese: insert own customer"
  ON public.anamnese FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = my_customer_id());

CREATE POLICY "anamnese: update own customer"
  ON public.anamnese FOR UPDATE
  TO authenticated
  USING (customer_id = my_customer_id());

CREATE POLICY "anamnese: delete admin only"
  ON public.anamnese FOR DELETE
  TO authenticated
  USING (
    customer_id = my_customer_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
