// Standalone container bootstrap; uses only Node's built-in APIs.
// Unlike the development initializer, it does not load a local .env file.
if (!process.env.COUCHDB_URL) throw new Error('COUCHDB_URL is required to initialize CouchDB.')

const url = new URL(process.env.COUCHDB_URL)
const username = process.env.COUCHDB_USER || decodeURIComponent(url.username)
const password = process.env.COUCHDB_PASSWORD || decodeURIComponent(url.password)
url.username = ''
url.password = ''

const database = process.env.COUCHDB_DATABASE || 'timestripe'
const base = `${url.toString().replace(/\/$/, '')}/${encodeURIComponent(database)}`
const headers = { 'Content-Type': 'application/json' }
if (username) headers.Authorization = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`

function request(path, init) {
  return fetch(`${base}${path}`, { ...init, headers, signal: AbortSignal.timeout(12000) })
}

const databaseResponse = await request('', { method: 'PUT' })
if (!databaseResponse.ok && databaseResponse.status !== 412) {
  throw new Error(`Could not create CouchDB database (${databaseResponse.status}).`)
}

const indexResponse = await request('/_index', {
  method: 'POST',
  body: JSON.stringify({ index: { fields: ['kind'] }, name: 'by-kind', type: 'json' }),
})
if (!indexResponse.ok) throw new Error(`Could not create CouchDB index (${indexResponse.status}).`)

console.log('Timestripe CouchDB database and indexes are ready.')
