import '@tanstack/react-start/server-only'
import { createHash, randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises'
import { resolve } from 'node:path'

export type Document = { _id: string; _rev?: string; kind: string; [key: string]: unknown }
export class ConflictError extends Error {}
export function isLocalStorage() {
  if (process.env.COUCHDB_URL) return false
  if (process.env.NODE_ENV === 'production' && process.env.TIMESTRIPE_LOCAL_DEMO !== 'true') {
    throw new Error('Configure COUCHDB_URL for production (or explicitly enable TIMESTRIPE_LOCAL_DEMO for a single-process preview).')
  }
  return true
}

function filePath(id: string) {
  return resolve(process.env.TIMESTRIPE_DATA_DIR || '.data', `${createHash('sha256').update(id).digest('hex')}.json`)
}
const localLocks = new Map<string, Promise<unknown>>()
async function serial<T>(key: string, work: () => Promise<T>): Promise<T> {
  const previous = localLocks.get(key) || Promise.resolve()
  const next = previous.catch(() => {}).then(work)
  localLocks.set(key, next)
  try { return await next } finally { if (localLocks.get(key) === next) localLocks.delete(key) }
}

function couchConfig() {
  const url = new URL(process.env.COUCHDB_URL!)
  const username = process.env.COUCHDB_USER || decodeURIComponent(url.username)
  const password = process.env.COUCHDB_PASSWORD || decodeURIComponent(url.password)
  url.username = ''; url.password = ''
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (username) headers.Authorization = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
  return { base: `${url.toString().replace(/\/$/, '')}/${encodeURIComponent(process.env.COUCHDB_DATABASE || 'timestripe')}`, headers }
}
export async function couchRequest(path: string, init: RequestInit = {}) {
  const { base, headers } = couchConfig()
  return fetch(`${base}${path}`, { ...init, headers: { ...headers, ...init.headers }, signal: AbortSignal.timeout(12000) })
}

export async function readDocument<T extends Document>(id: string): Promise<T | null> {
  if (isLocalStorage()) {
    try { return JSON.parse(await readFile(filePath(id), 'utf8')) as T }
    catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null; throw error }
  }
  const response = await couchRequest(`/${encodeURIComponent(id)}`)
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`CouchDB read failed (${response.status}).`)
  return response.json() as Promise<T>
}

export async function saveDocument<T extends Document>(document: T): Promise<T> {
  if (isLocalStorage()) return serial(document._id, async () => {
    const current = await readDocument(document._id)
    if ((current?._rev || undefined) !== document._rev) throw new ConflictError('Document changed. Please retry.')
    const next = { ...document, _rev: randomUUID() }
    const target = filePath(document._id)
    await mkdir(resolve(target, '..'), { recursive: true })
    const temporary = `${target}.${randomUUID()}.tmp`
    await writeFile(temporary, JSON.stringify(next), { mode: 0o600 })
    await rename(temporary, target)
    return next
  })
  const response = await couchRequest(`/${encodeURIComponent(document._id)}`, { method: 'PUT', body: JSON.stringify(document) })
  if (response.status === 409) throw new ConflictError('Document changed. Please retry.')
  if (!response.ok) throw new Error(`CouchDB write failed (${response.status}).`)
  const result = await response.json() as { rev: string }
  return { ...document, _rev: result.rev }
}

export async function removeDocument(document: Document): Promise<boolean> {
  if (isLocalStorage()) return serial(document._id, async () => {
    const current = await readDocument(document._id)
    if (!current || current._rev !== document._rev) return false
    const { unlink } = await import('node:fs/promises')
    await unlink(filePath(document._id))
    return true
  })
  const response = await couchRequest(`/${encodeURIComponent(document._id)}?rev=${encodeURIComponent(document._rev!)}`, { method: 'DELETE' })
  if (response.status === 409 || response.status === 404) return false
  if (!response.ok) throw new Error(`CouchDB delete failed (${response.status}).`)
  return true
}

export async function listDocuments(kind: string): Promise<Document[]> {
  if (isLocalStorage()) {
    const { readdir } = await import('node:fs/promises')
    const directory = resolve(process.env.TIMESTRIPE_DATA_DIR || '.data')
    await mkdir(directory, { recursive: true })
    const files = (await readdir(directory)).filter(name => name.endsWith('.json'))
    const documents = await Promise.all(files.map(async name => JSON.parse(await readFile(resolve(directory, name), 'utf8')) as Document))
    return documents.filter(doc => doc.kind === kind)
  }
  const documents: Document[] = []
  let bookmark: string | undefined
  for (;;) {
    const response = await couchRequest('/_find', { method: 'POST', body: JSON.stringify({ selector: { kind }, limit: 500, ...(bookmark ? { bookmark } : {}) }) })
    if (!response.ok) throw new Error(`CouchDB query failed (${response.status}).`)
    const page = await response.json() as { docs: Document[]; bookmark: string }
    documents.push(...page.docs)
    if (page.docs.length < 500 || page.bookmark === bookmark) return documents
    bookmark = page.bookmark
  }
}
