import { getRouteApi, useMatch, useMatches } from '@tanstack/react-router'
import { Planner } from './planner'
import type { PlannerView } from '../lib/model'

const plannerRoute = getRouteApi('/_planner')
declare module '@tanstack/react-router' {
  interface StaticDataRouteOption {
    plannerView?: PlannerView
  }
}

export function PlannerPage() {
  const { workspace } = plannerRoute.useLoaderData()
  const horizon = useMatch({ from: '/_planner/horizon/$horizon', shouldThrow: false, select: match => match.params.horizon })
  const view = useMatches({ select: matches => matches.reduce<PlannerView>((current, match) => match.staticData?.plannerView ?? current, 'horizons') })
  return <Planner key={workspace.user?.email || 'guest'} initial={workspace} search={plannerRoute.useSearch()} view={view} focusedHorizon={horizon} />
}
