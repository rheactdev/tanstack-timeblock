import { Suspense } from 'react'
import { Await } from '@tanstack/react-router'
import { Calendar, CalendarDays, CalendarRange, Check, CircleHelp, Columns3, Flag, Inbox, ListFilter, LoaderCircle, Mountain, Search, Settings2, Trash2 } from 'lucide-react'
import type { PlannerView, WorkspaceData } from '../lib/model'
import { WorkspacePopover } from './workspace-popover'
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarItem, SidebarSeparator, SidebarToggle, useSidebar } from './ui/sidebar'

type WorkspaceDialog = 'account' | 'appearance' | 'deleted' | 'filters' | 'help' | 'search' | 'settings'
const planningViews = [
  { view: 'horizons', label: 'Horizons', icon: Columns3 },
  { view: 'inbox', label: 'Inbox', icon: Inbox },
  { view: 'days', label: 'Days', icon: CalendarDays },
  { view: 'weeks', label: 'Weeks', icon: CalendarRange },
  { view: 'months', label: 'Months', icon: Calendar },
  { view: 'years', label: 'Years', icon: Flag },
] as const

export function WorkspaceSidebar({ user, view, saving, progress, completed, total, onNavigate, onLife, onDialog }: {
  user: WorkspaceData['user']
  view: PlannerView
  saving: boolean
  progress: Promise<{ completed: number; total: number }>
  completed: number
  total: number
  onNavigate: (view: PlannerView) => void
  onLife: () => void
  onDialog: (dialog: WorkspaceDialog) => void
}) {
  const { state, isMobile, setOpenMobile } = useSidebar()
  const expanded = isMobile || state === 'expanded'

  function act(action: () => void) { setOpenMobile(false); action() }
  function showDialog(dialog: WorkspaceDialog) { act(() => onDialog(dialog)) }

  return <Sidebar collapsible="icon" className="min-h-0" role="navigation" aria-label="Workspace tools">
    <SidebarHeader className="min-h-[68px] shrink-0 gap-3 px-3">
      {expanded && <span className="min-w-0 flex-1 truncate text-sm font-bold uppercase tracking-wide">Horizons</span>}
      {!isMobile && <SidebarToggle aria-label={expanded ? 'Collapse workspace sidebar' : 'Expand workspace sidebar'} aria-expanded={expanded} />}
    </SidebarHeader>
    <SidebarContent className="flex min-h-0 flex-col gap-5 px-2 py-4">
      <SidebarGroup>
        <WorkspacePopover user={user} onAccount={() => showDialog('account')} onSettings={() => showDialog('settings')} onAppearance={() => showDialog('appearance')} onDeleted={() => showDialog('deleted')} />
      </SidebarGroup>
      <SidebarSeparator className="mx-0 shrink-0" />
      <SidebarGroup>
        <SidebarGroupLabel>Plan</SidebarGroupLabel>
        {planningViews.map(({ view: target, label, icon: Icon }) => <SidebarItem key={target} type="button" icon={<Icon size={22} />} tooltip={label} aria-label={label} variant={view === target ? 'active' : 'default'} className={view === target ? 'text-accent-foreground' : undefined} aria-current={view === target ? 'page' : undefined} onClick={() => act(() => onNavigate(target))}>{label}</SidebarItem>)}
        <SidebarItem type="button" icon={<Mountain size={22} />} tooltip="Life goals" aria-label="Life goals" onClick={() => act(onLife)}>Life goals</SidebarItem>
      </SidebarGroup>
    </SidebarContent>
    <SidebarFooter className="shrink-0 flex-col items-stretch gap-1 px-2 py-3">
      <SidebarItem type="button" icon={<Search size={22} />} tooltip="Search (F)" aria-label="Search (F)" onClick={() => showDialog('search')}>Search</SidebarItem>
      <SidebarItem type="button" icon={<ListFilter size={22} />} tooltip="Filters" aria-label="Filters" onClick={() => showDialog('filters')}>Filters</SidebarItem>
      <SidebarItem type="button" icon={<Trash2 size={22} />} tooltip="Deleted goals" aria-label="Deleted goals" onClick={() => showDialog('deleted')}>Deleted goals</SidebarItem>
      <SidebarItem type="button" icon={<CircleHelp size={22} />} tooltip="Help" aria-label="Help" onClick={() => showDialog('help')}>Help</SidebarItem>
      <SidebarItem type="button" icon={<Settings2 size={22} />} tooltip="Settings" aria-label="Settings" onClick={() => showDialog('settings')}>Settings</SidebarItem>
      <div className={`workspace-sync ${expanded ? '' : 'workspace-sync-collapsed'}`} role="status" aria-label={saving ? 'Saving changes' : 'All changes saved'}>{saving ? <LoaderCircle size={14} className="spin" /> : <Check size={14} />}{expanded && <span>{saving ? 'Saving...' : 'All changes saved'}</span>}</div>
      <Suspense fallback={<span className={expanded ? 'workspace-stats' : 'sr-only'}>Loading progress...</span>}><Await promise={progress}>{() => <span className={expanded ? 'workspace-stats' : 'sr-only'}>{completed} completed · {total} goals</span>}</Await></Suspense>
    </SidebarFooter>
  </Sidebar>
}
