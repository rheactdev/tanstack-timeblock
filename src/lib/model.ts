import { z } from 'zod'

export const horizons = ['inbox', 'day', 'week', 'month', 'year', 'life'] as const
export const datedHorizons = ['day', 'week', 'month', 'year'] as const
export type Horizon = typeof horizons[number]
export type DatedHorizon = typeof datedHorizons[number]
export const goalColors = ['none', '#ecce32', '#df496d', '#92ce14', '#278dea', '#955be0', '#f2713a'] as const
export type GoalColor = typeof goalColors[number]
export const colorLabels: Record<GoalColor, string> = { none: 'No color', '#ecce32': 'Yellow', '#df496d': 'Pink', '#92ce14': 'Green', '#278dea': 'Blue', '#955be0': 'Purple', '#f2713a': 'Orange' }
export const sortModes = ['manual', 'completion', 'color', 'title', 'created'] as const
export type SortMode = typeof sortModes[number]
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const date = new Date(`${value}T12:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value && +value.slice(0, 4) >= 1000 && +value.slice(0, 4) <= 9999
}, 'Choose a valid calendar date.')
export const scheduleSchema = z.object({ horizon: z.enum(horizons), date: dateSchema.nullable() }).refine(value => {
  return value.horizon === 'inbox' || value.horizon === 'life' ? value.date === null : value.date !== null
}, 'A calendar horizon needs a date; Inbox and Life are undated.')
export type Schedule = z.infer<typeof scheduleSchema>
export const taskSchema = z.object({
  id: z.string().min(1), title: z.string().trim().min(1).max(240), horizon: z.enum(horizons),
  date: dateSchema.nullable(), order: z.number().int().nonnegative(), completed: z.boolean(),
  color: z.enum(goalColors), board: z.string().max(80).nullable(), notes: z.string().max(5000),
  createdAt: z.string(), completedAt: z.string().nullable(), deletedAt: z.string().nullable(),
})
export type Task = z.infer<typeof taskSchema>
export type Board = { id: string; name: string; color: string }
export type Preferences = { collapsed: Horizon[]; sorts: Record<string, SortMode>; scene: 'alpine' | 'forest' | 'rose' }
export type Workspace = { schemaVersion: 2; tasks: Task[]; boards: Board[]; preferences: Preferences }
export type WorkspaceData = Workspace & {
  user: { name: string; email: string; image?: string | null } | null; storage: 'couchdb' | 'local'; today: string; now: string; timezone: string
}
export const searchSchema = z.object({
  date: dateSchema.optional().catch(undefined), q: z.string().max(200).catch(''),
  completed: z.boolean().catch(true), board: z.literal('all').catch('all'),
  color: z.enum(['all', ...goalColors]).catch('all'), goal: z.string().max(100).optional().catch(undefined),
})
export type PlannerSearch = z.infer<typeof searchSchema>
export const defaultSearch = { q: '', completed: true, board: 'all', color: 'all' } satisfies Partial<PlannerSearch>
export const preferencesSchema = z.object({
  collapsed: z.array(z.enum(horizons)).max(6).transform(value => [...new Set(value)]).optional(),
  scene: z.enum(['alpine', 'forest', 'rose']).optional(),
})
const idSchema = z.string().min(1).max(100)
export const mutationSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('create'), title: z.string().trim().min(1).max(240), schedule: scheduleSchema, board: z.string().max(80).nullable().default(null) }),
  z.object({ action: z.literal('update'), id: idSchema, patch: taskSchema.pick({ title: true, completed: true, color: true, board: true, notes: true }).partial(), schedule: scheduleSchema.optional() }),
  z.object({ action: z.literal('reschedule'), id: idSchema, schedule: scheduleSchema, beforeId: idSchema.nullable().default(null) }),
  z.object({ action: z.literal('move'), id: idSchema, schedule: scheduleSchema, beforeId: idSchema.nullable().default(null) }),
  z.object({ action: z.literal('duplicate'), id: idSchema }),
  z.object({ action: z.literal('delete'), id: idSchema }),
  z.object({ action: z.literal('restore'), id: idSchema }),
  z.object({ action: z.literal('preferences'), patch: preferencesSchema }),
  z.object({ action: z.literal('sort'), schedule: scheduleSchema, mode: z.enum(sortModes) }),
  z.object({ action: z.literal('board'), name: z.string().trim().min(1).max(80), color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#69d5c6') }),
])
export type Mutation = z.infer<typeof mutationSchema>
export type PlannerView = 'horizons' | 'inbox' | 'days' | 'weeks' | 'months' | 'years'

export function filterTasks(tasks: Task[], search: PlannerSearch) {
  const words = search.q.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) || []
  return tasks.filter(task => {
    if (task.deletedAt || (!search.completed && task.completed) || (search.color !== 'all' && task.color !== search.color)) return false
    const tokens = `${task.title} ${task.notes}`.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) || []
    return words.every(word => tokens.includes(word))
  })
}
export function seedWorkspace(): Workspace {
  return { schemaVersion: 2, tasks: [], boards: [], preferences: { collapsed: ['day', 'week', 'month'], sorts: {}, scene: 'alpine' } }
}
