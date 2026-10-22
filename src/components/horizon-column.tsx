import { useRef, useState, type DragEvent, type FormEvent } from 'react'
import { ArrowRight, LoaderCircle, PanelRightClose, Plus } from 'lucide-react'
import { Input } from './ui/input'
import { GoalRow, goalDragType } from './goal-row'
import { horizonLabels } from './schedule-picker'
import { IconButton } from './planner-controls'
import { formatDate, periodLabel } from '../lib/calendar'
import type { Horizon, Schedule, Task } from '../lib/model'
import type { Mutate } from './use-workspace'

export function HorizonColumn({ schedule, tasks, today, mutate, collapsible, onCollapse, onFocus, dragging, setDragging, onOpen, onSchedule, onPosition, onDelete, expandedCount, dedicated }: {
  schedule: Schedule; tasks: Task[]; today: string; mutate: Mutate;
  collapsible: boolean; onCollapse: (horizon: Horizon) => void; onFocus: (schedule: Schedule) => void;
  dragging: string | null; setDragging: (id: string | null) => void; onOpen: (id: string) => void; onSchedule: (task: Task) => void;
  onPosition: (task: Task) => void; onDelete: (task: Task) => void; expandedCount: number; dedicated: boolean;
}) {
  const [title, setTitle] = useState('')
  const [adding, setAdding] = useState(false)
  const [over, setOver] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const heading = schedule.horizon === 'day' ? periodLabel(schedule, today, true) : schedule.horizon === 'week' ? (dedicated ? periodLabel(schedule, today, true) : 'Week') : schedule.horizon === 'month' ? formatDate(schedule.date!, { month: 'long' }) : periodLabel(schedule, today)
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!title.trim() || adding) return
    setAdding(true)
    const result = await mutate({ action: 'create', title: title.trim(), schedule, board: null })
    if (result) setTitle('')
    setAdding(false); requestAnimationFrame(() => input.current?.focus())
  }
  function drop(event: DragEvent, beforeId: string | null) {
    event.preventDefault(); event.stopPropagation(); setOver(false)
    const id = event.dataTransfer.getData(goalDragType)
    if (id && dragging && id !== beforeId) void mutate({ action: 'move', id, schedule, beforeId })
    setDragging(null)
  }
  return <section className={`horizon-column horizon-${schedule.horizon} ${over ? 'column-drop-over' : ''} ${dedicated ? 'dedicated-column' : ''}`} style={{ '--expanded-count': expandedCount } as React.CSSProperties} aria-label={`${horizonLabels[schedule.horizon]}: ${periodLabel(schedule, today)}`}
    onDragOver={event => { if (dragging) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; setOver(true) } }} onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setOver(false) }} onDrop={event => drop(event, null)}>
    <header className="column-header"><button className="column-heading" onClick={() => onFocus(schedule)} title={`Open ${horizonLabels[schedule.horizon]} view`}><h1>{heading}</h1></button><div className="column-header-tools">
      <IconButton label={`Add a goal to ${heading}`} onClick={() => input.current?.focus()}><Plus size={17} /></IconButton>
      {collapsible && <IconButton label={`Collapse ${horizonLabels[schedule.horizon]}`} onClick={() => onCollapse(schedule.horizon)}><PanelRightClose size={17} /></IconButton>}
    </div></header>
    <div className="column-scroll"><div className="goals-list">{tasks.map(task => <GoalRow key={task.id} task={task} mutate={mutate} onOpen={onOpen} onSchedule={onSchedule} onPosition={onPosition} onDelete={onDelete} dragging={dragging} onDrag={setDragging} onDrop={drop} />)}</div>
      <form className="add-goal-form" onSubmit={submit}><span className="add-goal-square" aria-hidden /><Input ref={input} aria-label={`Add a goal to ${heading}`} placeholder="Add..." className="add-goal-input" value={title} maxLength={240} disabled={adding} onChange={event => setTitle(event.target.value)} onKeyDown={event => { if (event.key === 'Escape') { setTitle(''); input.current?.blur() } }} />{title && <button type="submit" disabled={adding} aria-label="Save goal">{adding ? <LoaderCircle size={15} className="spin" /> : <ArrowRight size={16} />}</button>}</form>
    </div>
  </section>
}
