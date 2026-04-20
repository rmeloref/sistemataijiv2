import { createClient } from './server'

export type Lancamento = {
  id: string
  customer_id: string
  tipo: 'receita' | 'despesa'
  categoria: string
  descricao: string | null
  valor: number
  data: string
  forma_pagamento: string | null
  observacoes: string | null
  created_at: string
  updated_at: string
}

export type CreateLancamentoInput = {
  tipo: 'receita' | 'despesa'
  categoria: string
  descricao?: string
  valor: number
  data: string
  forma_pagamento?: string
  observacoes?: string
}

export type ChartMonth = {
  label: string
  mes: string
  receita: number
  despesa: number
}

// ── helpers ───────────────────────────────────────────────────────────────────

function monthRange(year: number, month: number) {
  const from = new Date(year, month - 1, 1)
  const to   = new Date(year, month, 0, 23, 59, 59, 999)
  return { from, to }
}

const MONTH_LABELS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

// ── queries ───────────────────────────────────────────────────────────────────

export async function getLancamentos(year: number, month: number): Promise<Lancamento[]> {
  const supabase = await createClient()
  const { from, to } = monthRange(year, month)

  const { data, error } = await supabase
    .from('lancamentos')
    .select('*')
    .gte('data', from.toISOString().split('T')[0])
    .lte('data', to.toISOString().split('T')[0])
    .order('data', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getAppointmentRevenue(year: number, month: number): Promise<number> {
  const supabase = await createClient()
  const { from, to } = monthRange(year, month)
  const now = new Date()

  const { data, error } = await supabase
    .from('appointments')
    .select('payment_amount')
    .eq('status', 'confirmado')
    .lt('starts_at', now.toISOString())
    .gte('starts_at', from.toISOString())
    .lte('starts_at', to.toISOString())
    .not('payment_amount', 'is', null)

  if (error) throw error
  return (data ?? []).reduce((sum, a) => sum + (a.payment_amount ?? 0), 0)
}

export async function getChartData(selectedYear: number, selectedMonth: number): Promise<ChartMonth[]> {
  const supabase = await createClient()

  // 6-month window ending on selected month
  const months: { year: number; month: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(selectedYear, selectedMonth - 1 - i, 1)
    months.push({ year: d.getFullYear(), month: d.getMonth() + 1 })
  }

  const earliest = months[0]
  const latest   = months[months.length - 1]
  const rangeFrom = new Date(earliest.year, earliest.month - 1, 1)
  const rangeTo   = new Date(latest.year,   latest.month,       0, 23, 59, 59)
  const now       = new Date()

  const [lancamentosRes, appointmentsRes] = await Promise.all([
    supabase
      .from('lancamentos')
      .select('tipo, valor, data')
      .gte('data', rangeFrom.toISOString().split('T')[0])
      .lte('data', rangeTo.toISOString().split('T')[0]),
    supabase
      .from('appointments')
      .select('payment_amount, starts_at')
      .eq('status', 'confirmado')
      .lt('starts_at', now.toISOString())
      .gte('starts_at', rangeFrom.toISOString())
      .lte('starts_at', rangeTo.toISOString())
      .not('payment_amount', 'is', null),
  ])

  if (lancamentosRes.error) throw lancamentosRes.error
  if (appointmentsRes.error) throw appointmentsRes.error

  const lancamentos  = lancamentosRes.data  ?? []
  const appointments = appointmentsRes.data ?? []

  return months.map(({ year, month }) => {
    const { from, to } = monthRange(year, month)
    const fromStr = from.toISOString().split('T')[0]
    const toStr   = to.toISOString().split('T')[0]

    const manualReceita = lancamentos
      .filter(l => l.tipo === 'receita' && l.data >= fromStr && l.data <= toStr)
      .reduce((s, l) => s + l.valor, 0)

    const apptReceita = appointments
      .filter(a => a.starts_at >= from.toISOString() && a.starts_at <= to.toISOString())
      .reduce((s, a) => s + (a.payment_amount ?? 0), 0)

    const despesa = lancamentos
      .filter(l => l.tipo === 'despesa' && l.data >= fromStr && l.data <= toStr)
      .reduce((s, l) => s + l.valor, 0)

    return {
      label:   MONTH_LABELS[month - 1],
      mes:     `${year}-${String(month).padStart(2, '0')}`,
      receita: manualReceita + apptReceita,
      despesa,
    }
  })
}
