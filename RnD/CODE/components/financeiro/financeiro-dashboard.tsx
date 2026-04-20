'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Plus, Trash2, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { MonthlyChart } from './monthly-chart'
import { LancamentoDialog } from './lancamento-dialog'
import type { Lancamento, ChartMonth } from '@/lib/supabase/financeiro'

const MONTH_NAMES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function parseMes(mes: string): { year: number; month: number } {
  const [y, m] = mes.split('-').map(Number)
  return { year: y, month: m }
}

type Props = {
  mes: string
  customerId: string
  lancamentos: Lancamento[]
  appointmentRevenue: number
  appointmentCount: number
  chartData: ChartMonth[]
}

export function FinanceiroDashboard({
  mes,
  customerId,
  lancamentos,
  appointmentRevenue,
  appointmentCount,
  chartData,
}: Props) {
  const router               = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const { year, month } = parseMes(mes)
  const monthLabel      = `${MONTH_NAMES[month - 1]} ${year}`

  function navigate(delta: number) {
    const d = new Date(year, month - 1 + delta, 1)
    const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    router.push(`/financeiro?mes=${next}`)
  }

  function handleDelete(id: string) {
    setDeletingId(id)
    startTransition(async () => {
      const supabase = createClient()
      await supabase.from('lancamentos').delete().eq('id', id)
      router.refresh()
      setDeletingId(null)
    })
  }

  const manualReceita = lancamentos
    .filter(l => l.tipo === 'receita')
    .reduce((s, l) => s + l.valor, 0)

  const totalReceita = manualReceita + appointmentRevenue

  const totalDespesa = lancamentos
    .filter(l => l.tipo === 'despesa')
    .reduce((s, l) => s + l.valor, 0)

  const saldo = totalReceita - totalDespesa

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Receitas e despesas da clínica</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" />
          Adicionar
        </Button>
      </div>

      {/* Month navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-md border border-border hover:bg-muted transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <span className="text-sm font-medium text-foreground w-36 text-center capitalize">
          {monthLabel}
        </span>
        <button
          onClick={() => navigate(1)}
          className="p-1.5 rounded-md border border-border hover:bg-muted transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">

        {/* Receita */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wide">
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
            Receita
          </div>
          <p className="text-2xl font-bold text-foreground">{formatBRL(totalReceita)}</p>
          {appointmentCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {appointmentCount} consulta{appointmentCount > 1 ? 's' : ''} confirmada{appointmentCount > 1 ? 's' : ''} · {formatBRL(appointmentRevenue)}
            </p>
          )}
        </div>

        {/* Despesas */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wide">
            <TrendingDown className="w-3.5 h-3.5 text-destructive" />
            Despesas
          </div>
          <p className="text-2xl font-bold text-foreground">{formatBRL(totalDespesa)}</p>
        </div>

        {/* Saldo */}
        <div className={`rounded-xl border bg-card p-4 space-y-2 ${
          saldo >= 0 ? 'border-primary/30' : 'border-destructive/30'
        }`}>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wide">
            <Minus className="w-3.5 h-3.5" />
            Saldo
          </div>
          <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-primary' : 'text-destructive'}`}>
            {formatBRL(saldo)}
          </p>
        </div>

      </div>

      {/* Chart */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">Últimos 6 meses</h2>
        <MonthlyChart data={chartData} />
      </div>

      {/* Lancamentos list */}
      <div className="rounded-xl border border-border bg-card">
        <div className="px-5 py-3.5 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Lançamentos manuais</h2>
        </div>

        {lancamentos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">Nenhum lançamento manual este mês.</p>
            <button
              onClick={() => setDialogOpen(true)}
              className="mt-2 text-sm text-primary hover:underline"
            >
              Adicionar o primeiro
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {lancamentos.map(l => (
              <div key={l.id} className="flex items-center gap-3 px-5 py-3">

                {/* Tipo indicator */}
                <span className={`w-2 h-2 rounded-full shrink-0 ${
                  l.tipo === 'receita' ? 'bg-primary' : 'bg-destructive'
                }`} />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {l.descricao || l.categoria}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {l.categoria}
                    {l.forma_pagamento ? ` · ${l.forma_pagamento}` : ''}
                    {' · '}{new Date(l.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </p>
                </div>

                {/* Valor */}
                <span className={`text-sm font-semibold shrink-0 ${
                  l.tipo === 'receita' ? 'text-primary' : 'text-destructive'
                }`}>
                  {l.tipo === 'receita' ? '+' : '-'}{formatBRL(l.valor)}
                </span>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(l.id)}
                  disabled={isPending && deletingId === l.id}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

              </div>
            ))}
          </div>
        )}
      </div>

      <LancamentoDialog
        open={dialogOpen}
        customerId={customerId}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  )
}
