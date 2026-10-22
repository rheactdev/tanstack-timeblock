import type { DatedHorizon, Horizon, PlannerView, Schedule, SortMode, Task } from './model'
import { goalColors } from './model'

export const timezone = 'America/New_York'
export function todayInZone(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now)
  const part = (type: string) => parts.find(value => value.type === type)!.value
  return `${part('year')}-${part('month')}-${part('day')}`
}
// UTC noon is a date-only carrier; calendar shifts never add elapsed local hours.
export function dateValue(value: string) { return new Date(`${value}T12:00:00Z`) }
export function dateString(value: Date) { return value.toISOString().slice(0, 10) }
export function addDays(value: string, amount: number) { const date = dateValue(value); date.setUTCDate(date.getUTCDate() + amount); return dateString(date) }
export function addMonths(value: string, amount: number) {
  const date = dateValue(value); const day = date.getUTCDate(); date.setUTCDate(1); date.setUTCMonth(date.getUTCMonth() + amount)
  const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate()
  date.setUTCDate(Math.min(day, last)); return dateString(date)
}
export function shiftDate(value: string, horizon: DatedHorizon, amount: number) {
  const result = horizon === 'day' ? addDays(value, amount) : horizon === 'week' ? addDays(value, amount * 7) : addMonths(value, amount * (horizon === 'year' ? 12 : 1))
  return +result.slice(0, 4) < 1000 || +result.slice(0, 4) > 9999 ? value : result
}
export function periodStart(value: string, horizon: Horizon): string | null {
  if (horizon === 'inbox' || horizon === 'life') return null
  if (horizon === 'day') return value
  if (horizon === 'month') return `${value.slice(0, 7)}-01`
  if (horizon === 'year') return `${value.slice(0, 4)}-01-01`
  return addDays(value, -((dateValue(value).getUTCDay() + 6) % 7))
}
export function normalizeSchedule(schedule: Schedule): Schedule { return { horizon: schedule.horizon, date: periodStart(schedule.date || '2000-01-01', schedule.horizon) } }
export function scheduleKey(schedule: Schedule) { return `${schedule.horizon}:${schedule.date || 'all'}` }
export function samePeriod(task: Schedule, schedule: Schedule) { return scheduleKey(task) === scheduleKey(schedule) }
export function formatDate(value: string, options: Intl.DateTimeFormatOptions) { return new Intl.DateTimeFormat('en-US', { ...options, timeZone: 'UTC' }).format(dateValue(value)) }
export function periodLabel(schedule: Schedule, today: string, compact = false) {
  const { horizon, date } = schedule
  if (horizon === 'inbox') return 'Inbox'
  if (horizon === 'life') return 'Life'
  if (!date) return ''
  if (horizon === 'year') return date.slice(0, 4)
  if (horizon === 'month') return formatDate(date, { month: compact ? 'short' : 'long', year: 'numeric' })
  if (horizon === 'week') return `${formatDate(date, { month: 'short', day: 'numeric' })} – ${formatDate(addDays(date, 6), { month: 'short', day: 'numeric' })}`
  if (date === today) return 'Today'
  if (date === addDays(today, 1)) return 'Tomorrow'
  return formatDate(date, { weekday: compact ? 'short' : 'long', month: 'short', day: 'numeric' })
}
export function periodColumns(view: PlannerView, cursor: string): Schedule[] {
  if (view === 'horizons') return (['inbox', 'day', 'week', 'month', 'year', 'life'] as Horizon[]).map(horizon => ({ horizon, date: periodStart(cursor, horizon) }))
  if (view === 'inbox') return [{ horizon: 'inbox', date: null }]
  if (view === 'days') return Array.from({ length: 7 }, (_, index) => ({ horizon: 'day', date: addDays(periodStart(cursor, 'week')!, index) }))
  if (view === 'weeks') return Array.from({ length: 6 }, (_, index) => ({ horizon: 'week', date: addDays(periodStart(cursor, 'week')!, index * 7) }))
  if (view === 'months') return Array.from({ length: 12 }, (_, index) => ({ horizon: 'month', date: `${cursor.slice(0, 4)}-${String(index + 1).padStart(2, '0')}-01` }))
  const decade = Math.floor(+cursor.slice(0, 4) / 10) * 10
  return Array.from({ length: 10 }, (_, index) => ({ horizon: 'year', date: `${decade + index}-01-01` }))
}
export function sortedTasks(tasks: Task[], mode: SortMode = 'manual') {
  return [...tasks].sort((a, b) => {
    const difference = mode === 'completion' ? Number(a.completed) - Number(b.completed) : mode === 'color' ? goalColors.indexOf(a.color) - goalColors.indexOf(b.color) : mode === 'title' ? a.title.localeCompare(b.title) : mode === 'created' ? a.createdAt.localeCompare(b.createdAt) : a.order - b.order
    return difference || a.order - b.order || a.id.localeCompare(b.id)
  })
}
