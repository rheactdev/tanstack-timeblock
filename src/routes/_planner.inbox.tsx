import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/_planner/inbox')({ ssr: true, staticData: { plannerView: 'inbox' }, component: () => null })
