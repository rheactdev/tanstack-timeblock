import { createFileRoute } from '@tanstack/react-router'
import { PlannerPage } from '../components/planner-page'
export const Route = createFileRoute('/_planner/months')({ ssr: true, component: () => <PlannerPage view="months" /> })
