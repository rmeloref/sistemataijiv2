'use client'

import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { type CalendarView, formatDateHeader } from './agenda-utils'

type Props = {
  view: CalendarView
  currentDate: Date
  onViewChange: (v: CalendarView) => void
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onNewAppointment: () => void
}

const VIEWS: { key: CalendarView; label: string }[] = [
  { key: 'month', label: 'Mês' },
  { key: 'week',  label: 'Semana' },
  { key: 'day',   label: 'Dia' },
]

export function AgendaHeader({
  view, currentDate, onViewChange, onPrev, onNext, onToday, onNewAppointment,
}: Props) {
  return (
    <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">

      {/* Left: nav */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onToday}>Hoje</Button>
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={onPrev} className="h-8 w-8">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onNext} className="h-8 w-8">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <h2 className="text-base font-semibold text-foreground capitalize">
          {formatDateHeader(view, currentDate)}
        </h2>
      </div>

      {/* Right: view switcher + new */}
      <div className="flex items-center gap-2">
        <div className="flex rounded-lg border border-border overflow-hidden">
          {VIEWS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => onViewChange(key)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                view === key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-muted/50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <Button onClick={onNewAppointment}>
          <Plus className="w-4 h-4 mr-1.5" />
          Agendar consulta
        </Button>
      </div>

    </div>
  )
}
