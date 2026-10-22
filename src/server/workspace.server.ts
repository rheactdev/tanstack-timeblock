import '@tanstack/react-start/server-only'
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import { getCookie, setCookie, getRequestHeaders, getRequest } from '@tanstack/react-start/server'
import { getAuth, authSecret } from './auth.server'
import { readDocument, saveDocument, ConflictError, isLocalStorage, type Document } from './store.server'
import { seedWorkspace, type Workspace, type WorkspaceData, type Mutation } from '../lib/model'
import { todayInZone, timezone } from '../lib/calendar'
import { applyMutation, migrateWorkspace } from '../lib/workspace'

type WorkspaceDocument = Document & { workspace: Workspace }
function sign(id: string) { return createHmac('sha256', authSecret()).update(id).digest('hex') }
const identities = new WeakMap<Request, ReturnType<typeof resolveIdentity>>()
export function identity() {
  const request = getRequest()
  let result = identities.get(request)
  if (!result) { result = resolveIdentity(); identities.set(request, result) }
  return result
}
async function resolveIdentity() {
  const session = await getAuth().api.getSession({ headers: getRequestHeaders() })
  if (session) return { owner: `user:${session.user.id}`, user: { name: session.user.name, email: session.user.email } }
  const cookie = getCookie('timestripe-visitor')
  let id: string | undefined
  if (cookie) {
    const [candidate, signature] = cookie.split('.')
    const expected = sign(candidate)
    if (signature?.length === expected.length && timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) id = candidate
  }
  if (!id) {
    id = randomUUID()
    setCookie('timestripe-visitor', `${id}.${sign(id)}`, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' && process.env.BETTER_AUTH_URL?.startsWith('https://'), path: '/', maxAge: 60 * 60 * 24 * 365 })
  }
  return { owner: `visitor:${id}`, user: null }
}

async function workspaceDocument(owner: string): Promise<WorkspaceDocument> {
  const _id = `workspace:${owner}`
  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = await readDocument<WorkspaceDocument>(_id)
    if (existing?.workspace.schemaVersion === 2) return existing
    const migrationDate = todayInZone()
    try {
      if (!existing) return await saveDocument({ _id, kind: 'workspace', workspace: seedWorkspace() })
      return await saveDocument({ ...existing, legacyWorkspace: existing.workspace, migration: { at: new Date().toISOString(), calendarDate: migrationDate }, workspace: migrateWorkspace(existing.workspace, migrationDate) })
    } catch (error) { if (!(error instanceof ConflictError)) throw error }
  }
  throw new Error('Your workspace is busy. Please reload in a moment.')
}

export async function loadWorkspace(): Promise<WorkspaceData> {
  const { owner, user } = await identity()
  const doc = await workspaceDocument(owner)
  return { ...doc.workspace, user, storage: isLocalStorage() ? 'local' : 'couchdb', today: todayInZone(), now: new Date().toISOString(), timezone }
}

export async function mutateWorkspace(mutation: Mutation): Promise<Workspace> {
  const { owner } = await identity()
  for (let attempt = 0; attempt < 5; attempt++) {
    const doc = await workspaceDocument(owner)
    const workspace = applyMutation(doc.workspace, mutation, new Date().toISOString(), randomUUID)
    try { return (await saveDocument({ ...doc, workspace })).workspace }
    catch (error) { if (!(error instanceof ConflictError)) throw error }
  }
  throw new Error('Your workspace changed in another tab. Please try again.')
}

export async function loadProgress() {
  const { owner } = await identity()
  const { workspace } = await workspaceDocument(owner)
  const active = workspace.tasks.filter(task => !task.deletedAt)
  return { completed: active.filter(task => task.completed).length, total: active.length }
}
