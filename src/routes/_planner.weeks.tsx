import { createFileRoute } from '@tanstack/react-router'
import { PlannerPage } from '../components/planner-page'
export const Route = createFileRoute('/_planner/weeks')({ ssr: true, component: () => <PlannerPage view="weeks" /> })
