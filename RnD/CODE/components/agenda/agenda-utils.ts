export type CalendarView = 'month' | 'week' | 'day'

// ── date helpers ──────────────────────────────────────────────────────────────

export function startOfWeek(d: Date): Date {
  const day = d.getDay() // 0=Sun
  const diff = day === 0 ? -6 : 1 - day // Mon as first day
  const result = new Date(d)
  result.setDate(d.getDate() + diff)
  result.setHours(0, 0, 0, 0)
  return result
}

export function startOfDay(d: Date): Date {
  const r = new Date(d)
  r.setHours(0, 0, 0, 0)
  return r
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export function addMonths(d: Date, n: number): Date {
  const r = new Date(d)
  r.setMonth(r.getMonth() + n)
  return r
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  )
}

export function isToday(d: Date): boolean {
  return isSameDay(d, new Date())
}

export function formatTime(d: Date): string {
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function formatDateHeader(view: CalendarView, date: Date): string {
  if (view === 'day') {
    return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }
  if (view === 'week') {
    const mon = startOfWeek(date)
    const sun = addDays(mon, 6)
    const sameMonth = mon.getMonth() === sun.getMonth()
    if (sameMonth) {
      return `${mon.getDate()} – ${sun.getDate()} de ${mon.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`
    }
    return `${mon.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} – ${sun.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}`
  }
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

// ── range helpers ─────────────────────────────────────────────────────────────

export function viewRange(view: CalendarView, date: Date): [Date, Date] {
  if (view === 'day') {
    const s = startOfDay(date)
    return [s, addDays(s, 1)]
  }
  if (view === 'week') {
    const s = startOfWeek(date)
    return [s, addDays(s, 7)]
  }
  // month — include padding rows
  const first = new Date(date.getFullYear(), date.getMonth(), 1)
  const last  = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  return [addDays(startOfWeek(first), -1), addDays(last, 14)]
}

// ── status helpers ────────────────────────────────────────────────────────────

export const STATUS_LABEL: Record<string, string> = {
  a_confirmar: 'A confirmar',
  confirmado:  'Confirmado',
  cancelado:   'Cancelado',
}

export const STATUS_COLOR: Record<string, string> = {
  a_confirmar: 'bg-warning/20 text-warning-foreground border-warning/40',
  confirmado:  'bg-primary/15 text-primary border-primary/30',
  cancelado:   'bg-destructive/10 text-destructive border-destructive/30 line-through',
}

export const STATUS_DOT: Record<string, string> = {
  a_confirmar: 'bg-yellow-500',
  confirmado:  'bg-primary',
  cancelado:   'bg-muted-foreground',
}

// ── overlap layout ────────────────────────────────────────────────────────────

export type ApptLayout = { col: number; cols: number }

export function layoutAppointments(appts: { id: string; starts_at: string; ends_at: string }[]): Map<string, ApptLayout> {
  const result = new Map<string, ApptLayout>()
  if (!appts.length) return result

  const sorted = [...appts].sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
  )

  const colEnds: number[] = []
  const cols: number[] = []

  for (const appt of sorted) {
    const start = new Date(appt.starts_at).getTime()
    const end   = new Date(appt.ends_at).getTime()
    let col = colEnds.findIndex(e => e <= start)
    if (col === -1) { col = colEnds.length; colEnds.push(end) }
    else colEnds[col] = end
    cols.push(col)
  }

  const totalCols = colEnds.length
  sorted.forEach((appt, i) => result.set(appt.id, { col: cols[i], cols: totalCols }))

  return result
}
