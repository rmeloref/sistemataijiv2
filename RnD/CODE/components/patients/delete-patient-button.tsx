'use client'

import { useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deletePatientAction } from '@/app/(clinic)/pacientes/actions'

export function DeletePatientButton({ patientId }: { patientId: string }) {
  const [confirm, setConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      await deletePatientAction(patientId)
    })
  }

  if (!confirm) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setConfirm(true)}
        className="text-destructive border-destructive/30 hover:bg-destructive/5 hover:border-destructive"
      >
        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
        Excluir paciente
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-destructive font-medium">Tem certeza?</span>
      <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isPending}>
        {isPending ? 'Excluindo...' : 'Confirmar'}
      </Button>
      <button
        onClick={() => setConfirm(false)}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Cancelar
      </button>
    </div>
  )
}
