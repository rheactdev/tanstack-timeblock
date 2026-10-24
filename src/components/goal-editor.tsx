import { useId, useState } from 'react'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Checkbox } from './ui/checkbox'
import { DialogFooter } from './ui/dialog'
import { Modal, SelectField } from './planner-controls'
import type { Task } from '../lib/model'
import { samePeriod, sortedTasks } from '../lib/calendar'
import { useGoalDraft } from './use-goal-draft'
import { toast } from './ui/toast'
import type { Mutate } from './use-workspace'

export function GoalEditor({ task, mutate, onClose, onDelete }: { task: Task; mutate: Mutate; onClose: () => void; onDelete: (task: Task) => Promise<boolean> }) {
  const titleId = useId()
  const notesId = useId()
  const completedId = useId()
  const titleErrorId = useId()
  const [deleting, setDeleting] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const busy = deleting || duplicating
  const { draft, update, save, startComposition, endComposition, setSavingEnabled } = useGoalDraft(task, mutate)
  const titleIsEmpty = !draft.title.trim()
  function close() {
    if (busy) return
    void save()
    onClose()
  }
  async function deleteGoal() {
    if (busy) return
    setDeleting(true)
    let deleted = false
    try {
      await save()
      // Deletion unmounts this editor; skip its normal save-on-close cleanup.
      setSavingEnabled(false)
      deleted = await onDelete(task)
    } finally {
      if (!deleted) {
        setSavingEnabled(true)
        setDeleting(false)
      }
    }
  }
  async function duplicateGoal() {
    if (busy || titleIsEmpty) return
    setDuplicating(true)
    try {
      if (!await save()) return
      const result = await mutate({ action: 'duplicate', id: task.id })
      if (result) toast.success('Goal duplicated')
    } finally {
      setDuplicating(false)
    }
  }
  return <Modal title="Edit goal" hideHeader onClose={close} className="goal-editor" headerContent={<Badge>{task.horizon.charAt(0).toUpperCase() + task.horizon.slice(1)}</Badge>}>
    <form className="editor-form" onSubmit={event => {
      event.preventDefault()
    }} onBlur={() => { void save() }} onCompositionStart={startComposition} onCompositionEnd={endComposition}>
      <div className="grid w-full gap-2">
        <Label htmlFor={titleId}>Title</Label>
        <Input autoFocus type="text" id={titleId} name="title" placeholder="Enter a goal title" value={draft.title} onChange={event => update({ title: event.target.value })} aria-invalid={titleIsEmpty || undefined} aria-describedby={titleIsEmpty ? titleErrorId : undefined} maxLength={240} disabled={busy} required />
        {titleIsEmpty && <p id={titleErrorId} className="form-error" role="alert">Title is required.</p>}
      </div>
      <div className="grid w-full gap-2">
        <Label htmlFor={notesId}>Notes & thoughts</Label>
        <Textarea id={notesId} name="notes" placeholder="Add notes..." className="goal-notes" value={draft.notes} onChange={event => update({ notes: event.target.value })} rows={7} maxLength={5000} disabled={busy} />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id={completedId} checked={draft.completed} onCheckedChange={value => update({ completed: value === true })} disabled={busy} />
        <Label htmlFor={completedId}>Completed</Label>
      </div>
    </form>
    <DialogFooter className="gap-3 sm:gap-0">
      <Button type="button" variant="outline" disabled={busy || titleIsEmpty} onClick={() => { void duplicateGoal() }}>{duplicating ? 'Duplicating…' : 'Duplicate'}</Button>
      <Button type="button" variant="destructive" disabled={busy} onClick={() => { void deleteGoal() }}>{deleting ? 'Deleting…' : 'Delete'}</Button>
    </DialogFooter>
  </Modal>
}

export function PositionDialog({ task, tasks, mutate, onClose }: { task: Task; tasks: Task[]; mutate: Mutate; onClose: () => void }) {
  const siblings = sortedTasks(tasks.filter(item => !item.deletedAt && item.id !== task.id && samePeriod(item, task)))
  const [beforeId, setBeforeId] = useState(siblings[0]?.id || '__last')
  const [busy, setBusy] = useState(false)
  return <Modal title="Move to position" description={task.title} onClose={onClose}><label className="field-stack"><span>Place this goal</span><SelectField label="Goal position" value={beforeId} onChange={setBeforeId} items={[...siblings.map((item, index) => ({ value: item.id, label: `${index + 1}. Before ${item.title}` })), { value: '__last', label: 'At the end of the list' }]} /></label><Button disabled={busy} onClick={async () => { setBusy(true); const result = await mutate({ action: 'move', id: task.id, schedule: { horizon: task.horizon, date: task.date }, beforeId: beforeId === '__last' ? null : beforeId }); setBusy(false); if (result) onClose() }}>Move goal</Button></Modal>
}
