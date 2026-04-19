'use client'

import { addDays, isSameDay, isToday, startOfWeek, formatTime, STATUS_DOT } from './agenda-utils'
import type { Appointment } from '@/lib/supabase/appointments'

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

type Props = {
  currentDate: Date
  appointments: Appointment[]
  onDayClick: (date: Date) => void
  onAppointmentClick: (a: Appointment) => void
}

export function MonthView({ currentDate, appointments, onDayClick, onAppointmentClick }: Props) {
  const year  = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Build 6-week grid starting from Monday of the week containing the 1st
  const firstOfMonth = new Date(year, month, 1)
  const gridStart    = startOfWeek(firstOfMonth)

  const days: Date[] = []
  for (let i = 0; i < 42; i++) days.push(addDays(gridStart, i))

  return (
    <div className="rounded-lg border border-border overflow-hidden">

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const isCurrentMonth = day.getMonth() === month
          const today          = isToday(day)
          const dayAppts       = appointments.filter((a) => isSameDay(new Date(a.starts_at), day))

          return (
            <div
              key={idx}
              onClick={() => onDayClick(day)}
              className={`min-h-[100px] p-1.5 border-b border-r border-border cursor-pointer hover:bg-muted/30 transition-colors
                ${!isCurrentMonth ? 'bg-muted/10' : ''}
                ${idx % 7 === 6 ? 'border-r-0' : ''}
                ${idx >= 35 ? 'border-b-0' : ''}
              `}
            >
              <div className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium mb-1 ${
                today
                  ? 'bg-primary text-primary-foreground'
                  : isCurrentMonth
                    ? 'text-foreground'
                    : 'text-muted-foreground/50'
              }`}>
                {day.getDate()}
              </div>

              <div className="space-y-0.5">
                {dayAppts.slice(0, 3).map((a) => (
                  <button
                    key={a.id}
                    onClick={(e) => { e.stopPropagation(); onAppointmentClick(a) }}
                    className={`w-full text-left flex items-center gap-1 px-1.5 py-0.5 rounded text-xs truncate border
                      ${a.status === 'confirmado'  ? 'bg-primary/10 text-primary border-primary/20' : ''}
                      ${a.status === 'a_confirmar' ? 'bg-yellow-500/10 text-yellow-700 border-yellow-400/30' : ''}
                      ${a.status === 'cancelado'   ? 'bg-muted text-muted-foreground border-border line-through' : ''}
                    `}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[a.status]}`} />
                    <span className="truncate">
                      {formatTime(new Date(a.starts_at))} {a.patient?.full_name ?? 'Sem paciente'}
                    </span>
                  </button>
                ))}
                {dayAppts.length > 3 && (
                  <p className="text-xs text-muted-foreground px-1">+{dayAppts.length - 3} mais</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
