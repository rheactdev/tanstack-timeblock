import '@tanstack/react-start/server-only'
import { getCookie } from '@tanstack/react-start/server'
import { parseSidebarState, SIDEBAR_STATE_KEY } from '../lib/sidebar-state'

export function loadSidebarOpen() {
  return parseSidebarState(getCookie(SIDEBAR_STATE_KEY)) ?? true
}
