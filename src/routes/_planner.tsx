import { Outlet, createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { getWorkspace, getProgress } from '../lib/functions'
import { searchSchema, defaultSearch } from '../lib/model'
import { SidebarProvider } from '../components/ui/sidebar'

export const Route = createFileRoute('/_planner')({
  ssr: true,
  validateSearch: searchSchema,
  search: { middlewares: [stripSearchParams(defaultSearch)] },
  loader: async () => {
    const workspace = await getWorkspace()
    return { workspace, progress: getProgress() }
  },
  component: PlannerLayout,
})

function PlannerLayout() {
  return <SidebarProvider className="planner-shell"><Outlet /></SidebarProvider>
}
