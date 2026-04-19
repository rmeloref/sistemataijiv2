'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createPatient, updatePatient, deletePatient, isCpfTaken } from '@/lib/supabase/patients'
import { z } from 'zod'

const schema = z.object({
  full_name:     z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  email:         z.string().email('E-mail inválido').optional().or(z.literal('')),
  phone:         z.string().optional(),
  date_of_birth: z.string().optional(),
  cpf:           z.string().optional(),
  sex:           z.enum(['masculino', 'feminino']).optional().or(z.literal('')),
})

export async function createPatientAction(formData: FormData) {
  const raw = {
    full_name:     formData.get('full_name') as string,
    email:         formData.get('email') as string,
    phone:         formData.get('phone') as string,
    date_of_birth: formData.get('date_of_birth') as string,
    cpf:           formData.get('cpf') as string,
    sex:           formData.get('sex') as string,
  }

  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const cpf = parsed.data.cpf || undefined
  if (cpf) {
    const taken = await isCpfTaken(cpf)
    if (taken) return { error: 'Este CPF já está cadastrado para outro paciente.' }
  }

  try {
    await createPatient({
      full_name:     parsed.data.full_name,
      email:         parsed.data.email || undefined,
      phone:         parsed.data.phone || undefined,
      date_of_birth: parsed.data.date_of_birth || undefined,
      cpf,
      sex:           (parsed.data.sex || undefined) as 'masculino' | 'feminino' | undefined,
    })
    revalidatePath('/pacientes')
    return { success: true }
  } catch (err) {
    return { error: 'Erro ao criar paciente. Tente novamente.' }
  }
}

export async function updatePatientAction(id: string, formData: FormData) {
  const raw = {
    full_name:     formData.get('full_name') as string,
    email:         formData.get('email') as string,
    phone:         formData.get('phone') as string,
    date_of_birth: formData.get('date_of_birth') as string,
    cpf:           formData.get('cpf') as string,
    sex:           formData.get('sex') as string,
  }

  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const cpf = parsed.data.cpf || undefined
  if (cpf) {
    const taken = await isCpfTaken(cpf, id)
    if (taken) return { error: 'Este CPF já está cadastrado para outro paciente.' }
  }

  try {
    await updatePatient(id, {
      full_name:     parsed.data.full_name,
      email:         parsed.data.email || undefined,
      phone:         parsed.data.phone || undefined,
      date_of_birth: parsed.data.date_of_birth || undefined,
      cpf,
      sex:           (parsed.data.sex || undefined) as 'masculino' | 'feminino' | undefined,
    })
    revalidatePath(`/pacientes/${id}`)
    return { success: true }
  } catch (err) {
    console.error('[updatePatientAction]', err)
    const msg = err instanceof Error ? err.message : JSON.stringify(err)
    return { error: msg }
  }
}

export async function deletePatientAction(id: string) {
  try {
    await deletePatient(id)
    revalidatePath('/pacientes')
  } catch (err) {
    return { error: 'Erro ao excluir paciente.' }
  }
  redirect('/pacientes')
}
