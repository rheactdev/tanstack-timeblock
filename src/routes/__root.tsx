import { HeadContent, Outlet, Scripts, createRootRoute, Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import styles from '../styles.css?url'
import '@fontsource-variable/outfit'
import { Toaster } from '../components/ui/toast'
import { TooltipProvider } from '../components/ui/tooltip'
import { Button } from '../components/ui/button'

export const Route = createRootRoute({
  head: () => ({
    meta: [{ charSet: 'utf-8' }, { name: 'viewport', content: 'width=device-width, initial-scale=1' }, { title: 'Timestripe — Horizons' }, { name: 'description', content: 'Plan your days, weeks, months, years, and life.' }, { name: 'theme-color', content: '#17171c' }],
    links: [{ rel: 'stylesheet', href: styles }, { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
  }),
  shellComponent: Document,
  component: () => <TooltipProvider delayDuration={400}><Outlet /><Toaster position="bottom-center" /></TooltipProvider>,
  notFoundComponent: () => <div className="route-message"><h1>Page not found</h1><Link to="/horizons" search={{ q: '', completed: true, board: 'all', color: 'all' }}>Back to Horizons →</Link></div>,
  errorComponent: ({ error, reset }) => <div className="route-message"><h1>Could not load your workspace</h1><p>{error instanceof Error ? error.message : 'Please try again.'}</p><Button onClick={reset}>Try again</Button></div>,
})
function Document({ children }: { children: ReactNode }) {
  return <html lang="en" className="dark"><head><HeadContent /></head><body>{children}<Scripts /></body></html>
}
