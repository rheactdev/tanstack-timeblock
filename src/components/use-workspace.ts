import { useEffect, useRef, useState } from 'react'
import { changeWorkspace } from '../lib/functions'
import { applyMutation, canApplyOptimistically } from '../lib/workspace'
import type { Mutation, Workspace, WorkspaceData } from '../lib/model'
import { toast } from './ui/toast'

export type Mutate = (mutation: Mutation) => Promise<Workspace | null>
export type SyncStatus = 'synced' | 'syncing' | 'error'
type Pending = { token: number; mutation: Mutation; now: string }

export function useWorkspace(initial: WorkspaceData) {
  const [data, setData] = useState(initial)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced')
  const lastSaveFailed = useRef(false)
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
    setSyncStatus(pending.current.length > 0 ? 'syncing' : lastSaveFailed.current ? 'error' : 'synced')
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
        lastSaveFailed.current = false
      } catch (error) {
        lastSaveFailed.current = true
        toast.error('Changes were not saved', { description: error instanceof Error ? error.message : 'Please try again. Your previous data has been restored.' })
      } finally {
        pending.current = pending.current.filter(item => item.token !== operation.token)
        repaint()
        finish(result)
      }
    })
    return promise
  }
  return { data, saving: syncStatus === 'syncing', syncStatus, mutate }
}
