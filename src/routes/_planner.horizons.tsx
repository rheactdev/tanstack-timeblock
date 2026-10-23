import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/_planner/horizons')({ ssr: true, staticData: { plannerView: 'horizons' }, component: () => null })
