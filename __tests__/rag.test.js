const ai = require('../utils/ai')
const vectorDB = require('../utils/vectorDB')

describe('RAG task helpers', () => {
  const originalEnv = process.env
  const originalFetch = global.fetch

  const task = {
    id: 'id_task00001',
    userId: 'id_user00001',
    title: 'Prepare quarterly review',
    category: 'work',
    priority: 'high',
    location: 'Room A',
    address: 'Office 3F',
    note: 'Bring sales numbers',
    date: '2026-07-08',
    startTime: '10:00',
    endTime: '11:00',
    status: 'pending',
    isFeatured: true
  }

  afterEach(() => {
    process.env = originalEnv
    global.fetch = originalFetch
    jest.restoreAllMocks()
  })

  test('builds searchable task text for embeddings', () => {
    expect(ai.taskToEmbeddingText(task)).toBe([
      'Title: Prepare quarterly review',
      'Category: work',
      'Priority: high',
      'Date: 2026-07-08',
      'Time: 10:00-11:00',
      'Location: Room A',
      'Address: Office 3F',
      'Status: pending',
      'Featured: yes',
      'Note: Bring sales numbers'
    ].join('\n'))
  })

  test('builds Qdrant payload from a task', () => {
    expect(ai.taskToVectorPayload(task)).toEqual({
      id: 'id_task00001',
      userId: 'id_user00001',
      title: 'Prepare quarterly review',
      category: 'work',
      priority: 'high',
      location: 'Room A',
      address: 'Office 3F',
      note: 'Bring sales numbers',
      date: '2026-07-08',
      startTime: '10:00',
      endTime: '11:00',
      status: 'pending',
      isFeatured: true
    })
  })

  test('answers from Qdrant search hits with sources', () => {
    const result = ai.answerFromVectorHits([
      {
        score: 0.91,
        payload: {
          id: 'id_task00001',
          title: 'Prepare quarterly review',
          date: '2026-07-08',
          startTime: '10:00',
          status: 'pending',
          priority: 'high',
          location: 'Room A'
        }
      }
    ])

    expect(result).toEqual({
      answer: 'Summary: Prepare quarterly review | 2026-07-08 | 10:00 | pending | high | Room A',
      sources: [
        {
          id: 'id_task00001',
          title: 'Prepare quarterly review',
          date: '2026-07-08',
          status: 'pending',
          score: 0.91
        }
      ]
    })
  })

  test('maps task ids to stable Qdrant point UUIDs', () => {
    expect(vectorDB.toPointId('id_task00001')).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/
    )
    expect(vectorDB.toPointId('id_task00001')).toBe(vectorDB.toPointId('id_task00001'))
    expect(vectorDB.toPointId('id_task00002')).not.toBe(vectorDB.toPointId('id_task00001'))
  })

  test('skips vector search when RAG is disabled', async () => {
    process.env = {
      ...originalEnv,
      AI_RAG_ENABLED: 'false',
      OPENAI_API_KEY: 'test-key',
      QDRANT_URL: 'http://localhost:6333'
    }
    global.fetch = jest.fn()

    const result = await ai.answerFromTasksWithRag('quarterly review', [task], task.userId)

    expect(global.fetch).not.toHaveBeenCalled()
    expect(result).toEqual({
      answer: 'Summary: Prepare quarterly review | 2026-07-08 | 10:00 | pending | high | Room A',
      sources: [
        {
          id: 'id_task00001',
          title: 'Prepare quarterly review',
          date: '2026-07-08',
          status: 'pending'
        }
      ]
    })
  })
})
