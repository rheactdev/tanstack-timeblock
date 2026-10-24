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
export const uploadProfilePicture = createServerFn({ method: 'POST' })
  .validator((data: FormData) => {
    if (!(data instanceof FormData)) throw new Error('Expected an image upload.')
    return data
  })
  .handler(async ({ data }) => {
    const { saveProfilePicture } = await import('../server/profile-picture.server')
    return saveProfilePicture(data)
  })
export const changeWorkspace = createServerFn({ method: 'POST' })
  .validator(mutationSchema)
  .handler(async ({ data }) => {
    const { mutateWorkspace } = await import('../server/workspace.server')
    return mutateWorkspace(data)
  })
