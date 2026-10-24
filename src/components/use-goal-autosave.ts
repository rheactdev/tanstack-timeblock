import { useCallback, useEffect, useRef, useState } from 'react'
import type { Task } from '../lib/model'
import type { Mutate } from './use-workspace'
import { toast } from './ui/toast'

type GoalDraft = Pick<Task, 'title' | 'notes' | 'completed'>
const AUTOSAVE_DELAY = 500

function goalDraft(task: Task): GoalDraft {
  return { title: task.title, notes: task.notes, completed: task.completed }
}

export function useGoalAutosave(task: Task, mutate: Mutate) {
  const [draft, setDraft] = useState(() => goalDraft(task))
  const current = useRef(draft)
  const confirmed = useRef(draft)
  const mutateRef = useRef(mutate)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingSave = useRef<Promise<void> | null>(null)
  const mounted = useRef(false)
  const composing = useRef(false)
  mutateRef.current = mutate

  const flush = useCallback(async function save(): Promise<void> {
    if (timer.current !== null) {
      clearTimeout(timer.current)
      timer.current = null
    }
    if (composing.current) return
    // Coalesce edits made during a request and compare against its confirmed result.
    if (pendingSave.current) {
      await pendingSave.current
      return save()
    }
    const snapshot = { ...current.current }
    const patch: Partial<GoalDraft> = {}
    const title = snapshot.title.trim()
    if (title && title !== confirmed.current.title) patch.title = title
    if (snapshot.notes !== confirmed.current.notes) patch.notes = snapshot.notes
    if (snapshot.completed !== confirmed.current.completed) patch.completed = snapshot.completed
    if (!Object.keys(patch).length) return

    const request = (async () => {
      let savedTask: Task | undefined
      try {
        const result = await mutateRef.current({ action: 'update', id: task.id, patch })
        savedTask = result?.tasks.find(item => item.id === task.id)
      } catch (error) {
        // The workspace mutation normally reports failures and returns null.
        toast.error('Changes were not saved', { description: error instanceof Error ? error.message : 'Please try again.' })
      }
      if (savedTask) {
        confirmed.current = goalDraft(savedTask)
        return
      }
      // Roll back failed fields without discarding newer typing in those fields.
      const latest = current.current
      const restored = {
        title: patch.title !== undefined && latest.title === snapshot.title ? confirmed.current.title : latest.title,
        notes: patch.notes !== undefined && latest.notes === snapshot.notes ? confirmed.current.notes : latest.notes,
        completed: patch.completed !== undefined && latest.completed === snapshot.completed ? confirmed.current.completed : latest.completed,
      }
      current.current = restored
      if (mounted.current) setDraft(restored)
    })()
    pendingSave.current = request
    try {
      await request
    } finally {
      if (pendingSave.current === request) pendingSave.current = null
    }
  }, [task.id])

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      composing.current = false
      // Closing or navigating away must not discard a queued edit.
      void flush()
    }
  }, [flush])

  function scheduleSave() {
    if (timer.current !== null) clearTimeout(timer.current)
    timer.current = setTimeout(() => { void flush() }, AUTOSAVE_DELAY)
  }

  function update(patch: Partial<GoalDraft>, immediately = false) {
    current.current = { ...current.current, ...patch }
    setDraft(current.current)
    if (immediately) void flush()
    else scheduleSave()
  }

  function startComposition() {
    composing.current = true
    if (timer.current !== null) {
      clearTimeout(timer.current)
      timer.current = null
    }
  }

  function endComposition() {
    composing.current = false
    scheduleSave()
  }

  return { draft, update, flush, startComposition, endComposition }
}
