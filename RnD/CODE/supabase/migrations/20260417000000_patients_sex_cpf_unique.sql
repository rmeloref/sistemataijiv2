-- Add sex column and enforce CPF uniqueness per customer

ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS sex text CHECK (sex IN ('masculino', 'feminino'));

-- CPF must be unique within a customer (two different customers can have same CPF)
CREATE UNIQUE INDEX IF NOT EXISTS patients_customer_cpf_unique
  ON public.patients (customer_id, cpf)
  WHERE cpf IS NOT NULL;
