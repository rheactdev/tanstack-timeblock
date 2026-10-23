import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/_planner/years')({ ssr: true, staticData: { plannerView: 'years' }, component: () => null })
