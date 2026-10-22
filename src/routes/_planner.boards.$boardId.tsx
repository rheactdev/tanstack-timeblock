import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_planner/boards/$boardId')({
  ssr: true,
  beforeLoad: ({ search }) => { throw redirect({ to: '/horizons', search: { ...search, board: 'all' }, replace: true }) },
})
