import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/_planner/months')({ ssr: true, staticData: { plannerView: 'months' }, component: () => null })
