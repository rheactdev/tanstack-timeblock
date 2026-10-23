import { Outlet, createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { getSidebarOpen, getWorkspace } from '../lib/functions'
import { searchSchema, defaultSearch } from '../lib/model'
import { SidebarProvider } from '../components/ui/sidebar'
import { PlannerPage } from '../components/planner-page'

export const Route = createFileRoute('/_planner')({
  ssr: true,
  validateSearch: searchSchema,
  search: { middlewares: [stripSearchParams(defaultSearch)] },
  loader: async () => {
    const [workspace, sidebarOpen] = await Promise.all([getWorkspace(), getSidebarOpen()])
    return { workspace, sidebarOpen }
  },
  component: PlannerLayout,
})

function PlannerLayout() {
  const { sidebarOpen } = Route.useLoaderData()
  return <div className="planner-layout">
    <div className="planner-accent-strip" aria-hidden="true"><span /><span /><span /><span /><span /></div>
    <SidebarProvider defaultOpen={sidebarOpen} className="planner-shell"><PlannerPage /><Outlet /></SidebarProvider>
  </div>
}
