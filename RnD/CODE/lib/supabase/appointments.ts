import { createClient } from './client'

export type AppointmentStatus    = 'a_confirmar' | 'confirmado' | 'cancelado'
export type AppointmentRecurrence = 'none' | 'weekly' | 'biweekly' | 'monthly'

export type Appointment = {
  id: string
  customer_id: string
  patient_id: string | null
  patient: { id: string; full_name: string } | null
  starts_at: string
  ends_at: string
  status: AppointmentStatus
  recurrence: AppointmentRecurrence
  recurrence_until: string | null
  payment_amount: number | null
  paid: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export type CreateAppointmentInput = {
  customer_id: string
  patient_id: string | null
  starts_at: string
  ends_at: string
  status: AppointmentStatus
  recurrence: AppointmentRecurrence
  recurrence_until: string | null
  payment_amount: number | null
  paid: boolean
}

// ── date range helpers ────────────────────────────────────────────────────────

export async function getAppointments(from: Date, to: Date): Promise<Appointment[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('appointments')
    .select('*, patient:patients(id, full_name)')
    .gte('starts_at', from.toISOString())
    .lte('starts_at', to.toISOString())
    .order('starts_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as Appointment[]
}

export async function createAppointments(inputs: CreateAppointmentInput[]): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('appointments').insert(inputs)
  if (error) throw error
}

export async function updateAppointment(
  id: string,
  input: Partial<Omit<CreateAppointmentInput, 'customer_id'>>
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('appointments').update(input).eq('id', id)
  if (error) throw error
}

export async function deleteAppointment(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('appointments').delete().eq('id', id)
  if (error) throw error
}

// ── recurrence helpers ────────────────────────────────────────────────────────

const RECURRENCE_DAYS: Record<AppointmentRecurrence, number> = {
  none:     0,
  weekly:   7,
  biweekly: 14,
  monthly:  30,
}

export function buildRecurringInputs(
  base: CreateAppointmentInput
): CreateAppointmentInput[] {
  if (base.recurrence === 'none' || !base.recurrence_until) return [base]

  const interval = RECURRENCE_DAYS[base.recurrence]
  const until    = new Date(base.recurrence_until)
  const inputs: CreateAppointmentInput[] = [base]

  let current = new Date(base.starts_at)
  const durationMs = new Date(base.ends_at).getTime() - current.getTime()

  while (true) {
    current = new Date(current.getTime() + interval * 86_400_000)
    if (current > until) break
    const ends = new Date(current.getTime() + durationMs)
    inputs.push({
      ...base,
      starts_at: current.toISOString(),
      ends_at:   ends.toISOString(),
    })
  }

  return inputs
}
