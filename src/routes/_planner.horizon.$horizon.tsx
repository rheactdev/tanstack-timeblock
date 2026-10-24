import { createFileRoute, notFound } from '@tanstack/react-router'
import { z } from 'zod'
import { horizons } from '../lib/model'

export const Route = createFileRoute('/_planner/horizon/$horizon')({
  ssr: true,
  params: {
    parse: params => {
      const horizon = z.enum(horizons).safeParse(params.horizon)
      if (!horizon.success) throw notFound()
      return { horizon: horizon.data }
    },
    stringify: params => ({ horizon: params.horizon }),
  },
  staticData: { plannerView: 'horizons' },
  head: ({ params }) => ({
    meta: [{ title: `${params.horizon.charAt(0).toUpperCase() + params.horizon.slice(1)} · Timestripe` }],
  }),
  component: () => null,
})
