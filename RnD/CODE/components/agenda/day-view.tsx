'use client'

import { isSameDay, formatTime, STATUS_COLOR } from './agenda-utils'
import type { Appointment } from '@/lib/supabase/appointments'

const HOUR_HEIGHT = 64
const START_HOUR  = 7
const END_HOUR    = 21
const HOURS       = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)

type Props = {
  currentDate: Date
  appointments: Appointment[]
  onSlotClick: (date: Date) => void
  onAppointmentClick: (a: Appointment) => void
}

function eventTop(startsAt: Date): number {
  return (startsAt.getHours() + startsAt.getMinutes() / 60 - START_HOUR) * HOUR_HEIGHT
}

function eventHeight(startsAt: Date, endsAt: Date): number {
  return Math.max((endsAt.getTime() - startsAt.getTime()) / 3_600_000 * HOUR_HEIGHT, 24)
}

export function DayView({ currentDate, appointments, onSlotClick, onAppointmentClick }: Props) {
  const dayAppts = appointments.filter((a) => isSameDay(new Date(a.starts_at), currentDate))

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="overflow-y-auto max-h-[600px]">
        <div className="grid grid-cols-[96px_1fr]">

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

          {/* Day column */}
          <div
            className="relative border-l border-border"
            style={{ height: HOURS.length * HOUR_HEIGHT }}
          >
            {HOURS.map((h) => (
              <div
                key={h}
                style={{ top: (h - START_HOUR) * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                className="absolute inset-x-0 border-b border-border cursor-pointer hover:bg-muted/20 transition-colors"
                onClick={() => {
                  const d = new Date(currentDate)
                  d.setHours(h, 0, 0, 0)
                  onSlotClick(d)
                }}
              />
            ))}

            {dayAppts.map((a) => {
              const start  = new Date(a.starts_at)
              const end    = new Date(a.ends_at)
              const top    = eventTop(start)
              const height = eventHeight(start, end)

              return (
                <button
                  key={a.id}
                  onClick={(e) => { e.stopPropagation(); onAppointmentClick(a) }}
                  style={{ top, height, left: 4, right: 4 }}
                  className={`absolute rounded px-3 py-1.5 text-left text-sm border overflow-hidden z-10 ${STATUS_COLOR[a.status]}`}
                >
                  <p className="font-medium truncate">{a.patient?.full_name ?? 'Sem paciente'}</p>
                  <p className="text-xs opacity-80 mt-0.5">{formatTime(start)} – {formatTime(end)}</p>
                  {a.notes && <p className="text-xs opacity-70 mt-0.5 truncate">{a.notes}</p>}
                </button>
              )
            })}
          </div>

        </div>
      </div>
    </div>
  )
}
