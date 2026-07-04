const crypto = require('crypto')

const COLLECTION = process.env.QDRANT_COLLECTION || 'tasks'
const DEFAULT_DISTANCE = process.env.QDRANT_DISTANCE || 'Cosine'

function isConfigured() {
  return Boolean(process.env.QDRANT_URL && typeof fetch === 'function')
}

async function qdrant(path, options = {}) {
  if (!isConfigured()) return null

  const headers = {
    'Content-Type': 'application/json',
    ...(process.env.QDRANT_API_KEY ? { 'api-key': process.env.QDRANT_API_KEY } : {})
  }

  const response = await fetch(`${process.env.QDRANT_URL}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {})
    }
  })

  if (!response.ok) {
    throw new Error(`Qdrant request failed: ${response.status}`)
  }

  return response.json()
}

function toPointId(id) {
  const hash = crypto.createHash('sha256').update(String(id)).digest('hex').slice(0, 32)
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `4${hash.slice(13, 16)}`,
    `8${hash.slice(17, 20)}`,
    hash.slice(20, 32)
  ].join('-')
}

async function ensureCollection(vectorSize) {
  if (!isConfigured() || !vectorSize) return null

  const headers = {
    'Content-Type': 'application/json',
    ...(process.env.QDRANT_API_KEY ? { 'api-key': process.env.QDRANT_API_KEY } : {})
  }

  const existing = await fetch(`${process.env.QDRANT_URL}/collections/${COLLECTION}`, {
    method: 'GET',
    headers
  })

  if (existing.ok) return existing.json()

  const result = await fetch(`${process.env.QDRANT_URL}/collections/${COLLECTION}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      vectors: {
        size: vectorSize,
        distance: DEFAULT_DISTANCE
      }
    })
  })

  if (!result.ok) {
    throw new Error(`Qdrant collection setup failed: ${result.status}`)
  }

  return result.json()
}

async function storeVector({ id, vector, payload }) {
  if (!isConfigured() || !Array.isArray(vector)) return null

  await ensureCollection(vector.length)

  return qdrant(`/collections/${COLLECTION}/points?wait=true`, {
    method: 'PUT',
    body: JSON.stringify({
      points: [{ id: toPointId(id), vector, payload }]
    })
  })
}

async function searchVectors({ vector, userId, limit = 5 }) {
  if (!isConfigured() || !Array.isArray(vector)) return []

  const result = await qdrant(`/collections/${COLLECTION}/points/search`, {
    method: 'POST',
    body: JSON.stringify({
      vector,
      limit,
      with_payload: true,
      filter: {
        must: [{ key: 'userId', match: { value: userId } }]
      }
    })
  })

  return result?.result || []
}

async function deleteVector(id) {
  if (!isConfigured()) return null

  return qdrant(`/collections/${COLLECTION}/points/delete?wait=true`, {
    method: 'POST',
    body: JSON.stringify({
      points: [toPointId(id)]
    })
  })
}

module.exports = {
  isConfigured,
  ensureCollection,
  toPointId,
  storeVector,
  searchVectors,
  deleteVector
}
