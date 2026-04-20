import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/supabase/profile'
import { createClient } from '@/lib/supabase/server'
import { getLancamentos, getChartData } from '@/lib/supabase/financeiro'
import { FinanceiroDashboard } from '@/components/financeiro/financeiro-dashboard'

function parseMesParam(raw: string | undefined): { year: number; month: number; mes: string } {
  if (raw && /^\d{4}-\d{2}$/.test(raw)) {
    const [y, m] = raw.split('-').map(Number)
    if (m >= 1 && m <= 12) {
      return { year: y, month: m, mes: raw }
    }
  }
  const now = new Date()
  const year  = now.getFullYear()
  const month = now.getMonth() + 1
  return { year, month, mes: `${year}-${String(month).padStart(2, '0')}` }
}

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>
}) {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')

  const params         = await searchParams
  const { year, month, mes } = parseMesParam(params.mes)

  const supabase = await createClient()
  const now      = new Date()

  // month boundaries
  const from = new Date(year, month - 1, 1)
  const to   = new Date(year, month, 0, 23, 59, 59, 999)

  const [lancamentos, chartData, appointmentsRes] = await Promise.all([
    getLancamentos(year, month),
    getChartData(year, month),
    supabase
      .from('appointments')
      .select('payment_amount')
      .eq('customer_id', profile.customer_id)
      .eq('status', 'confirmado')
      .lt('starts_at', now.toISOString())
      .gte('starts_at', from.toISOString())
      .lte('starts_at', to.toISOString())
      .not('payment_amount', 'is', null),
  ])

  const apptRows         = appointmentsRes.data ?? []
  const appointmentRevenue = apptRows.reduce((s, a) => s + (a.payment_amount ?? 0), 0)
  const appointmentCount   = apptRows.length

  return (
    <FinanceiroDashboard
      mes={mes}
      customerId={profile.customer_id}
      lancamentos={lancamentos}
      appointmentRevenue={appointmentRevenue}
      appointmentCount={appointmentCount}
      chartData={chartData}
    />
  )
}
