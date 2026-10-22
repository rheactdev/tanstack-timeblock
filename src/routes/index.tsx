import { createFileRoute, redirect } from '@tanstack/react-router'
import { searchSchema } from '../lib/model'

export const Route = createFileRoute('/')({
  ssr: true,
  beforeLoad: ({ location }) => {
    const raw = location.search as Record<string, unknown>
    const search = searchSchema.parse(raw)
    const legacyColors: Record<string, string> = { green: '#92ce14', purple: '#955be0', orange: '#f2713a', blue: '#278dea' }
    if (typeof raw.color === 'string' && legacyColors[raw.color]) search.color = legacyColors[raw.color] as typeof search.color
    const paths = { day: '/days', week: '/weeks', month: '/months', year: '/years', inbox: '/inbox', life: '/horizons', horizons: '/horizons' } as const
    const view = typeof raw.view === 'string' && raw.view in paths ? raw.view as keyof typeof paths : 'horizons'
    throw redirect({ to: paths[view], search, replace: true })
  },
})
