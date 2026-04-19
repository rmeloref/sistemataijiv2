'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updatePatientAction } from '@/app/(clinic)/pacientes/actions'
import type { Patient } from '@/lib/supabase/patients'

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

function formatSex(sex: string | null) {
  if (sex === 'masculino') return 'Masculino'
  if (sex === 'feminino') return 'Feminino'
  return '—'
}

export function DadosPessoaisTab({ patient }: { patient: Patient }) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updatePatientAction(patient.id, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        router.refresh()
        setEditing(false)
      }
    })
  }

  return (
    <div className="rounded-lg border border-border p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Dados Pessoais</h2>
        {!editing ? (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="w-3.5 h-3.5 mr-1.5" />
            Editar
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { setEditing(false); setError(null) }} disabled={isPending}>
              Cancelar
            </Button>
            <Button size="sm" form="dados-pessoais-form" type="submit" disabled={isPending}>
              {isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        )}
      </div>

      {/* Form */}
      <form id="dados-pessoais-form" ref={formRef} onSubmit={handleSave}>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">

          <div className="space-y-1.5">
            <Label htmlFor="full_name">Nome completo</Label>
            {editing ? (
              <Input id="full_name" name="full_name" defaultValue={patient.full_name} required />
            ) : (
              <p className="font-medium text-foreground py-2">{patient.full_name}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="date_of_birth">Data de nascimento</Label>
            {editing ? (
              <Input id="date_of_birth" name="date_of_birth" type="date" defaultValue={patient.date_of_birth ?? ''} />
            ) : (
              <p className="font-medium text-foreground py-2">{formatDate(patient.date_of_birth)}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sex">Sexo</Label>
            {editing ? (
              <select
                id="sex"
                name="sex"
                defaultValue={patient.sex ?? ''}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Selecionar</option>
                <option value="feminino">Feminino</option>
                <option value="masculino">Masculino</option>
              </select>
            ) : (
              <p className="font-medium text-foreground py-2">{formatSex(patient.sex)}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cpf">CPF</Label>
            {editing ? (
              <Input id="cpf" name="cpf" placeholder="000.000.000-00" defaultValue={patient.cpf ?? ''} />
            ) : (
              <p className="font-medium text-foreground py-2">{patient.cpf ?? '—'}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Telefone</Label>
            {editing ? (
              <Input id="phone" name="phone" placeholder="(11) 99999-9999" defaultValue={patient.phone ?? ''} />
            ) : (
              <p className="font-medium text-foreground py-2">{patient.phone ?? '—'}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            {editing ? (
              <Input id="email" name="email" type="email" defaultValue={patient.email ?? ''} />
            ) : (
              <p className="font-medium text-foreground py-2">{patient.email ?? '—'}</p>
            )}
          </div>

        </div>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </form>

    </div>
  )
}
