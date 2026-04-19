'use client'

import { useCallback, useEffect, useState } from 'react'
import { AgendaHeader } from './agenda-header'
import { MonthView } from './month-view'
import { WeekView } from './week-view'
import { DayView } from './day-view'
import { AppointmentModal } from './appointment-modal'
import { getAppointments, type Appointment } from '@/lib/supabase/appointments'
import { type CalendarView, viewRange, addDays, addMonths, startOfWeek } from './agenda-utils'

type Props = { customerId: string }

export function AgendaClient({ customerId }: Props) {
  const [view,        setView]        = useState<CalendarView>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading,     setLoading]     = useState(false)

  // Modal state
  const [showModal,      setShowModal]      = useState(false)
  const [initialDate,    setInitialDate]    = useState<Date | undefined>(undefined)
  const [selectedAppt,   setSelectedAppt]   = useState<Appointment | null>(null)

  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    try {
      const [from, to] = viewRange(view, currentDate)
      const data = await getAppointments(from, to)
      setAppointments(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [view, currentDate])

  useEffect(() => { fetchAppointments() }, [fetchAppointments])

  // Navigation
  function handlePrev() {
    if (view === 'month') setCurrentDate((d) => addMonths(d, -1))
    if (view === 'week')  setCurrentDate((d) => addDays(d, -7))
    if (view === 'day')   setCurrentDate((d) => addDays(d, -1))
  }

  function handleNext() {
    if (view === 'month') setCurrentDate((d) => addMonths(d, 1))
    if (view === 'week')  setCurrentDate((d) => addDays(d, 7))
    if (view === 'day')   setCurrentDate((d) => addDays(d, 1))
  }

  // Open modal for new appointment
  function openNew(date?: Date) {
    setSelectedAppt(null)
    setInitialDate(date)
    setShowModal(true)
  }

  // Open modal for existing appointment
  function openEdit(a: Appointment) {
    setSelectedAppt(a)
    setInitialDate(undefined)
    setShowModal(true)
  }

  // When clicking a day in month view — switch to day view
  function handleDayClick(date: Date) {
    setCurrentDate(date)
    setView('day')
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">

        <div className="mb-2">
          <h1 className="text-2xl font-bold text-foreground">Agenda</h1>
        </div>

        <AgendaHeader
          view={view}
          currentDate={currentDate}
          onViewChange={setView}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={() => setCurrentDate(new Date())}
          onNewAppointment={() => openNew()}
        />

        {loading ? (
          <div className="rounded-lg border border-border h-96 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Carregando...</p>
          </div>
        ) : (
          <>
            {view === 'month' && (
              <MonthView
                currentDate={currentDate}
                appointments={appointments}
                onDayClick={handleDayClick}
                onAppointmentClick={openEdit}
              />
            )}
            {view === 'week' && (
              <WeekView
                currentDate={currentDate}
                appointments={appointments}
                onSlotClick={openNew}
                onAppointmentClick={openEdit}
              />
            )}
            {view === 'day' && (
              <DayView
                currentDate={currentDate}
                appointments={appointments}
                onSlotClick={openNew}
                onAppointmentClick={openEdit}
              />
            )}
          </>
        )}

        {showModal && (
          <AppointmentModal
            customerId={customerId}
            initialDate={initialDate}
            appointment={selectedAppt}
            onClose={() => setShowModal(false)}
            onSaved={fetchAppointments}
          />
        )}

      </div>
    </div>
  )
}
