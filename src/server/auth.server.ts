import '@tanstack/react-start/server-only'
import { randomBytes } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { betterAuth } from 'better-auth'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { couchDBAdapter } from './auth-adapter.server'

let developmentSecret: string | undefined
let instance: ReturnType<typeof createAuth> | undefined
export function authSecret() {
  if (process.env.BETTER_AUTH_SECRET) return process.env.BETTER_AUTH_SECRET
  if (process.env.NODE_ENV === 'production' && process.env.TIMESTRIPE_LOCAL_DEMO !== 'true') throw new Error('BETTER_AUTH_SECRET is required in production.')
  if (!developmentSecret) {
    const directory = resolve(process.env.TIMESTRIPE_DATA_DIR || '.data')
    const secretPath = resolve(directory, 'auth-secret')
    mkdirSync(directory, { recursive: true })
    try { developmentSecret = readFileSync(secretPath, 'utf8') }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
      const generated = randomBytes(32).toString('hex')
      try { writeFileSync(secretPath, generated, { mode: 0o600, flag: 'wx' }) }
      catch (writeError) { if ((writeError as NodeJS.ErrnoException).code !== 'EEXIST') throw writeError }
      developmentSecret = readFileSync(secretPath, 'utf8')
    }
  }
  return developmentSecret
}
function createAuth() {
  return betterAuth({
    appName: 'Timestripe',
    baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
    secret: authSecret(),
    database: couchDBAdapter(),
    emailAndPassword: { enabled: true, minPasswordLength: 8 },
    advanced: { database: { generateId: () => crypto.randomUUID() } },
    plugins: [tanstackStartCookies()],
  })
}
export function getAuth() { return instance ??= createAuth() }
