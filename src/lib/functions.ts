import { createServerFn } from '@tanstack/react-start'
import { mutationSchema } from './model'

export const getWorkspace = createServerFn({ method: 'GET' }).handler(async () => {
  const { loadWorkspace } = await import('../server/workspace.server')
  return loadWorkspace()
})
export const getSidebarOpen = createServerFn({ method: 'GET' }).handler(async () => {
  const { loadSidebarOpen } = await import('../server/sidebar.server')
  return loadSidebarOpen()
})
export const changeWorkspace = createServerFn({ method: 'POST' })
  .validator(mutationSchema)
  .handler(async ({ data }) => {
    const { mutateWorkspace } = await import('../server/workspace.server')
    return mutateWorkspace(data)
  })
