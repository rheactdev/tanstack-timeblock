import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/_planner/weeks')({ ssr: true, staticData: { plannerView: 'weeks' }, component: () => null })
