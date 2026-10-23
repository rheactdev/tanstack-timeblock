import { useEffect, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { Button } from './ui/button'
import { Calendar } from './ui/calendar'
import { Input } from './ui/input'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Modal, SelectField } from './planner-controls'
import { dateSchema, horizons, type Horizon, type Schedule } from '../lib/model'
import { addDays, normalizeSchedule, periodLabel, periodStart } from '../lib/calendar'
import type { Mutate } from './use-workspace'

export const horizonLabels: Record<Horizon, string> = { inbox: 'Inbox', day: 'Day', week: 'Week', month: 'Month', year: 'Year', life: 'Life' }
export function toCalendarDate(value: string) { const [year, month, day] = value.split('-').map(Number); return new Date(year, month - 1, day, 12) }
export function fromCalendarDate(value: Date) { return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}` }

export function ScheduleFields({ value, onChange, today }: { value: Schedule; onChange: (schedule: Schedule) => void; today: string }) {
  const reference = value.date || today
  const [yearText, setYearText] = useState(reference.slice(0, 4))
  useEffect(() => setYearText(reference.slice(0, 4)), [reference])
  const dated = value.horizon !== 'inbox' && value.horizon !== 'life'
  const choices: { label: string; schedule: Schedule }[] = [
    { label: 'Today', schedule: { horizon: 'day', date: today } },
    { label: 'Tomorrow', schedule: { horizon: 'day', date: addDays(today, 1) } },
    { label: 'This week', schedule: { horizon: 'week', date: periodStart(today, 'week') } },
    { label: 'Next week', schedule: { horizon: 'week', date: addDays(periodStart(today, 'week')!, 7) } },
    { label: 'This month', schedule: { horizon: 'month', date: periodStart(today, 'month') } },
    { label: 'This year', schedule: { horizon: 'year', date: periodStart(today, 'year') } },
    { label: 'Life', schedule: { horizon: 'life', date: null } },
    { label: 'Inbox', schedule: { horizon: 'inbox', date: null } },
  ]
  return <div className="schedule-fields">
    <div className="schedule-shortcuts">{choices.map(choice => <button type="button" key={choice.label} className={value.horizon === choice.schedule.horizon && value.date === choice.schedule.date ? 'selected' : ''} onClick={() => onChange(choice.schedule)}>{choice.label}</button>)}</div>
    <label className="field-stack"><span>Horizon</span><SelectField label="Schedule horizon" value={value.horizon} onChange={horizon => onChange(normalizeSchedule({ horizon: horizon as Horizon, date: horizon === 'inbox' || horizon === 'life' ? null : reference }))} items={horizons.map(horizon => ({ value: horizon, label: horizonLabels[horizon] }))} /></label>
    {dated && <><label className="field-stack"><span>{value.horizon === 'week' ? 'Choose any date in the week' : value.horizon === 'month' ? 'Choose a month' : value.horizon === 'year' ? 'Choose a year' : 'Date'}</span><Input aria-label="Scheduled date" type={value.horizon === 'month' ? 'month' : value.horizon === 'year' ? 'number' : 'date'} min={value.horizon === 'year' ? 1000 : value.horizon === 'month' ? '1000-01' : '1000-01-01'} max={value.horizon === 'year' ? 9999 : value.horizon === 'month' ? '9999-12' : '9999-12-31'} value={value.horizon === 'month' ? reference.slice(0, 7) : value.horizon === 'year' ? yearText : reference} onBlur={() => { if (value.horizon === 'year' && !dateSchema.safeParse(`${yearText}-01-01`).success) setYearText(reference.slice(0, 4)) }} onChange={event => { const raw = event.target.value; if (value.horizon === 'year') setYearText(raw); const candidate = value.horizon === 'month' ? `${raw}-01` : value.horizon === 'year' ? `${raw}-01-01` : raw; if (dateSchema.safeParse(candidate).success) onChange(normalizeSchedule({ horizon: value.horizon, date: candidate })) }} /></label>
      {(value.horizon === 'day' || value.horizon === 'week') && <Calendar className="schedule-calendar" mode="single" weekStartsOn={1} showWeekNumber={value.horizon === 'week'} month={toCalendarDate(reference)} onMonthChange={date => onChange(normalizeSchedule({ horizon: value.horizon, date: fromCalendarDate(date) }))} selected={toCalendarDate(reference)} onSelect={date => { if (date) onChange(normalizeSchedule({ horizon: value.horizon, date: fromCalendarDate(date) })) }} />}
    </>}
    <p className="schedule-summary">{periodLabel(value, today)}</p>
  </div>
}

export function CursorPicker({ cursor, today, onSelect, label }: { cursor: string; today: string; onSelect: (date?: string) => void; label: string }) {
  const [open, setOpen] = useState(false)
  const [typedDate, setTypedDate] = useState(cursor)
  return <Popover open={open} onOpenChange={next => { if (next) setTypedDate(cursor); setOpen(next) }}>
    <PopoverTrigger asChild><button className="period-date-button" type="button" aria-label={`Choose a date. ${label}`}><CalendarDays size={13} /><span>{label}</span></button></PopoverTrigger>
    <PopoverContent className="date-popover" align="start">
      <Calendar mode="single" weekStartsOn={1} defaultMonth={toCalendarDate(cursor)} selected={toCalendarDate(cursor)} onSelect={date => { if (date) { onSelect(fromCalendarDate(date)); setOpen(false) } }} />
      <form className="cursor-date-entry" onSubmit={event => { event.preventDefault(); if (dateSchema.safeParse(typedDate).success) { onSelect(typedDate); setOpen(false) } }}><Input aria-label="Jump to calendar date" type="date" value={typedDate} onChange={event => setTypedDate(event.target.value)} min="1000-01-01" max="9999-12-31" required /><Button type="submit" size="sm">Go</Button></form>
      {cursor !== today && <Button type="button" className="w-full mt-4" size="sm" onClick={() => { onSelect(undefined); setOpen(false) }}>Today</Button>}
    </PopoverContent>
  </Popover>
}

export function SchedulePopover({ schedule, today, onChange }: { schedule: Schedule; today: string; onChange: (schedule: Schedule) => void }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(schedule)
  return <Popover open={open} onOpenChange={next => { if (next) setDraft(schedule); setOpen(next) }}><PopoverTrigger asChild><Button type="button" variant="outline" className="schedule-trigger"><CalendarDays size={16} />{periodLabel(schedule, today)}</Button></PopoverTrigger><PopoverContent className="schedule-popover" align="start"><ScheduleFields value={draft} onChange={setDraft} today={today} /><Button className="w-full mt-4" type="button" size="sm" onClick={() => { onChange(draft); setOpen(false) }}>Set schedule</Button></PopoverContent></Popover>
}

export function RescheduleDialog({ id, title, schedule, today, mutate, onClose }: { id: string; title: string; schedule: Schedule; today: string; mutate: Mutate; onClose: () => void }) {
  const [draft, setDraft] = useState(schedule)
  const [busy, setBusy] = useState(false)
  return <Modal title="Reschedule" description={title} onClose={onClose} className="reschedule-dialog"><ScheduleFields value={draft} onChange={setDraft} today={today} /><Button disabled={busy} onClick={async () => { setBusy(true); const result = await mutate({ action: 'reschedule', id, schedule: draft, beforeId: null }); if (result) onClose(); setBusy(false) }}>Save schedule</Button></Modal>
}
