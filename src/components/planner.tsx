import { useEffect, useRef, useState } from 'react'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { ArrowLeft, Columns3, ListFilter, Search, Settings2, UserRound, X } from 'lucide-react'
import { formatDate, periodColumns, periodStart, samePeriod, scheduleKey, sortedTasks, todayInZone } from '../lib/calendar'
import type { Horizon, PlannerSearch, PlannerView, Schedule, Task, WorkspaceData } from '../lib/model'
import { filterTasks } from '../lib/model'
import { useWorkspace } from './use-workspace'
import { Button } from './ui/button'
import { toast } from './ui/toast'
import { IconButton } from './planner-controls'
import { SidebarInset, SidebarToggle } from './ui/sidebar'
import { WorkspaceSidebar } from './workspace-sidebar'
import { HorizonColumn } from './horizon-column'
import { GoalEditor, PositionDialog } from './goal-editor'
import { CursorPicker, horizonLabels, RescheduleDialog } from './schedule-picker'
import { AccountDialog, AppearanceDialog, DeletedDialog, FilterDialog, HelpDialog, SearchDialog, SettingsDialog } from './workspace-dialogs'

type Dialog = 'account' | 'appearance' | 'deleted' | 'filters' | 'help' | 'search' | 'settings' | null
const viewPaths = { horizons: '/horizons', inbox: '/inbox', days: '/days', weeks: '/weeks', months: '/months', years: '/years' } as const
type NavigationView = keyof typeof viewPaths
const viewLabels: Record<PlannerView, string> = { horizons: 'Horizons', inbox: 'Inbox', days: 'Days', weeks: 'Weeks', months: 'Months', years: 'Years' }
const focusViews: Partial<Record<Horizon, NavigationView>> = { inbox: 'inbox', day: 'days', week: 'weeks', month: 'months', year: 'years', life: 'horizons' }

export function Planner({ initial, progress, search, view }: { initial: WorkspaceData; progress: Promise<{ completed: number; total: number }>; search: PlannerSearch; view: PlannerView }) {
  const { data, saving, mutate } = useWorkspace(initial)
  const [dialog, setDialog] = useState<Dialog>(null)
  const [reschedule, setReschedule] = useState<Task | null>(null)
  const [position, setPosition] = useState<Task | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const [today, setToday] = useState(data.today)
  const scroll = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const router = useRouter()
  const cursor = search.date || today
  const visibleTasks = filterTasks(data.tasks, search)
  const combined = view === 'horizons'
  const allColumns = periodColumns(view, cursor)
  const expanded = allColumns.filter(schedule => !combined || !data.preferences.collapsed.includes(schedule.horizon))
  const collapsed = combined ? allColumns.filter(schedule => data.preferences.collapsed.includes(schedule.horizon)) : []
  const selected = data.tasks.find(task => task.id === search.goal && !task.deletedAt)
  const filtered = Boolean(search.q || !search.completed || search.color !== 'all')

  useEffect(() => {
    const updateToday = () => setToday(todayInZone())
    const timer = setInterval(updateToday, 30000)
    const keyboard = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      const editing = target.closest('input, textarea, select, [contenteditable="true"], [role="textbox"], [role="combobox"]')
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setDialog('search') }
      else if (!editing && !event.ctrlKey && !event.metaKey && !event.altKey && event.key.toLowerCase() === 'f') { event.preventDefault(); setDialog('search') }
    }
    window.addEventListener('keydown', keyboard)
    window.addEventListener('focus', updateToday)
    return () => { clearInterval(timer); window.removeEventListener('keydown', keyboard); window.removeEventListener('focus', updateToday) }
  }, [])
  useEffect(() => {
    if (!scroll.current) return
    if (combined) { scroll.current.scrollTo({ left: 0 }); return }
    const activeHorizon = view === 'days' ? 'day' : view === 'weeks' ? 'week' : view === 'months' ? 'month' : view === 'years' ? 'year' : 'inbox'
    const active = { horizon: activeHorizon as Horizon, date: periodStart(cursor, activeHorizon) }
    const columns = periodColumns(view, cursor)
    const index = columns.findIndex(schedule => samePeriod(schedule, active))
    const element = scroll.current.querySelectorAll<HTMLElement>('.horizon-column')[index]
    if (element) scroll.current.scrollTo({ left: element.offsetLeft - scroll.current.offsetLeft })
  }, [view, cursor])

  function updateSearch(patch: Partial<PlannerSearch>, replace = false) {
    const next = { ...search, ...patch }
    void navigate({ to: viewPaths[view], search: next, replace })
  }
  function go(target: NavigationView, patch: Partial<PlannerSearch> = {}) {
    void navigate({ to: viewPaths[target], search: { ...search, goal: undefined, board: 'all', ...patch } })
  }
  function focus(schedule: Schedule) {
    go(focusViews[schedule.horizon] || 'horizons', { date: schedule.date || search.date })
    if (schedule.horizon === 'life' && data.preferences.collapsed.includes('life')) collapse('life')
  }
  function collapse(horizon: Horizon) {
    const current = data.preferences.collapsed
    void mutate({ action: 'preferences', patch: { collapsed: current.includes(horizon) ? current.filter(value => value !== horizon) : [...current, horizon] } })
  }
  function openGoal(id: string) { updateSearch({ goal: id }) }
  function closeGoal() { updateSearch({ goal: undefined }, true) }
  async function removeGoal(task: Task) {
    const result = await mutate({ action: 'delete', id: task.id })
    if (!result) return
    if (search.goal === task.id) closeGoal()
    toast({ title: 'Goal deleted', duration: 8000, action: { label: 'Undo', onClick: () => { void mutate({ action: 'restore', id: task.id }) } } })
  }
  const cursorLabel = formatDate(cursor, { month: 'short', day: 'numeric', year: 'numeric' })

  return <>
    <WorkspaceSidebar user={data.user} view={view} saving={saving} progress={progress} completed={data.tasks.filter(task => task.completed && !task.deletedAt).length} total={data.tasks.filter(task => !task.deletedAt).length} onNavigate={go} onLife={() => { go('horizons'); if (data.preferences.collapsed.includes('life')) collapse('life'); scroll.current?.scrollTo({ left: scroll.current.scrollWidth, behavior: 'smooth' }) }} onDialog={setDialog} />
    <SidebarInset className={`planner-app scene-${data.preferences.scene}`}>
    <main className={`planner-main ${combined ? 'combined-horizons' : 'period-view'}`}>
      <header className="planner-topbar">
        <SidebarToggle aria-label="Toggle workspace navigation" />
        {!combined && <button type="button" className="planner-back-link" aria-label="Back to Horizons" onClick={() => go('horizons')}><ArrowLeft size={15} /><span>Horizons</span></button>}
        <span className="planner-view-name">{viewLabels[view]}</span>
        <div className="planner-topbar-actions">
          {!combined && <><CursorPicker cursor={cursor} today={today} label={cursorLabel} onSelect={date => updateSearch({ date })} /><button type="button" className="return-today" onClick={() => updateSearch({ date: undefined })}>Today</button></>}
          <IconButton label="Filters" onClick={() => setDialog('filters')}><ListFilter size={18} /></IconButton>
        </div>
      </header>
      {filtered && <div className="active-filters-bar"><ListFilter size={13} /><span>{search.q ? `“${search.q}” · ` : ''}{visibleTasks.length} matching goals</span><button onClick={() => updateSearch({ q: '', color: 'all', completed: true, board: 'all' })}>Clear filters<X size={12} /></button></div>}
      <div className="horizons-layout"><div ref={scroll} className={`horizon-columns ${expanded.length === 0 ? 'all-collapsed' : ''}`}>
        {expanded.map(schedule => <HorizonColumn key={scheduleKey(schedule)} schedule={schedule} tasks={sortedTasks(visibleTasks.filter(task => samePeriod(task, schedule)), data.preferences.sorts[scheduleKey(schedule)])} today={today} mutate={mutate} collapsible={combined} onCollapse={collapse} onFocus={focus} dragging={dragging} setDragging={setDragging} onOpen={openGoal} onSchedule={setReschedule} onPosition={setPosition} onDelete={task => void removeGoal(task)} expandedCount={expanded.length} dedicated={!combined} />)}
        {expanded.length === 0 && <div className="collapsed-empty"><Columns3 size={26} /><p>Expand a horizon to see your goals.</p><Button variant="outline" size="sm" onClick={() => void mutate({ action: 'preferences', patch: { collapsed: [] } })}>Expand all</Button></div>}
      </div>{collapsed.length > 0 && <div className="collapsed-horizons" aria-label="Collapsed horizons">{collapsed.map(schedule => <button key={schedule.horizon} className={`collapsed-horizon collapsed-${schedule.horizon}`} onClick={() => collapse(schedule.horizon)} aria-label={`Expand ${horizonLabels[schedule.horizon]}`}><span>{horizonLabels[schedule.horizon]}</span></button>)}</div>}</div>
    </main>
    <aside className="scenery-strip" aria-label="Workspace controls"><div className="scenery-image" /><div className="scenery-tint" /><div className="floating-tools"><IconButton label="Change background" className="scene-swatch" onClick={() => setDialog('appearance')}><span /></IconButton><IconButton label="Account" onClick={() => setDialog('account')}><UserRound size={22} /></IconButton><IconButton label="Filters" className={filtered ? 'filter-active' : ''} onClick={() => setDialog('filters')}><ListFilter size={22} /></IconButton><CursorPicker cursor={cursor} today={today} onSelect={date => updateSearch({ date })} label="Jump to a date" /><IconButton label="Search" onClick={() => setDialog('search')}><Search size={22} /></IconButton><IconButton label="Settings" onClick={() => setDialog('settings')}><Settings2 size={22} /></IconButton></div></aside>

    {selected && <GoalEditor key={selected.id} task={selected} today={today} mutate={mutate} onClose={closeGoal} onDelete={task => void removeGoal(task)} />}
    {search.goal && !selected && <div className="missing-goal-notice" role="status">This goal is unavailable.<button onClick={closeGoal}>Dismiss</button></div>}
    {reschedule && <RescheduleDialog id={reschedule.id} title={reschedule.title} schedule={{ horizon: reschedule.horizon, date: reschedule.date }} today={today} mutate={mutate} onClose={() => setReschedule(null)} />}
    {position && <PositionDialog task={position} tasks={data.tasks} mutate={mutate} onClose={() => setPosition(null)} />}
    {dialog === 'search' && <SearchDialog data={{ ...data, today }} query={search.q} onOpen={openGoal} onFilter={q => updateSearch({ q })} onClose={() => setDialog(null)} />}
    {dialog === 'filters' && <FilterDialog search={search} onChange={updateSearch} onClose={() => setDialog(null)} />}
    {dialog === 'deleted' && <DeletedDialog data={{ ...data, today }} mutate={mutate} onClose={() => setDialog(null)} />}
    {dialog === 'settings' && <SettingsDialog data={data} onClose={() => setDialog(null)} onAccount={() => setDialog('account')} onDeleted={() => setDialog('deleted')} onAppearance={() => setDialog('appearance')} />}
    {dialog === 'appearance' && <AppearanceDialog data={data} mutate={mutate} onClose={() => setDialog(null)} />}
    {dialog === 'account' && <AccountDialog user={data.user} pendingSaves={saving} onClose={() => setDialog(null)} onChanged={async () => { await router.invalidate(); setDialog(null); go('horizons', { date: undefined, q: '', completed: true, color: 'all', goal: undefined }) }} />}
    {dialog === 'help' && <HelpDialog onClose={() => setDialog(null)} />}
    </SidebarInset>
  </>
}
