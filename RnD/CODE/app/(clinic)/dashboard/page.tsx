import { getCurrentProfile } from '@/lib/supabase/profile'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function formatDuration(startsAt: string, endsAt: string) {
  const mins = Math.round((new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60000)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}min`
  return m ? `${h}h${m}min` : `${h}h`
}

const STATUS_BADGE = {
  confirmado:  { label: 'Confirmado',  cls: 'bg-primary/10 text-primary' },
  a_confirmar: { label: 'A confirmar', cls: 'bg-yellow-500/10 text-yellow-700' },
  cancelado:   { label: 'Cancelado',   cls: 'bg-destructive/10 text-destructive' },
}

export default async function DashboardPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')

  const now   = new Date()
  const start = new Date(now); start.setHours(0, 0, 0, 0)
  const end   = new Date(now); end.setHours(23, 59, 59, 999)

  const supabase = await createClient()
  const { data } = await supabase
    .from('appointments')
    .select('*, patient:patients(id, full_name)')
    .eq('customer_id', profile.customer_id)
    .gte('starts_at', start.toISOString())
    .lte('starts_at', end.toISOString())
    .order('starts_at', { ascending: true })

  const appointments = (data ?? []) as {
    id: string
    starts_at: string
    ends_at: string
    status: keyof typeof STATUS_BADGE
    notes: string | null
    payment_amount: number | null
    patient: { id: string; full_name: string } | null
  }[]

  const todayLabel = now.toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="p-8 max-w-2xl mx-auto">

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Agenda do Dia</h1>
        <p className="text-sm text-muted-foreground mt-0.5 capitalize">{todayLabel}</p>
      </div>

      {appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="text-5xl mb-4">📅</span>
          <p className="font-medium text-foreground">Nenhum agendamento hoje</p>
          <p className="text-sm text-muted-foreground mt-1">Sua agenda está livre.</p>
        </div>
      ) : (
        <ol className="relative border-l border-border">
          {appointments.map((a) => {
            const apptStart = new Date(a.starts_at)
            const apptEnd   = new Date(a.ends_at)
            const isNow     = apptStart <= now && now < apptEnd
            const isPast    = apptEnd <= now
            const badge     = STATUS_BADGE[a.status] ?? STATUS_BADGE.a_confirmar

            return (
              <li key={a.id} className="ml-6 pb-6 last:pb-0">

                {/* Timeline dot */}
                <span className={`absolute -left-[9px] mt-4 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 ${
                  isNow
                    ? 'border-primary bg-primary'
                    : isPast
                    ? 'border-border bg-muted'
                    : 'border-border bg-background'
                }`} />

                <div className={`rounded-lg border p-4 ${
                  isNow ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'
                }`}>

                  {/* Top row: times + badges */}
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 font-mono text-sm">
                      <span className={`font-semibold tabular-nums ${isPast ? 'text-muted-foreground' : 'text-foreground'}`}>
                        {formatTime(a.starts_at)}
                      </span>
                      <span className="text-muted-foreground">–</span>
                      <span className="text-muted-foreground tabular-nums">
                        {formatTime(a.ends_at)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isNow && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold text-primary-foreground">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground animate-pulse" />
                          Agora
                        </span>
                      )}
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>
                  </div>

                  {/* Patient name */}
                  <p className={`mt-2 font-semibold leading-snug ${isPast ? 'text-muted-foreground' : 'text-foreground'} ${a.status === 'cancelado' ? 'line-through' : ''}`}>
                    {a.patient?.full_name ?? 'Sem paciente'}
                  </p>

                  {/* Meta: duration · price · notes */}
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDuration(a.starts_at, a.ends_at)}
                    {a.payment_amount != null ? ` · R$ ${a.payment_amount.toFixed(2).replace('.', ',')}` : ''}
                    {a.notes ? ` · ${a.notes}` : ''}
                  </p>

                </div>
              </li>
            )
          })}
        </ol>
      )}

    </div>
  )
}
