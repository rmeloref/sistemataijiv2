import { createClient } from './server'

export type SaudeFeminina = {
  queixa_principal: string[]
  queixa_outro: string
  freq_ciclo: string
  duracao_fluxo: string
  intensidade: string[]
  aparencia: string[]
  dor_pelvica: 'sim' | 'nao' | ''
  dor_pelvica_tipo: string[]
  dor_pelvica_momento: string[]
  observacoes: string
}

export type Anamnese = {
  id: string
  patient_id: string
  customer_id: string
  queixa_principal: string | null
  queixas_secundarias: string | null
  historico_queixa: string | null
  motivo_tratamento: string | null
  tratamentos_anteriores: string[]
  tratamento_outro: string | null
  diabetes: 'nao' | 'sim' | 'pre' | null
  hipertensao: 'nao' | 'sim' | 'controlada' | null
  marcapasso: boolean
  desfibrilador: boolean
  gestante_1tri: boolean
  hemofilia: boolean
  implante_metalico: boolean
  contra_outro: string | null
  alerta_seguranca: string | null
  saude_feminina: SaudeFeminina | null
  created_at: string
  updated_at: string
}

export type UpsertAnamneseInput = Omit<Anamnese, 'id' | 'created_at' | 'updated_at'>

export async function getAnamnese(patientId: string): Promise<Anamnese | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('anamnese')
    .select('*')
    .eq('patient_id', patientId)
    .single()

  return data ?? null
}

export async function upsertAnamnese(input: UpsertAnamneseInput): Promise<Anamnese> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('anamnese')
    .upsert(input, { onConflict: 'patient_id' })
    .select()
    .single()

  if (error) throw error
  return data
}
