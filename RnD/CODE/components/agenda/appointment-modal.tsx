'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { X, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import {
  createAppointments, updateAppointment, deleteAppointment,
  buildRecurringInputs,
  type Appointment, type AppointmentStatus, type AppointmentRecurrence,
} from '@/lib/supabase/appointments'
import { STATUS_LABEL } from './agenda-utils'

const DURATIONS = [
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '60 min', value: 60 },
  { label: '90 min', value: 90 },
]

const RECURRENCES: { label: string; value: AppointmentRecurrence }[] = [
  { label: 'Não repetir',      value: 'none' },
  { label: 'Toda semana',      value: 'weekly' },
  { label: 'A cada 2 semanas', value: 'biweekly' },
  { label: 'Todo mês',         value: 'monthly' },
]

const STATUSES: { label: string; value: AppointmentStatus }[] = [
  { label: 'A confirmar', value: 'a_confirmar' },
  { label: 'Confirmado',  value: 'confirmado' },
  { label: 'Cancelado',   value: 'cancelado' },
]

type Patient = { id: string; full_name: string }

function toDateInput(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function toTimeInput(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

type Props = {
  initialDate?: Date
  appointment?: Appointment | null
  customerId: string
  onClose: () => void
  onSaved: () => void
}

export function AppointmentModal({ initialDate, appointment, customerId, onClose, onSaved }: Props) {
  const [patients,       setPatients]       = useState<Patient[]>([])
  const [patientSearch,  setPatientSearch]  = useState(appointment?.patient?.full_name ?? '')
  const [patientId,      setPatientId]      = useState<string | null>(appointment?.patient_id ?? null)
  const [showDropdown,   setShowDropdown]   = useState(false)
  const [date,           setDate]           = useState(
    appointment ? toDateInput(new Date(appointment.starts_at)) : toDateInput(initialDate ?? new Date())
  )
  const [time,           setTime]           = useState(
    appointment ? toTimeInput(new Date(appointment.starts_at)) : toTimeInput(initialDate ?? new Date())
  )
  const [duration,       setDuration]       = useState(() => {
    if (!appointment) return 60
    return (new Date(appointment.ends_at).getTime() - new Date(appointment.starts_at).getTime()) / 60_000
  })
  const [status,         setStatus]         = useState<AppointmentStatus>(appointment?.status ?? 'a_confirmar')
  const [recurrence,     setRecurrence]     = useState<AppointmentRecurrence>(appointment?.recurrence ?? 'none')
  const [recurrenceUntil, setRecurrenceUntil] = useState(appointment?.recurrence_until ?? '')
  const [paymentAmount,  setPaymentAmount]  = useState(appointment?.payment_amount?.toString() ?? '')
  const [paid,           setPaid]           = useState(appointment?.paid ?? false)
  const [error,          setError]          = useState<string | null>(null)
  const [showDelete,     setShowDelete]     = useState(false)
  const [isPending,      startTransition]   = useTransition()
  const searchRef = useRef<HTMLInputElement>(null)

  // Load patients once
  useEffect(() => {
    const supabase = createClient()
    supabase.from('patients').select('id, full_name').order('full_name').then(({ data }) => {
      setPatients(data ?? [])
    })
  }, [])

  const filteredPatients = patients.filter((p) =>
    p.full_name.toLowerCase().includes(patientSearch.toLowerCase())
  )

  function buildStartsAt(): Date {
    const [year, month, day] = date.split('-').map(Number)
    const [h, m] = time.split(':').map(Number)
    return new Date(year, month - 1, day, h, m, 0, 0)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const startsAt = buildStartsAt()
    const endsAt   = new Date(startsAt.getTime() + duration * 60_000)

    startTransition(async () => {
      try {
        if (appointment) {
          await updateAppointment(appointment.id, {
            patient_id:      patientId,
            starts_at:       startsAt.toISOString(),
            ends_at:         endsAt.toISOString(),
            status,
            recurrence,
            recurrence_until: recurrence !== 'none' ? recurrenceUntil || null : null,
            payment_amount:  paymentAmount ? parseFloat(paymentAmount) : null,
            paid,
          })
        } else {
          const base = {
            customer_id:     customerId,
            patient_id:      patientId,
            starts_at:       startsAt.toISOString(),
            ends_at:         endsAt.toISOString(),
            status,
            recurrence,
            recurrence_until: recurrence !== 'none' ? recurrenceUntil || null : null,
            payment_amount:  paymentAmount ? parseFloat(paymentAmount) : null,
            paid,
          }
          await createAppointments(buildRecurringInputs(base))
        }
        onSaved()
        onClose()
      } catch (err) {
        console.error(err)
        setError('Erro ao salvar. Tente novamente.')
      }
    })
  }

  async function handleDelete() {
    if (!appointment) return
    startTransition(async () => {
      try {
        await deleteAppointment(appointment.id)
        onSaved()
        onClose()
      } catch {
        setError('Erro ao excluir.')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md mx-4 bg-background rounded-xl shadow-xl border border-border">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">
            {appointment ? 'Editar consulta' : 'Nova consulta'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          {/* Patient search */}
          <div className="space-y-1.5 relative">
            <Label htmlFor="patient">Paciente</Label>
            <Input
              ref={searchRef}
              id="patient"
              value={patientSearch}
              onChange={(e) => {
                setPatientSearch(e.target.value)
                setPatientId(null)
                setShowDropdown(true)
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Buscar paciente..."
              autoComplete="off"
            />
            {showDropdown && patientSearch.length > 0 && filteredPatients.length > 0 && (
              <div className="absolute z-20 top-full mt-1 w-full bg-background border border-border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                {filteredPatients.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      setPatientId(p.id)
                      setPatientSearch(p.full_name)
                      setShowDropdown(false)
                    }}
                  >
                    {p.full_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date + time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="date">Data</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="time">Horário</Label>
              <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
            </div>
          </div>

          {/* Duration + status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="duration">Duração</Label>
              <select
                id="duration"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {DURATIONS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Recurrence (only on create) */}
          {!appointment && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="recurrence">Repetir</Label>
                <select
                  id="recurrence"
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value as AppointmentRecurrence)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {RECURRENCES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              {recurrence !== 'none' && (
                <div className="space-y-1.5">
                  <Label htmlFor="recurrence_until">Repetir até</Label>
                  <Input
                    id="recurrence_until"
                    type="date"
                    value={recurrenceUntil}
                    onChange={(e) => setRecurrenceUntil(e.target.value)}
                    min={date}
                    required
                  />
                </div>
              )}
            </div>
          )}

          {/* Payment */}
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="payment_amount">Valor da consulta</Label>
              <Input
                id="payment_amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 pb-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={paid}
                onChange={(e) => setPaid(e.target.checked)}
                className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
              />
              <span className="text-sm text-foreground">Pago</span>
            </label>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {/* Actions */}
          <div className="flex items-center justify-between pt-1">
            {appointment ? (
              !showDelete ? (
                <button
                  type="button"
                  onClick={() => setShowDelete(true)}
                  className="inline-flex items-center gap-1.5 text-sm text-destructive/70 hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Excluir
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-destructive font-medium">Tem certeza?</span>
                  <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={isPending}>
                    Confirmar
                  </Button>
                  <button type="button" onClick={() => setShowDelete(false)} className="text-xs text-muted-foreground hover:text-foreground">
                    Cancelar
                  </button>
                </div>
              )
            ) : <div />}

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Salvando...' : appointment ? 'Salvar' : 'Agendar'}
              </Button>
            </div>
          </div>

        </form>
      </div>
    </div>
  )
}
