import { createStartHandler, defaultStreamHandler } from '@tanstack/react-start/server'
import { createServerEntry } from '@tanstack/react-start/server-entry'

// Fetch-style entry stays portable. Nitro supplies the Node deployment adapter.
export default createServerEntry({ fetch: createStartHandler(defaultStreamHandler) })
