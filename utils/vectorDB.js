const COLLECTION = process.env.QDRANT_COLLECTION || 'tasks'

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

async function storeVector({ id, vector, payload }) {
  if (!isConfigured() || !Array.isArray(vector)) return null

  return qdrant(`/collections/${COLLECTION}/points?wait=true`, {
    method: 'PUT',
    body: JSON.stringify({
      points: [{ id, vector, payload }]
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
      points: [id]
    })
  })
}

module.exports = {
  isConfigured,
  storeVector,
  searchVectors,
  deleteVector
}
