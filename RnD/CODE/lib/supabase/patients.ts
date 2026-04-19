import { createClient } from './server'

export type Patient = {
  id: string
  customer_id: string
  full_name: string
  email: string | null
  phone: string | null
  date_of_birth: string | null
  cpf: string | null
  sex: 'masculino' | 'feminino' | null
  created_at: string
  updated_at: string
}

export type CreatePatientInput = {
  full_name: string
  email?: string
  phone?: string
  date_of_birth?: string
  cpf?: string
  sex?: 'masculino' | 'feminino'
}

export async function getPatientById(id: string): Promise<Patient | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function getPatients(): Promise<Patient[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .order('full_name', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function isCpfTaken(cpf: string, excludeId?: string): Promise<boolean> {
  const supabase = await createClient()
  let query = supabase
    .from('patients')
    .select('id')
    .eq('cpf', cpf)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data } = await query.limit(1)
  return (data?.length ?? 0) > 0
}

export async function updatePatient(id: string, input: Partial<CreatePatientInput>): Promise<Patient> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('patients')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deletePatient(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('patients')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function createPatient(input: CreatePatientInput): Promise<Patient> {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('customer_id')
    .eq('id', (await supabase.auth.getUser()).data.user!.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  const { data, error } = await supabase
    .from('patients')
    .insert({ ...input, customer_id: profile.customer_id })
    .select()
    .single()

  if (error) throw error
  return data
}
