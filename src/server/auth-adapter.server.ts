import '@tanstack/react-start/server-only'
import { createHash } from 'node:crypto'
import { createAdapterFactory } from 'better-auth/adapters'
import { listDocuments, readDocument, saveDocument, removeDocument, ConflictError, type Document } from './store.server'

type Row = Record<string, unknown>
type Clause = { field: string; value: unknown; operator?: string; connector?: string; mode?: string }
export function matchesWhere(row: Row, where: Clause[] = []): boolean {
  const compare = (clause: Clause) => {
    let a = row[clause.field] ?? null
    let b = clause.value ?? null
    if (clause.mode === 'insensitive') {
      if (typeof a === 'string') a = a.toLowerCase()
      if (typeof b === 'string') b = b.toLowerCase()
      if (Array.isArray(b)) b = b.map(value => typeof value === 'string' ? value.toLowerCase() : value)
    }
    switch (clause.operator || 'eq') {
      case 'eq': return a === b
      case 'ne': return a !== b
      case 'in': return Array.isArray(b) && b.includes(a)
      case 'not_in': return Array.isArray(b) && !b.includes(a)
      case 'contains': return typeof a === 'string' && a.includes(String(b))
      case 'starts_with': return typeof a === 'string' && a.startsWith(String(b))
      case 'ends_with': return typeof a === 'string' && a.endsWith(String(b))
      case 'lt': return (a as string) < (b as string)
      case 'lte': return (a as string) <= (b as string)
      case 'gt': return (a as string) > (b as string)
      case 'gte': return (a as string) >= (b as string)
      default: throw new Error(`Unsupported auth query operator: ${clause.operator}`)
    }
  }
  // Better Auth combines its AND group with the OR group using AND.
  const and = where.filter(c => c.connector !== 'OR')
  const or = where.filter(c => c.connector === 'OR')
  return and.every(compare) && (!or.length || or.some(compare))
}

type AuthDocument = Document & { row: Row }
function clean(document: AuthDocument) { return { ...document.row } }
async function find(model: string, where?: Clause[]) {
  return (await listDocuments(`auth:${model}`) as AuthDocument[]).filter(doc => matchesWhere(doc.row, where))
}
async function updateOne(model: string, where: Clause[], patch: Row) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const found = (await find(model, where))[0]
    if (!found) return null
    try { return clean(await saveDocument({ ...found, row: { ...found.row, ...patch } })) }
    catch (error) { if (!(error instanceof ConflictError)) throw error }
  }
  throw new ConflictError('Authentication record is busy. Please retry.')
}

export const couchDBAdapter = () => createAdapterFactory({
  config: {
    adapterId: 'couchdb', adapterName: 'CouchDB HTTP adapter',
    supportsDates: false, supportsBooleans: true, supportsJSON: true,
    supportsNumericIds: false, transaction: false,
  },
  adapter: () => ({
    create: async ({ model, data }) => {
      const row = data as Row
      // Deterministic email key enforces uniqueness atomically through CouchDB's PUT semantics.
      const key = model === 'user' ? String(row.email).toLowerCase() : String(row.id)
      const _id = `auth:${model}:${createHash('sha256').update(key).digest('hex')}`
      const result = await saveDocument({ _id, kind: `auth:${model}`, row })
      return clean(result) as typeof data
    },
    findOne: async ({ model, where }) => {
      const found = (await find(model, where))[0]
      return found ? clean(found) as never : null
    },
    findMany: async ({ model, where, limit, offset, sortBy }) => {
      let rows = (await find(model, where)).map(clean)
      if (sortBy) rows.sort((a, b) => String(a[sortBy.field]).localeCompare(String(b[sortBy.field])) * (sortBy.direction === 'asc' ? 1 : -1))
      return rows.slice(offset || 0, limit === undefined ? undefined : (offset || 0) + limit) as never
    },
    count: async ({ model, where }) => (await find(model, where)).length,
    update: async ({ model, where, update }) => await updateOne(model, where, update as Row) as never,
    updateMany: async ({ model, where, update }) => {
      const documents = await find(model, where)
      let count = 0
      for (const doc of documents) {
        // Recheck all predicates against the fresh revision before each conditional write.
        const current = await readDocument<AuthDocument>(doc._id)
        if (current && matchesWhere(current.row, where)) {
          try { await saveDocument({ ...current, row: { ...current.row, ...update } }); count++ }
          catch (error) { if (!(error instanceof ConflictError)) throw error }
        }
      }
      return count
    },
    delete: async ({ model, where }) => {
      const doc = (await find(model, where))[0]
      if (doc) await removeDocument(doc)
    },
    deleteMany: async ({ model, where }) => {
      let count = 0
      for (const doc of await find(model, where)) if (await removeDocument(doc)) count++
      return count
    },
    consumeOne: async ({ model, where }) => {
      const doc = (await find(model, where))[0]
      return doc && await removeDocument(doc) ? clean(doc) as never : null
    },
  }),
})
