'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

const CATEGORIAS_RECEITA = ['Sessão', 'Pacote', 'Avaliação', 'Outros']
const CATEGORIAS_DESPESA = ['Material', 'Aluguel', 'Marketing', 'Outros']
const FORMAS_PAGAMENTO   = ['PIX', 'Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'Transferência', 'Boleto']

type Props = {
  open: boolean
  customerId: string
  onClose: () => void
}

export function LancamentoDialog({ open, customerId, onClose }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [tipo,           setTipo]          = useState<'receita' | 'despesa'>('receita')
  const [categoria,      setCategoria]     = useState('Sessão')
  const [descricao,      setDescricao]     = useState('')
  const [valor,          setValor]         = useState('')
  const [data,           setData]          = useState(() => new Date().toISOString().split('T')[0])
  const [formaPagamento, setFormaPagamento] = useState('')
  const [observacoes,    setObservacoes]   = useState('')
  const [error,          setError]         = useState<string | null>(null)

  if (!open) return null

  const categorias = tipo === 'receita' ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA

  function handleTipoChange(next: 'receita' | 'despesa') {
    setTipo(next)
    setCategoria(next === 'receita' ? CATEGORIAS_RECEITA[0] : CATEGORIAS_DESPESA[0])
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const valorNum = parseFloat(valor.replace(',', '.'))
    if (isNaN(valorNum) || valorNum <= 0) {
      setError('Informe um valor válido maior que zero.')
      return
    }

    startTransition(async () => {
      const supabase = createClient()
      const { error: err } = await supabase.from('lancamentos').insert({
        customer_id:     customerId,
        tipo,
        categoria,
        descricao:       descricao || null,
        valor:           valorNum,
        data,
        forma_pagamento: formaPagamento || null,
        observacoes:     observacoes || null,
      })

      if (err) {
        setError(err.message)
        return
      }

      router.refresh()
      handleClose()
    })
  }

  function handleClose() {
    setTipo('receita')
    setCategoria(CATEGORIAS_RECEITA[0])
    setDescricao('')
    setValor('')
    setData(new Date().toISOString().split('T')[0])
    setFormaPagamento('')
    setObservacoes('')
    setError(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      <div className="relative z-10 w-full max-w-md rounded-xl border border-border bg-card shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Novo Lançamento</h2>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">

          {/* Tipo */}
          <div className="grid grid-cols-2 gap-2">
            {(['receita', 'despesa'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => handleTipoChange(t)}
                className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                  tipo === t
                    ? t === 'receita'
                      ? 'bg-primary/10 border-primary/40 text-primary'
                      : 'bg-destructive/10 border-destructive/40 text-destructive'
                    : 'border-border text-muted-foreground hover:border-foreground/30'
                }`}
              >
                {t === 'receita' ? 'Receita' : 'Despesa'}
              </button>
            ))}
          </div>

          {/* Categoria */}
          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <select
              value={categoria}
              onChange={e => setCategoria(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {categorias.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Valor + Data */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Valor (R$)</Label>
              <Input
                value={valor}
                onChange={e => setValor(e.target.value)}
                placeholder="0,00"
                inputMode="decimal"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Data</Label>
              <Input
                type="date"
                value={data}
                onChange={e => setData(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <Label>Descrição <span className="text-muted-foreground font-normal">(opcional)</span></Label>
            <Input
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              placeholder="Ex: Sessão de acupuntura — João"
              maxLength={200}
            />
          </div>

          {/* Forma de pagamento */}
          <div className="space-y-1.5">
            <Label>Forma de pagamento <span className="text-muted-foreground font-normal">(opcional)</span></Label>
            <select
              value={formaPagamento}
              onChange={e => setFormaPagamento(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Selecionar</option>
              {FORMAS_PAGAMENTO.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={handleClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </div>

        </form>
      </div>
    </div>
  )
}
