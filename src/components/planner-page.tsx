import { getRouteApi } from '@tanstack/react-router'
import { Planner } from './planner'
import type { PlannerView } from '../lib/model'

const plannerRoute = getRouteApi('/_planner')
export function PlannerPage({ view }: { view: PlannerView }) {
  const { workspace, progress } = plannerRoute.useLoaderData()
  return <Planner key={workspace.user?.email || 'guest'} initial={workspace} progress={progress} search={plannerRoute.useSearch()} view={view} />
}
