import { useId, useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
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
import { toast } from './ui/toast'
import type { Mutate } from './use-workspace'

type EditorAction = 'closing' | 'deleting' | 'duplicating'

export function GoalEditor({ task, mutate, onClose, onDelete }: { task: Task; mutate: Mutate; onClose: () => void; onDelete: (task: Task) => Promise<boolean> }) {
  const titleId = useId()
  const notesId = useId()
  const completedId = useId()
  const titleErrorId = useId()
  const titleInput = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState({ title: task.title, notes: task.notes, completed: task.completed })
  const confirmed = useRef(draft)
  const pendingSave = useRef<Promise<boolean> | null>(null)
  const [action, setAction] = useState<EditorAction | null>(null)
  const busy = action !== null
  const titleIsEmpty = !draft.title.trim()

  async function save(): Promise<boolean> {
    const snapshot = draft
    // Blur and clicking Close can request the same save; await the first one.
    while (pendingSave.current) {
      if (!await pendingSave.current) return false
    }
    const next = { ...snapshot, title: snapshot.title.trim() || confirmed.current.title }
    if (next.title === confirmed.current.title && next.notes === confirmed.current.notes && next.completed === confirmed.current.completed) return true
    const request = mutate({ action: 'update', id: task.id, patch: next }).then(result => {
      if (result) {
        confirmed.current = next
        return true
      }
      setDraft(current => ({
        title: current.title === snapshot.title ? confirmed.current.title : current.title,
        notes: current.notes === snapshot.notes ? confirmed.current.notes : current.notes,
        completed: current.completed === snapshot.completed ? confirmed.current.completed : current.completed,
      }))
      return false
    })
    pendingSave.current = request
    try {
      return await request
    } finally {
      pendingSave.current = null
    }
  }

  async function handleAction(next: EditorAction) {
    if (busy) return
    if (next !== 'deleting' && titleIsEmpty) {
      titleInput.current?.focus()
      return
    }
    setAction(next)
    try {
      if (!await save()) return
      if (next === 'closing') onClose()
      else if (next === 'deleting') await onDelete(task)
      else if (await mutate({ action: 'duplicate', id: task.id })) toast.success('Goal duplicated')
    } finally {
      setAction(null)
    }
  }

  return <Modal title="Edit goal" hideHeader onClose={() => { void handleAction('closing') }} className="goal-editor" headerContent={<Badge>{task.horizon.charAt(0).toUpperCase() + task.horizon.slice(1)}</Badge>}>
    <form className="editor-form" onSubmit={event => {
      event.preventDefault()
    }} aria-busy={busy} onBlur={() => { void save() }}>
      <div className="grid w-full gap-2">
        <Label htmlFor={titleId}>Title</Label>
        <Input ref={titleInput} autoFocus type="text" id={titleId} name="title" placeholder="Enter a goal title" value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} aria-invalid={titleIsEmpty || undefined} aria-describedby={titleIsEmpty ? titleErrorId : undefined} maxLength={240} disabled={busy} required />
        {titleIsEmpty && <p id={titleErrorId} className="form-error" role="alert">Title is required.</p>}
      </div>
      <div className="grid w-full gap-2">
        <Label htmlFor={notesId}>Notes & thoughts</Label>
        <Textarea id={notesId} name="notes" placeholder="Add notes..." className="goal-notes" value={draft.notes} onChange={event => setDraft({ ...draft, notes: event.target.value })} rows={7} maxLength={5000} disabled={busy} />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id={completedId} checked={draft.completed} onCheckedChange={value => setDraft({ ...draft, completed: value === true })} disabled={busy} />
        <Label htmlFor={completedId}>Completed</Label>
      </div>
    </form>
    <DialogFooter className="flex-col items-start gap-4 sm:items-center sm:justify-between sm:space-x-0" aria-busy={busy}>
      <Button type="button" size="sm" variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" disabled={busy} onClick={() => { void handleAction('deleting') }}><Trash2 aria-hidden="true" />{action === 'deleting' ? 'Deleting…' : 'Delete'}</Button>
      <div className="flex items-center justify-end gap-3 self-end sm:self-auto">
        <Button type="button" size="sm" variant="outline" disabled={busy || titleIsEmpty} onClick={() => { void handleAction('duplicating') }}>{action === 'duplicating' ? 'Duplicating…' : 'Duplicate'}</Button>
        <Button type="button" size="sm" disabled={busy} onClick={() => { void handleAction('closing') }}>{action === 'closing' ? 'Saving…' : 'Close'}</Button>
      </div>
    </DialogFooter>
  </Modal>
}

export function PositionDialog({ task, tasks, mutate, onClose }: { task: Task; tasks: Task[]; mutate: Mutate; onClose: () => void }) {
  const siblings = sortedTasks(tasks.filter(item => !item.deletedAt && item.id !== task.id && samePeriod(item, task)))
  const [beforeId, setBeforeId] = useState(siblings[0]?.id || '__last')
  const [busy, setBusy] = useState(false)
  return <Modal title="Move to position" description={task.title} onClose={onClose}><label className="field-stack"><span>Place this goal</span><SelectField label="Goal position" value={beforeId} onChange={setBeforeId} items={[...siblings.map((item, index) => ({ value: item.id, label: `${index + 1}. Before ${item.title}` })), { value: '__last', label: 'At the end of the list' }]} /></label><Button disabled={busy} onClick={async () => { setBusy(true); const result = await mutate({ action: 'move', id: task.id, schedule: { horizon: task.horizon, date: task.date }, beforeId: beforeId === '__last' ? null : beforeId }); setBusy(false); if (result) onClose() }}>Move goal</Button></Modal>
}
