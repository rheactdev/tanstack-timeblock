import { useRef, useState, type DragEvent } from 'react'
import { CalendarDays, Check, Copy, GripVertical, MoreHorizontal, MoveVertical, Pencil, Trash2 } from 'lucide-react'
import { Checkbox } from './ui/checkbox'
import { Input } from './ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from './ui/dropdown-menu'
import { Button } from './ui/button'
import { colorLabels, goalColors, type Task } from '../lib/model'
import type { Mutate } from './use-workspace'

export const goalDragType = 'application/x-timestripe-goal'
export function GoalRow({ task, mutate, onOpen, onSchedule, onPosition, onDelete, dragging, onDrag, onDrop }: {
  task: Task; mutate: Mutate; onOpen: (id: string) => void; onSchedule: (task: Task) => void;
  onPosition: (task: Task) => void; onDelete: (task: Task) => void;
  dragging: string | null; onDrag: (id: string | null) => void; onDrop: (event: DragEvent, beforeId: string | null) => void;
}) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const submitted = useRef(false)
  const [dropOver, setDropOver] = useState(false)
  function rename() { setTitle(task.title); submitted.current = false; setEditing(true) }
  function commit() {
    if (submitted.current) return
    submitted.current = true; setEditing(false)
    if (title.trim() && title.trim() !== task.title) void mutate({ action: 'update', id: task.id, patch: { title: title.trim() } })
  }
  return <article className={`goal-row ${task.completed ? 'is-complete' : ''} ${dragging === task.id ? 'is-dragging' : ''} ${dropOver ? 'drop-before' : ''}`} draggable={!editing}
    onDragStart={event => { event.dataTransfer.setData(goalDragType, task.id); event.dataTransfer.effectAllowed = 'move'; onDrag(task.id) }} onDragEnd={() => { onDrag(null); setDropOver(false) }}
    onDragOver={event => { if (dragging && dragging !== task.id) { event.preventDefault(); event.stopPropagation(); setDropOver(true) } }}
    onDragLeave={() => setDropOver(false)} onDrop={event => { setDropOver(false); if (dragging !== task.id) onDrop(event, task.id); else { event.preventDefault(); event.stopPropagation() } }}>
    <span className="goal-grip" aria-hidden><GripVertical size={13} /></span>
    <Checkbox className="goal-checkbox" checked={task.completed} aria-label={`${task.completed ? 'Reopen' : 'Complete'} ${task.title}`} onCheckedChange={checked => void mutate({ action: 'update', id: task.id, patch: { completed: checked === true } })} />
    {editing ? <Input className="inline-goal-input" autoFocus aria-label="Edit goal title" value={title} maxLength={240} onChange={event => setTitle(event.target.value)} onBlur={commit} onKeyDown={event => {
      if (event.key === 'Enter') { event.preventDefault(); commit() }
      if (event.key === 'Escape') { event.preventDefault(); submitted.current = true; setEditing(false) }
    }} /> : <button type="button" className="goal-title" onClick={event => { if (event.altKey) rename(); else onOpen(task.id) }} onKeyDown={event => { if (event.key === 'Enter' && event.altKey) { event.preventDefault(); rename() } }}><span>{task.title}</span>{task.color !== 'none' && <i className="goal-color-marker" aria-label={colorLabels[task.color]} style={{ backgroundColor: task.color }} />}{task.notes && <span className="goal-note-indicator" title="Has notes" aria-label="Has notes">≡</span>}</button>}
    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="goal-menu-trigger" aria-label={`Options for ${task.title}`}><MoreHorizontal size={17} /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="goal-menu">
      <DropdownMenuItem onSelect={() => onOpen(task.id)}><Pencil size={14} />Open goal</DropdownMenuItem>
      <DropdownMenuItem onSelect={rename}><Pencil size={14} />Rename</DropdownMenuItem>
      <DropdownMenuItem onSelect={() => onSchedule(task)}><CalendarDays size={14} />Reschedule</DropdownMenuItem>
      <DropdownMenuItem onSelect={() => onPosition(task)}><MoveVertical size={14} />Move to position</DropdownMenuItem>
      <DropdownMenuSub><DropdownMenuSubTrigger>Color</DropdownMenuSubTrigger><DropdownMenuSubContent>{goalColors.map(color => <DropdownMenuItem key={color} onSelect={() => void mutate({ action: 'update', id: task.id, patch: { color } })}><span className="color-dot" style={{ backgroundColor: color === 'none' ? 'transparent' : color }} />{colorLabels[color]}{task.color === color && <Check size={13} className="ml-auto" />}</DropdownMenuItem>)}</DropdownMenuSubContent></DropdownMenuSub>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={() => void mutate({ action: 'duplicate', id: task.id })}><Copy size={14} />Duplicate</DropdownMenuItem>
      <DropdownMenuItem className="danger-menu-item" onSelect={() => onDelete(task)}><Trash2 size={14} />Delete</DropdownMenuItem>
    </DropdownMenuContent></DropdownMenu>
  </article>
}
