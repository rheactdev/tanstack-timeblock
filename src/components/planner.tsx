import { useEffect, useRef, useState } from 'react'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, Columns3, ListFilter, PanelLeft, Search, Settings2, X } from 'lucide-react'
import { formatDate, periodColumns, periodStart, samePeriod, scheduleKey, shiftDate, sortedTasks, todayInZone } from '../lib/calendar'
import type { DatedHorizon, Horizon, PlannerSearch, PlannerView, Schedule, Task, WorkspaceData } from '../lib/model'
import { filterTasks } from '../lib/model'
import { useWorkspace } from './use-workspace'
import { Button } from './ui/button'
import { toast } from './ui/toast'
import { SidebarInset, useSidebar } from './ui/sidebar'
import { WorkspaceSidebar } from './workspace-sidebar'
import { HorizonColumn } from './horizon-column'
import { GoalEditor } from './goal-editor'
import { CursorPicker, horizonLabels } from './schedule-picker'
import { AccountDialog, AppearanceDialog, DeletedDialog, FilterDialog, HelpDialog, SearchDialog, SettingsDialog } from './workspace-dialogs'

type Dialog = 'account' | 'appearance' | 'deleted' | 'filters' | 'help' | 'search' | 'settings' | null
const viewPaths = { horizons: '/horizons', inbox: '/inbox', days: '/days', weeks: '/weeks', months: '/months', years: '/years' } as const
type NavigationView = keyof typeof viewPaths
const viewLabels: Record<PlannerView, string> = { horizons: 'Horizons', inbox: 'Inbox', days: 'Days', weeks: 'Weeks', months: 'Months', years: 'Years' }
const focusViews: Partial<Record<Horizon, NavigationView>> = { inbox: 'inbox', day: 'days', week: 'weeks', month: 'months', year: 'years', life: 'horizons' }
const navigationHorizons: Partial<Record<PlannerView, DatedHorizon>> = { days: 'day', weeks: 'week', months: 'month', years: 'year' }

export function Planner({ initial, search, view }: { initial: WorkspaceData; search: PlannerSearch; view: PlannerView }) {
  const { toggleSidebar, open, openMobile, isMobile } = useSidebar()
  const { data, saving, mutate } = useWorkspace(initial)
  const [dialog, setDialog] = useState<Dialog>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const [today, setToday] = useState(data.today)
  const [lifeFocusRequest, setLifeFocusRequest] = useState(0)
  const lifeFocusPending = useRef(false)
  const scroll = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const router = useRouter()
  const cursor = search.date || today
  const visibleTasks = filterTasks(data.tasks, search)
  const combined = view === 'horizons'
  const lifeCollapsed = data.preferences.collapsed.includes('life')
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
    if (lifeFocusPending.current) {
      if (combined) return
      lifeFocusPending.current = false
    }
    if (combined) { scroll.current.scrollTo({ left: 0 }); return }
    const activeHorizon = view === 'days' ? 'day' : view === 'weeks' ? 'week' : view === 'months' ? 'month' : view === 'years' ? 'year' : 'inbox'
    const active = { horizon: activeHorizon as Horizon, date: periodStart(cursor, activeHorizon) }
    const columns = periodColumns(view, cursor)
    const index = columns.findIndex(schedule => samePeriod(schedule, active))
    const element = scroll.current.querySelectorAll<HTMLElement>('.horizon-column')[index]
    if (element) scroll.current.scrollTo({ left: element.offsetLeft - scroll.current.offsetLeft })
  }, [view, cursor])
  useEffect(() => {
    if (!lifeFocusPending.current || !combined || lifeCollapsed) return
    const container = scroll.current
    const lifeColumn = container?.querySelector<HTMLElement>('.horizon-life')
    if (!container || !lifeColumn) return
    lifeFocusPending.current = false
    container.scrollTo({ left: lifeColumn.offsetLeft - container.offsetLeft, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }, [combined, lifeCollapsed, lifeFocusRequest])

  function updateSearch(patch: Partial<PlannerSearch>, replace = false) {
    const next = { ...search, ...patch }
    void navigate({ to: viewPaths[view], search: next, replace })
  }
  function go(target: NavigationView, patch: Partial<PlannerSearch> = {}) {
    void navigate({ to: viewPaths[target], search: { ...search, goal: undefined, board: 'all', ...patch } })
  }
  function focus(schedule: Schedule) {
    if (schedule.horizon === 'life') { openLife(); return }
    go(focusViews[schedule.horizon] || 'horizons', { date: schedule.date || search.date })
  }
  function openLife() {
    lifeFocusPending.current = true
    setLifeFocusRequest(request => request + 1)
    if (lifeCollapsed) void mutate({ action: 'preferences', patch: { collapsed: data.preferences.collapsed.filter(horizon => horizon !== 'life') } })
    go('horizons')
  }
  function collapse(horizon: Horizon) {
    const current = data.preferences.collapsed
    void mutate({ action: 'preferences', patch: { collapsed: current.includes(horizon) ? current.filter(value => value !== horizon) : [...current, horizon] } })
  }
  function openGoal(id: string) { updateSearch({ goal: id }) }
  function closeGoal() { updateSearch({ goal: undefined }, true) }
  async function removeGoal(task: Task) {
    const result = await mutate({ action: 'delete', id: task.id })
    if (!result) return false
    if (search.goal === task.id) closeGoal()
    toast({ title: 'Goal deleted', duration: 8000, action: { label: 'Undo', onClick: () => { void mutate({ action: 'restore', id: task.id }) } } })
    return true
  }
  const cursorLabel = formatDate(cursor, { month: 'short', day: 'numeric', year: 'numeric' })
  const navigationHorizon = navigationHorizons[view]
  const previousDate = navigationHorizon ? shiftDate(cursor, navigationHorizon, -1) : cursor
  const nextDate = navigationHorizon ? shiftDate(cursor, navigationHorizon, 1) : cursor

  return <>
    <WorkspaceSidebar user={data.user} view={view} search={search} onLife={openLife} onDialog={setDialog} />
    <SidebarInset className={`planner-app scene-${data.preferences.scene}`}>
    <main className={`planner-main ${combined ? 'combined-horizons' : 'period-view'}`}>
      <header className="planner-topbar">
        <div className="planner-topbar-content">
          <div className="planner-topbar-heading">
            <Button type="button" variant="secondary" size="icon" className="planner-sidebar-toggle" aria-label="Open workspace navigation" title="Open workspace navigation" aria-expanded={isMobile ? openMobile : open} onClick={toggleSidebar}><PanelLeft aria-hidden="true" /></Button>
            <span className="planner-view-name">{viewLabels[view]}</span>
          </div>
          <div className="planner-topbar-actions">
              <div className={`planner-calendar-navigation ${navigationHorizon ? 'planner-period-navigation' : ''}`} role="group" aria-label={navigationHorizon ? `${horizonLabels[navigationHorizon]} navigation` : 'Calendar navigation'}>
                {navigationHorizon && <Button type="button" variant="outline" size="icon" className="planner-topbar-control" aria-label={`Previous ${navigationHorizon}`} title={`Previous ${navigationHorizon}`} disabled={previousDate === cursor} onClick={() => updateSearch({ date: previousDate })}><ChevronLeft aria-hidden="true" /></Button>}
                <CursorPicker cursor={cursor} today={today} label={cursorLabel} onSelect={date => updateSearch({ date })} />
                {navigationHorizon && <Button type="button" variant="outline" size="icon" className="planner-topbar-control" aria-label={`Next ${navigationHorizon}`} title={`Next ${navigationHorizon}`} disabled={nextDate === cursor} onClick={() => updateSearch({ date: nextDate })}><ChevronRight aria-hidden="true" /></Button>}
              </div>
              {cursor !== today && <Button type="button" variant="outline" size="sm" className="return-today" onClick={() => updateSearch({ date: undefined })}>Today</Button>}
            <Button type="button" variant="outline" className="planner-topbar-search" aria-label="Search goals (Command or Control + K)" aria-haspopup="dialog" onClick={() => setDialog('search')}><Search aria-hidden="true" /><span>Search...</span><kbd aria-hidden="true"><span>⌘</span>K</kbd></Button>
            <Button type="button" variant="outline" size="icon" className="planner-topbar-control" aria-label="Filters" aria-haspopup="dialog" title="Filters" data-active={filtered || undefined} onClick={() => setDialog('filters')}><ListFilter aria-hidden="true" /></Button>
            <Button type="button" variant="outline" size="icon" className="planner-topbar-control" aria-label="Settings" aria-haspopup="dialog" title="Settings" onClick={() => setDialog('settings')}><Settings2 aria-hidden="true" /></Button>
          </div>
        </div>
      </header>
      {filtered && <div className="active-filters-bar"><ListFilter size={13} /><span>{search.q ? `“${search.q}” · ` : ''}{visibleTasks.length} matching goals</span><button onClick={() => updateSearch({ q: '', color: 'all', completed: true, board: 'all' })}>Clear filters<X size={12} /></button></div>}
      <div className="horizons-layout"><div ref={scroll} className={`horizon-columns ${expanded.length === 0 ? 'all-collapsed' : ''}`}>
        {expanded.map(schedule => <HorizonColumn key={scheduleKey(schedule)} schedule={schedule} tasks={sortedTasks(visibleTasks.filter(task => samePeriod(task, schedule)), data.preferences.sorts[scheduleKey(schedule)])} today={today} mutate={mutate} collapsible={combined} onCollapse={collapse} onFocus={focus} dragging={dragging} setDragging={setDragging} onOpen={openGoal} expandedCount={expanded.length} dedicated={!combined} />)}
        {expanded.length === 0 && <div className="collapsed-empty"><Columns3 size={26} /><p>Expand a horizon to see your goals.</p><Button variant="outline" size="sm" onClick={() => void mutate({ action: 'preferences', patch: { collapsed: [] } })}>Expand all</Button></div>}
      </div>{collapsed.length > 0 && <div className="collapsed-horizons" aria-label="Collapsed horizons">{collapsed.map(schedule => <button key={schedule.horizon} className={`collapsed-horizon collapsed-${schedule.horizon}`} onClick={() => collapse(schedule.horizon)} aria-label={`Expand ${horizonLabels[schedule.horizon]}`}><span>{horizonLabels[schedule.horizon]}</span></button>)}</div>}</div>
    </main>
    <aside className="scenery-strip grid-pattern" aria-hidden="true" />

    {selected && <GoalEditor key={selected.id} task={selected} mutate={mutate} onClose={closeGoal} onDelete={removeGoal} />}
    {search.goal && !selected && <div className="missing-goal-notice" role="status">This goal is unavailable.<button onClick={closeGoal}>Dismiss</button></div>}
    {dialog === 'search' && <SearchDialog data={{ ...data, today }} query={search.q} onOpen={openGoal} onFilter={q => updateSearch({ q })} onClose={() => setDialog(null)} />}
    {dialog === 'filters' && <FilterDialog search={search} onChange={updateSearch} onClose={() => setDialog(null)} />}
    {dialog === 'deleted' && <DeletedDialog data={{ ...data, today }} mutate={mutate} onClose={() => setDialog(null)} />}
    {dialog === 'settings' && <SettingsDialog data={data} onClose={() => setDialog(null)} onAccount={() => setDialog('account')} onDeleted={() => setDialog('deleted')} onAppearance={() => setDialog('appearance')} />}
    {dialog === 'appearance' && <AppearanceDialog data={data} mutate={mutate} onClose={() => setDialog(null)} />}
    {dialog === 'account' && <AccountDialog user={data.user} pendingSaves={saving} onClose={() => setDialog(null)} onProfileChanged={async () => { await router.invalidate() }} onChanged={async () => { await router.invalidate(); setDialog(null); go('horizons', { date: undefined, q: '', completed: true, color: 'all', goal: undefined }) }} />}
    {dialog === 'help' && <HelpDialog onClose={() => setDialog(null)} />}
    </SidebarInset>
  </>
}
