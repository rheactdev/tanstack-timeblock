import { useRef, useState, type DragEvent, type FormEvent } from 'react'
import { LoaderCircle, PanelRightClose, Plus, X } from 'lucide-react'
import { Input } from './ui/input'
import { Kbd } from './ui/kbd'
import { GoalRow, goalDragType } from './goal-row'
import { horizonLabels } from './schedule-picker'
import { IconButton } from './planner-controls'
import { formatDate, periodLabel } from '../lib/calendar'
import type { Horizon, Schedule, Task } from '../lib/model'
import type { Mutate } from './use-workspace'

export function HorizonColumn({ schedule, tasks, today, mutate, collapsible, onCollapse, onFocus, dragging, setDragging, onOpen, expandedCount, dedicated, onExitFocus }: {
  schedule: Schedule; tasks: Task[]; today: string; mutate: Mutate;
  collapsible: boolean; onCollapse: (horizon: Horizon) => void; onFocus: (schedule: Schedule) => void;
  dragging: string | null; setDragging: (id: string | null) => void; onOpen: (id: string) => void;
  expandedCount: number; dedicated: boolean;
  onExitFocus?: () => void;
}) {
  const [title, setTitle] = useState('')
  const [adding, setAdding] = useState(false)
  const [over, setOver] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const heading = onExitFocus ? periodLabel(schedule, today) : schedule.horizon === 'day' ? periodLabel(schedule, today, true) : schedule.horizon === 'week' ? (dedicated ? periodLabel(schedule, today, true) : 'Week') : schedule.horizon === 'month' ? formatDate(schedule.date!, { month: 'long' }) : periodLabel(schedule, today)
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
    <header className="column-header">{onExitFocus ? <div className="column-heading"><h1>{heading}</h1></div> : <button className="column-heading" onClick={() => onFocus(schedule)} title={`Open ${horizonLabels[schedule.horizon]} view`}><h1>{heading}</h1></button>}<div className="column-header-tools">
      <IconButton label={`Add a goal to ${heading}`} onClick={() => input.current?.focus()}><Plus size={17} /></IconButton>
      {collapsible && <IconButton label={`Collapse ${horizonLabels[schedule.horizon]}`} onClick={() => onCollapse(schedule.horizon)}><PanelRightClose size={17} /></IconButton>}
      {onExitFocus && <IconButton label="Back to Horizons" variant="outline" onClick={onExitFocus}><X size={17} /></IconButton>}
    </div></header>
    <div className="column-scroll"><div className="goals-list">{tasks.map(task => <GoalRow key={task.id} task={task} mutate={mutate} onOpen={onOpen} dragging={dragging} onDrag={setDragging} onDrop={drop} />)}</div>
      <form className="add-goal-form" onSubmit={submit} aria-busy={adding}>
        <div className="add-goal-control" data-adding={adding || undefined} onClick={event => { if (!(event.target as Element).closest('button')) input.current?.focus() }}>
          <span className="add-goal-square" aria-hidden />
          <Input ref={input} aria-label={`Add a goal to ${heading}`} aria-keyshortcuts="Enter" placeholder="Add..." className="add-goal-input block h-full border-0 bg-transparent p-0 shadow-none focus-visible:translate-x-0 focus-visible:translate-y-0" value={title} maxLength={240} disabled={adding} onChange={event => setTitle(event.target.value)} onKeyDown={event => { if (event.key === 'Escape') { setTitle(''); input.current?.blur() } }} />
          <button type="submit" className="add-goal-submit" disabled={adding || !title.trim()} aria-label={adding ? 'Adding goal' : 'Add goal (Enter)'}>
            {adding ? <LoaderCircle size={15} className="spin" aria-hidden /> : <Kbd size="sm" aria-hidden>Enter</Kbd>}
          </button>
        </div>
      </form>
    </div>
  </section>
}
