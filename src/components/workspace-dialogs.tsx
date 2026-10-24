import { useState, type FormEvent } from 'react'
import { ArrowDownToLine, ArrowRight, Check, LoaderCircle, Search, Undo2 } from 'lucide-react'
import { authClient } from '../lib/auth-client'
import { colorLabels, goalColors, filterTasks, type PlannerSearch, type WorkspaceData } from '../lib/model'
import { periodLabel } from '../lib/calendar'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Checkbox } from './ui/checkbox'
import { toast } from './ui/toast'
import { Modal } from './planner-controls'
import { ProfilePictureEditor } from './profile-picture-editor'
import type { Mutate } from './use-workspace'

export function FilterDialog({ search, onChange, onClose }: { search: PlannerSearch; onChange: (patch: Partial<PlannerSearch>) => void; onClose: () => void }) {
  return <Modal title="Filters" description="Filter the goals in your current view." onClose={onClose}>
    <label className="checkbox-label"><Checkbox checked={search.completed} onCheckedChange={checked => onChange({ completed: checked === true })} />Show completed goals</label>
    <fieldset className="filter-colors"><legend>Color</legend><button className={search.color === 'all' ? 'selected' : ''} onClick={() => onChange({ color: 'all' })}>All colors{search.color === 'all' && <Check size={15} />}</button>{goalColors.map(color => <button key={color} className={search.color === color ? 'selected' : ''} onClick={() => onChange({ color })}><span className="color-dot" style={{ backgroundColor: color === 'none' ? 'transparent' : color }} />{colorLabels[color]}{search.color === color && <Check size={15} />}</button>)}</fieldset>
    <div className="dialog-actions"><Button variant="outline" size="sm" onClick={() => onChange({ q: '', color: 'all', completed: true, board: 'all' })}>Reset</Button><Button size="sm" onClick={onClose}>Done</Button></div>
  </Modal>
}

export function SearchDialog({ data, onOpen, onClose, onFilter, query }: { data: WorkspaceData; onOpen: (id: string) => void; onClose: () => void; onFilter: (query: string) => void; query: string }) {
  const [term, setTerm] = useState(query)
  const results = filterTasks(data.tasks, { q: term, color: 'all', completed: true, board: 'all' }).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 30)
  return <Modal title="Search" description="Search goal titles and notes across all periods." onClose={onClose} className="search-dialog"><form className="search-input-row" onSubmit={event => { event.preventDefault(); onFilter(term); onClose() }}><Search size={20} /><Input autoFocus aria-label="Search all goals" placeholder="Search goals and notes..." value={term} onChange={event => setTerm(event.target.value)} maxLength={200} /><Button type="submit" size="sm">Filter</Button></form><p className="small-label">{term ? 'Matching goals' : 'Recent goals'}</p><div className="search-results">{results.length ? results.map(task => <button key={task.id} onClick={() => { onOpen(task.id); onClose() }}><span className={`search-goal-check ${task.completed ? 'complete' : ''}`}>{task.completed && <Check size={12} />}</span><span>{task.title}<small>{periodLabel(task, data.today)}</small></span><ArrowRight size={14} /></button>) : <p className="empty-message">No goals found.</p>}</div><p className="dialog-footnote">Search matches whole words. Press Esc to close.</p></Modal>
}

export function DeletedDialog({ data, mutate, onClose }: { data: WorkspaceData; mutate: Mutate; onClose: () => void }) {
  const deleted = data.tasks.filter(task => task.deletedAt).sort((a, b) => b.deletedAt!.localeCompare(a.deletedAt!))
  const [busy, setBusy] = useState<string | null>(null)
  return <Modal title="Deleted goals" description="Restore a goal to its original period." onClose={onClose} className="deleted-dialog"><div className="deleted-goals">{deleted.length ? deleted.map(task => <div className="deleted-goal" key={task.id}><div><span>{task.title}</span><small>{periodLabel(task, data.today)}</small></div><Button variant="outline" size="sm" disabled={busy === task.id} onClick={async () => { setBusy(task.id); const result = await mutate({ action: 'restore', id: task.id }); setBusy(null); if (result) toast.success('Goal restored') }}><Undo2 size={13} />Restore</Button></div>) : <p className="empty-message">No deleted goals.</p>}</div></Modal>
}

export function SettingsDialog({ data, onClose, onAccount, onDeleted, onAppearance }: { data: WorkspaceData; onClose: () => void; onAccount: () => void; onDeleted: () => void; onAppearance: () => void }) {
  return <Modal title="Settings" onClose={onClose}><div className="settings-list"><button onClick={onAccount}><span>Account<small>{data.user?.email || 'Sign in or create an account'}</small></span><ArrowRight size={16} /></button><button onClick={onAppearance}><span>Background<small>Change the scenic strip</small></span><ArrowRight size={16} /></button><button onClick={onDeleted}><span>Deleted goals<small>{data.tasks.filter(task => task.deletedAt).length} goals</small></span><ArrowRight size={16} /></button><div><span>Calendar<small>{data.timezone} · Monday-start weeks</small></span></div><div><span>Appearance<small>BoldKit · Dark</small></span></div></div><Button variant="outline" className="w-full" onClick={() => { const blob = new Blob([JSON.stringify({ schemaVersion: data.schemaVersion, tasks: data.tasks, boards: data.boards, preferences: data.preferences }, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'timestripe-workspace.json'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000) }}><ArrowDownToLine size={15} />Export workspace</Button></Modal>
}

export function AppearanceDialog({ data, mutate, onClose }: { data: WorkspaceData; mutate: Mutate; onClose: () => void }) {
  return <Modal title="Background" description="Choose the scenery beside your horizons." onClose={onClose}><div className="scene-choices">{[{ value: 'alpine', label: 'Alpine dusk' }, { value: 'forest', label: 'Forest quiet' }, { value: 'rose', label: 'Golden hour' }].map(scene => <button className={`scene-choice scene-${scene.value} ${data.preferences.scene === scene.value ? 'selected' : ''}`} key={scene.value} onClick={() => void mutate({ action: 'preferences', patch: { scene: scene.value as 'alpine' | 'forest' | 'rose' } })}><span className="scene-thumbnail" /><span>{scene.label}</span>{data.preferences.scene === scene.value && <Check size={17} />}</button>)}</div><Button onClick={onClose}>Done</Button></Modal>
}

export function AccountDialog({ user, pendingSaves, onClose, onChanged, onProfileChanged }: { user: WorkspaceData['user']; pendingSaves: boolean; onClose: () => void; onChanged: () => Promise<void>; onProfileChanged: () => Promise<void> }) {
  const [signup, setSignup] = useState(false)
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy || uploading || pendingSaves) return; setError(''); setBusy(true)
    const fields = new FormData(event.currentTarget)
    const credentials = { email: String(fields.get('email')), password: String(fields.get('password')) }
    try {
      const result = signup ? await authClient.signUp.email({ ...credentials, name: String(fields.get('name')) }) : await authClient.signIn.email(credentials)
      if (result.error) setError(result.error.message || 'Please check your details.')
      else await onChanged()
    } catch { setError('Could not connect. Please try again.') } finally { setBusy(false) }
  }
  return <Modal title={user ? 'Your account' : signup ? 'Create an account' : 'Sign in'} description={user?.email || 'Keep your goals in your own personal workspace.'} onClose={onClose}>
    {pendingSaves && <p className="dialog-footnote">Your changes are saving. Account actions will be available when they finish.</p>}
    {user ? <>
      <ProfilePictureEditor user={user} disabled={busy || pendingSaves} onBusyChange={setUploading} onChanged={onProfileChanged} />
      <p className="account-name">{user.name}</p>
      <Button variant="outline" disabled={busy || uploading || pendingSaves} onClick={async () => {
        setBusy(true); setError('')
        try {
          const result = await authClient.signOut()
          if (result.error) setError(result.error.message || 'Could not sign out.')
          else await onChanged()
        } catch { setError('Could not connect. Please try again.') }
        finally { setBusy(false) }
      }}>Sign out</Button>
    </> : <>
      <form className="stack-form" onSubmit={submit}>
        {signup && <label className="field-stack"><span>Name</span><Input name="name" required maxLength={100} autoComplete="name" /></label>}
        <label className="field-stack"><span>Email</span><Input autoFocus name="email" type="email" required autoComplete="email" /></label>
        <label className="field-stack"><span>Password</span><Input name="password" type="password" minLength={8} required autoComplete={signup ? 'new-password' : 'current-password'} /></label>
        <Button disabled={busy || pendingSaves}>{busy && <LoaderCircle size={15} className="spin" />}{signup ? 'Create account' : 'Sign in'}</Button>
      </form>
      <button className="text-action" onClick={() => { setSignup(!signup); setError('') }}>{signup ? 'Already have an account? Sign in' : 'Create an account'}</button>
      <p className="dialog-footnote">Guest and account workspaces are separate. New accounts start empty.</p>
    </>}
    {error && <p className="form-error" role="alert">{error}</p>}
  </Modal>
}

export function HelpDialog({ onClose }: { onClose: () => void }) {
  return <Modal title="Horizons" description="Plan across days, weeks, months, years, and life." onClose={onClose}><div className="help-copy"><p>Create goals with Add… and drag them between calendar periods or into a new position. Click a goal title to edit, duplicate, or delete it.</p><p>Click a column heading for a dedicated view. The bottom arrows move the calendar; collapsed rails restore hidden columns.</p><dl><div><dt>F / ⌘K / Ctrl+K</dt><dd>Search all goals</dd></div><div><dt>Alt / Option + click</dt><dd>Edit a goal title</dd></div><div><dt>Enter / Esc</dt><dd>Save / cancel inline editing</dd></div></dl><p>Incomplete goals stay on their assigned dates. Deleted goals can be restored from Settings.</p></div><Button onClick={onClose}>Got it</Button></Modal>
}
