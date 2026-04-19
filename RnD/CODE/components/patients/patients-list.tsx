'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CreatePatientModal } from './create-patient-modal'
import type { Patient } from '@/lib/supabase/patients'

function formatPhone(phone: string | null) {
  if (!phone) return '—'
  return phone
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

export function PatientsList({ patients }: { patients: Patient[] }) {
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const router = useRouter()

  const filtered = patients.filter((p) => {
    const q = search.toLowerCase()
    return (
      p.full_name.toLowerCase().includes(q) ||
      (p.email ?? '').toLowerCase().includes(q) ||
      (p.phone ?? '').replace(/\D/g, '').includes(q.replace(/\D/g, ''))
    )
  })

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar por nome, telefone ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="ml-auto">
          <Button onClick={() => setShowModal(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Novo paciente
          </Button>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="mt-16 text-center text-muted-foreground text-sm">
          {search ? 'Nenhum paciente encontrado.' : 'Nenhum paciente cadastrado ainda.'}
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground">
                <th className="text-left px-4 py-3 font-medium">Nome</th>
                <th className="text-left px-4 py-3 font-medium">Telefone</th>
                <th className="text-left px-4 py-3 font-medium">E-mail</th>
                <th className="text-left px-4 py-3 font-medium">Nascimento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((patient) => (
                <tr
                  key={patient.id}
                  className="hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => router.push(`/pacientes/${patient.id}`)}
                >
                  <td className="px-4 py-3 font-medium text-foreground">{patient.full_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatPhone(patient.phone)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{patient.email ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(patient.date_of_birth)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && <CreatePatientModal onClose={() => setShowModal(false)} />}
    </>
  )
}
