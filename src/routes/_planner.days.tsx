import { createFileRoute } from '@tanstack/react-router'
import { PlannerPage } from '../components/planner-page'
export const Route = createFileRoute('/_planner/days')({ ssr: true, component: () => <PlannerPage view="days" /> })
