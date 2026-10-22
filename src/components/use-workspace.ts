import { useEffect, useRef, useState } from 'react'
import { changeWorkspace } from '../lib/functions'
import { applyMutation, canApplyOptimistically } from '../lib/workspace'
import type { Mutation, Workspace, WorkspaceData } from '../lib/model'
import { toast } from './ui/toast'

export type Mutate = (mutation: Mutation) => Promise<Workspace | null>
type Pending = { token: number; mutation: Mutation; now: string }

export function useWorkspace(initial: WorkspaceData) {
  const [data, setData] = useState(initial)
  const [saving, setSaving] = useState(false)
  const confirmed = useRef(initial)
  const queue = useRef(Promise.resolve())
  const pending = useRef<Pending[]>([])
  const counter = useRef(0)
  useEffect(() => {
    if (!pending.current.length) { confirmed.current = initial; setData(initial) }
  }, [initial])
  function repaint() {
    let projected: Workspace = confirmed.current
    for (const operation of pending.current) {
      if (!canApplyOptimistically(operation.mutation)) continue
      try { projected = applyMutation(projected, operation.mutation, operation.now, () => '') } catch { /* A prior operation may have removed this goal. The server resolves it. */ }
    }
    setData({ ...confirmed.current, ...projected })
    setSaving(pending.current.length > 0)
  }
  const mutate: Mutate = mutation => {
    const operation = { token: ++counter.current, mutation, now: new Date().toISOString() }
    pending.current.push(operation)
    repaint()
    let finish!: (result: Workspace | null) => void
    const promise = new Promise<Workspace | null>(resolve => { finish = resolve })
    queue.current = queue.current.then(async () => {
      let result: Workspace | null = null
      try {
        result = await changeWorkspace({ data: mutation })
        confirmed.current = { ...confirmed.current, ...result }
      } catch (error) {
        toast.error('Changes were not saved', { description: error instanceof Error ? error.message : 'Please try again. Your previous data has been restored.' })
      } finally {
        pending.current = pending.current.filter(item => item.token !== operation.token)
        repaint()
        finish(result)
      }
    })
    return promise
  }
  return { data, saving, mutate }
}
