import { horizons, goalColors, seedWorkspace, type GoalColor, type Horizon, type Mutation, type Schedule, type Task, type Workspace } from './model'
import { normalizeSchedule, periodStart, samePeriod, scheduleKey, sortedTasks } from './calendar'

const legacyColors: Record<string, GoalColor> = { none: 'none', green: '#92ce14', blue: '#278dea', purple: '#955be0', orange: '#f2713a' }

// Called once on persisted v1 documents. The migration date is saved with the v2 result.
export function migrateWorkspace(input: unknown, migrationDate: string): Workspace {
  const previous = input as Partial<Workspace> | undefined
  if (previous?.schemaVersion === 2) return previous as Workspace
  const empty = seedWorkspace()
  if (!previous) return empty
  const tasks = (previous.tasks || []).map((task, index) => {
    const horizon = horizons.includes(task.horizon) ? task.horizon : 'inbox'
    const color = goalColors.includes(task.color) ? task.color : legacyColors[task.color] || 'none'
    return { ...task, horizon, color, date: periodStart(migrationDate, horizon), order: index, board: task.board || null, notes: task.notes || '', deletedAt: null, completedAt: task.completedAt || null } satisfies Task
  })
  return { schemaVersion: 2, tasks, boards: previous.boards || empty.boards, preferences: empty.preferences }
}

function assertBoard(workspace: Workspace, board: string | null) {
  if (board !== null && !workspace.boards.some(item => item.id === board)) throw new Error('Board not found.')
}
function periodTasks(workspace: Workspace, schedule: Schedule, omitId?: string) {
  return sortedTasks(workspace.tasks.filter(task => !task.deletedAt && task.id !== omitId && samePeriod(task, schedule)))
}
function placeTask(workspace: Workspace, task: Task, destination: Schedule, beforeId: string | null) {
  const schedule = normalizeSchedule(destination)
  const source: Schedule = { horizon: task.horizon, date: task.date }
  if (beforeId === task.id) return
  const siblings = periodTasks(workspace, schedule, task.id)
  const position = beforeId === null ? siblings.length : siblings.findIndex(item => item.id === beforeId)
  if (position < 0) throw new Error('The destination goal changed. Please try again.')
  Object.assign(task, schedule)
  siblings.splice(position, 0, task)
  siblings.forEach((item, order) => { item.order = order })
  if (!samePeriod(source, schedule)) periodTasks(workspace, source).forEach((item, order) => { item.order = order })
  workspace.preferences.sorts[scheduleKey(schedule)] = 'manual'
}

export function applyMutation(current: Workspace, mutation: Mutation, now: string, newId: () => string): Workspace {
  const workspace = structuredClone(current)
  if (mutation.action === 'create') {
    assertBoard(workspace, mutation.board)
    const schedule = normalizeSchedule(mutation.schedule)
    const siblings = periodTasks(workspace, schedule)
    const order = (siblings.at(-1)?.order ?? -1) + 1
    workspace.tasks.push({ id: newId(), title: mutation.title.trim(), ...schedule, order, board: mutation.board, completed: false, notes: '', color: 'none', createdAt: now, completedAt: null, deletedAt: null })
  } else if (mutation.action === 'board') {
    workspace.boards.push({ id: newId(), name: mutation.name.trim(), color: mutation.color })
  } else if (mutation.action === 'preferences') {
    Object.assign(workspace.preferences, mutation.patch)
  } else if (mutation.action === 'sort') {
    workspace.preferences.sorts[scheduleKey(normalizeSchedule(mutation.schedule))] = mutation.mode
  } else {
    const task = workspace.tasks.find(item => item.id === mutation.id)
    if (!task || (task.deletedAt && mutation.action !== 'restore')) throw new Error('Goal not found. It may have been deleted in another tab.')
    if (mutation.action === 'update') {
      if (mutation.patch.board !== undefined) assertBoard(workspace, mutation.patch.board)
      Object.assign(task, mutation.patch)
      if (mutation.patch.completed !== undefined) task.completedAt = mutation.patch.completed ? now : null
      if (mutation.schedule && !samePeriod(task, normalizeSchedule(mutation.schedule))) placeTask(workspace, task, mutation.schedule, null)
    } else if (mutation.action === 'move' || mutation.action === 'reschedule') {
      placeTask(workspace, task, mutation.schedule, mutation.beforeId)
    } else if (mutation.action === 'duplicate') {
      const copy: Task = { ...task, id: newId(), title: task.title, completed: false, completedAt: null, createdAt: now, deletedAt: null }
      workspace.tasks.push(copy)
      const siblings = periodTasks(workspace, task, copy.id)
      const next = siblings[siblings.findIndex(item => item.id === task.id) + 1]
      placeTask(workspace, copy, task, next?.id || null)
    } else if (mutation.action === 'delete') {
      task.deletedAt = now
    } else if (mutation.action === 'restore') {
      if (!task.deletedAt) return workspace
      task.deletedAt = null
      placeTask(workspace, task, task, null)
    }
  }
  return workspace
}

export function canApplyOptimistically(mutation: Mutation) {
  return mutation.action !== 'create' && mutation.action !== 'board' && mutation.action !== 'duplicate'
}
