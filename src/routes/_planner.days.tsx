import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/_planner/days')({ ssr: true, staticData: { plannerView: 'days' }, component: () => null })
