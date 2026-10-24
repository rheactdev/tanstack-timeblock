import { useCallback, useEffect, useRef, useState } from 'react'
import type { Task } from '../lib/model'
import type { Mutate } from './use-workspace'
import { toast } from './ui/toast'

type GoalDraft = Pick<Task, 'title' | 'notes' | 'completed'>

function goalDraft(task: Task): GoalDraft {
  return { title: task.title, notes: task.notes, completed: task.completed }
}

export function useGoalDraft(task: Task, mutate: Mutate) {
  const [draft, setDraft] = useState(() => goalDraft(task))
  const current = useRef(draft)
  const confirmed = useRef(draft)
  const mutateRef = useRef(mutate)
  const pendingSave = useRef<Promise<boolean> | null>(null)
  const mounted = useRef(false)
  const composing = useRef(false)
  const saveAfterComposition = useRef(false)
  const savingEnabled = useRef(true)
  mutateRef.current = mutate

  const save = useCallback(async function persist(): Promise<boolean> {
    if (!savingEnabled.current) return false
    if (composing.current) {
      saveAfterComposition.current = true
      return false
    }
    // Coalesce edits made during a request and compare against its confirmed result.
    if (pendingSave.current) {
      if (!await pendingSave.current) return false
      return persist()
    }
    const snapshot = { ...current.current }
    const patch: Partial<GoalDraft> = {}
    const title = snapshot.title.trim()
    if (title && title !== confirmed.current.title) patch.title = title
    if (snapshot.notes !== confirmed.current.notes) patch.notes = snapshot.notes
    if (snapshot.completed !== confirmed.current.completed) patch.completed = snapshot.completed
    if (!Object.keys(patch).length) return true

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
        return true
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
      return false
    })()
    pendingSave.current = request
    try {
      return await request
    } finally {
      if (pendingSave.current === request) pendingSave.current = null
    }
  }, [task.id])

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      composing.current = false
      // Closing or navigating away commits any remaining draft edits.
      void save()
    }
  }, [save])

  function update(patch: Partial<GoalDraft>) {
    current.current = { ...current.current, ...patch }
    setDraft(current.current)
  }

  function startComposition() {
    composing.current = true
  }

  function endComposition() {
    composing.current = false
    if (saveAfterComposition.current) {
      saveAfterComposition.current = false
      void save()
    }
  }

  function setSavingEnabled(enabled: boolean) {
    savingEnabled.current = enabled
  }

  return { draft, update, save, startComposition, endComposition, setSavingEnabled }
}
