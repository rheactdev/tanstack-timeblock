import { useState } from 'react'
import { Check, LoaderCircle, Trash2 } from 'lucide-react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Checkbox } from './ui/checkbox'
import { Modal, SelectField } from './planner-controls'
import { SchedulePopover } from './schedule-picker'
import { goalColors, colorLabels, type Task } from '../lib/model'
import { samePeriod, sortedTasks } from '../lib/calendar'
import type { Mutate } from './use-workspace'

export function GoalEditor({ task, today, mutate, onClose, onDelete }: { task: Task; today: string; mutate: Mutate; onClose: () => void; onDelete: (task: Task) => void }) {
  const [draft, setDraft] = useState(task)
  const [busy, setBusy] = useState(false)
  return <Modal title="Goal" description="Edit this goal and its schedule." onClose={onClose} className="goal-editor">
    <form className="editor-form" onSubmit={async event => {
      event.preventDefault(); setBusy(true)
      const result = await mutate({ action: 'update', id: task.id, patch: { title: draft.title.trim(), notes: draft.notes, completed: draft.completed, color: draft.color }, schedule: { horizon: draft.horizon, date: draft.date } })
      setBusy(false); if (result) onClose()
    }}>
      <Textarea aria-label="Goal title" className="goal-title-editor" value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} maxLength={240} rows={2} required />
      <label className="field-stack"><span>Schedule</span><SchedulePopover schedule={{ horizon: draft.horizon, date: draft.date }} today={today} onChange={schedule => setDraft({ ...draft, ...schedule })} /></label>
      <fieldset className="color-field"><legend>Color</legend><div className="color-choices">{goalColors.map(color => <button type="button" key={color} className={`color-choice ${draft.color === color ? 'selected' : ''}`} title={colorLabels[color]} aria-label={colorLabels[color]} aria-pressed={draft.color === color} style={{ backgroundColor: color === 'none' ? 'transparent' : color }} onClick={() => setDraft({ ...draft, color })}>{draft.color === color && <Check size={14} />}</button>)}</div></fieldset>
      <label className="field-stack"><span>Notes & thoughts</span><Textarea aria-label="Notes and thoughts" placeholder="Add notes..." className="goal-notes" value={draft.notes} onChange={event => setDraft({ ...draft, notes: event.target.value })} rows={7} maxLength={5000} /></label>
      <label className="checkbox-label"><Checkbox checked={draft.completed} onCheckedChange={value => setDraft({ ...draft, completed: value === true })} />Completed</label>
      <div className="editor-footer"><Button type="button" variant="ghost" className="danger-menu-item" disabled={busy} onClick={() => onDelete(task)}><Trash2 size={15} />Delete</Button><Button type="submit" disabled={busy || !draft.title.trim()}>{busy ? <LoaderCircle size={15} className="spin" /> : <Check size={15} />}Save</Button></div>
    </form>
  </Modal>
}

export function PositionDialog({ task, tasks, mutate, onClose }: { task: Task; tasks: Task[]; mutate: Mutate; onClose: () => void }) {
  const siblings = sortedTasks(tasks.filter(item => !item.deletedAt && item.id !== task.id && samePeriod(item, task)))
  const [beforeId, setBeforeId] = useState(siblings[0]?.id || '__last')
  const [busy, setBusy] = useState(false)
  return <Modal title="Move to position" description={task.title} onClose={onClose}><label className="field-stack"><span>Place this goal</span><SelectField label="Goal position" value={beforeId} onChange={setBeforeId} items={[...siblings.map((item, index) => ({ value: item.id, label: `${index + 1}. Before ${item.title}` })), { value: '__last', label: 'At the end of the list' }]} /></label><Button disabled={busy} onClick={async () => { setBusy(true); const result = await mutate({ action: 'move', id: task.id, schedule: { horizon: task.horizon, date: task.date }, beforeId: beforeId === '__last' ? null : beforeId }); setBusy(false); if (result) onClose() }}>Move goal</Button></Modal>
}
