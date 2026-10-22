import { createServerFn } from '@tanstack/react-start'
import { mutationSchema } from './model'

export const getWorkspace = createServerFn({ method: 'GET' }).handler(async () => {
  const { loadWorkspace } = await import('../server/workspace.server')
  return loadWorkspace()
})
export const changeWorkspace = createServerFn({ method: 'POST' })
  .validator(mutationSchema)
  .handler(async ({ data }) => {
    const { mutateWorkspace } = await import('../server/workspace.server')
    return mutateWorkspace(data)
  })
export const getProgress = createServerFn({ method: 'GET' }).handler(async () => {
  const { loadProgress } = await import('../server/workspace.server')
  return loadProgress()
})
