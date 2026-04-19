'use client'

import { addDays, startOfWeek, isSameDay, isToday, formatTime, STATUS_COLOR } from './agenda-utils'
import type { Appointment } from '@/lib/supabase/appointments'

const HOUR_HEIGHT = 64  // px per hour
const START_HOUR  = 7
const END_HOUR    = 21
const HOURS       = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)
const WEEKDAYS    = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

type Props = {
  currentDate: Date
  appointments: Appointment[]
  onSlotClick: (date: Date) => void
  onAppointmentClick: (a: Appointment) => void
}

function eventTop(startsAt: Date): number {
  const h = startsAt.getHours() + startsAt.getMinutes() / 60
  return (h - START_HOUR) * HOUR_HEIGHT
}

function eventHeight(startsAt: Date, endsAt: Date): number {
  const duration = (endsAt.getTime() - startsAt.getTime()) / 3_600_000 // hours
  return Math.max(duration * HOUR_HEIGHT, 20)
}

export function WeekView({ currentDate, appointments, onSlotClick, onAppointmentClick }: Props) {
  const monday = startOfWeek(currentDate)
  const days   = Array.from({ length: 7 }, (_, i) => addDays(monday, i))

  return (
    <div className="rounded-lg border border-border overflow-hidden">

      {/* Time grid + sticky header inside scroller */}
      <div className="overflow-y-auto max-h-[600px]">

        {/* Sticky header row */}
        <div className="sticky top-0 z-20 grid grid-cols-[96px_repeat(7,1fr)] border-b border-border bg-muted">
          <div />
          {days.map((day, i) => (
            <div key={i} className="py-2 text-center border-l border-border">
              <p className="text-xs text-muted-foreground">{WEEKDAYS[i]}</p>
              <p className={`text-sm font-semibold mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-full mx-auto ${
                isToday(day) ? 'bg-primary text-primary-foreground' : 'text-foreground'
              }`}>
                {day.getDate()}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-[96px_repeat(7,1fr)]">

          {/* Hour labels */}
          <div>
            {HOURS.map((h) => (
              <div key={h} style={{ height: HOUR_HEIGHT }} className="flex items-center justify-end pr-2 border-b border-border">
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {String(h).padStart(2, '0')}:00 – {String(h + 1).padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day, colIdx) => {
            const dayAppts = appointments.filter((a) => isSameDay(new Date(a.starts_at), day))

            return (
              <div
                key={colIdx}
                className="relative border-l border-border"
                style={{ height: HOURS.length * HOUR_HEIGHT }}
              >
                {/* Hour slot click zones */}
                {HOURS.map((h) => (
                  <div
                    key={h}
                    style={{ top: (h - START_HOUR) * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                    className="absolute inset-x-0 border-b border-border cursor-pointer hover:bg-muted/20 transition-colors"
                    onClick={() => {
                      const d = new Date(day)
                      d.setHours(h, 0, 0, 0)
                      onSlotClick(d)
                    }}
                  />
                ))}

                {/* Appointment blocks */}
                {dayAppts.map((a) => {
                  const start = new Date(a.starts_at)
                  const end   = new Date(a.ends_at)
                  const top    = eventTop(start)
                  const height = eventHeight(start, end)

                  return (
                    <button
                      key={a.id}
                      onClick={(e) => { e.stopPropagation(); onAppointmentClick(a) }}
                      style={{ top, height, left: 2, right: 2 }}
                      className={`absolute rounded px-1.5 py-1 text-left text-xs border overflow-hidden z-10 ${STATUS_COLOR[a.status]}`}
                    >
                      <p className="font-medium truncate leading-tight">
                        {a.patient?.full_name ?? 'Sem paciente'}
                      </p>
                      <p className="truncate opacity-80">
                        {formatTime(start)} – {formatTime(end)}
                      </p>
                    </button>
                  )
                })}
              </div>
            )
          })}

        </div>

      </div>
    </div>
  )
}
