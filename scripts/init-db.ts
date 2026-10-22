import { loadEnvFile } from 'node:process'
try { loadEnvFile('.env') } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error }

const url = process.env.COUCHDB_URL
if (!url) throw new Error('Set COUCHDB_URL in .env before initializing CouchDB.')
const { couchRequest } = await import('../src/server/store.server')
const response = await couchRequest('', { method: 'PUT' })
if (!response.ok && response.status !== 412) throw new Error(`Could not create CouchDB database (${response.status}).`)
const index = await couchRequest('/_index', {
  method: 'POST',
  body: JSON.stringify({ index: { fields: ['kind'] }, name: 'by-kind', type: 'json' }),
})
if (!index.ok) throw new Error(`Could not create CouchDB index (${index.status}).`)
console.log('Timestripe CouchDB database and indexes are ready.')
