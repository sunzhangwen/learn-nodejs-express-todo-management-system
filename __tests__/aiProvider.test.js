describe('AI provider configuration', () => {
  const originalEnv = process.env
  const originalFetch = global.fetch

  afterEach(() => {
    process.env = originalEnv
    global.fetch = originalFetch
    jest.resetModules()
  })

  test('uses Mimo API defaults for chat completions', async () => {
    process.env = {
      ...originalEnv,
      MIMO_API_KEY: 'test-mimo-key',
      OPENAI_API_KEY: ''
    }
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                category: 'work',
                priority: 'high',
                isFeatured: true,
                reason: 'deadline'
              })
            }
          }
        ]
      })
    })

    const ai = require('../utils/ai')

    await ai.classifyTask({ title: 'Finish important launch plan' })

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.xiaomimimo.com/v1/chat/completions',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-mimo-key',
          'Content-Type': 'application/json'
        }),
        body: expect.any(String)
      })
    )
    expect(JSON.parse(global.fetch.mock.calls[0][1].body)).toEqual(
      expect.objectContaining({
        model: 'mimo-v2.5-pro'
      })
    )
  })

  test('parses a task with a single AI request', async () => {
    process.env = {
      ...originalEnv,
      MIMO_API_KEY: 'test-mimo-key',
      OPENAI_API_KEY: ''
    }
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: 'Finish launch plan',
                category: 'work',
                priority: 'high',
                startTime: '09:00',
                endTime: '',
                location: '',
                note: 'Finish launch plan tomorrow',
                date: '2026-07-05',
                status: 'pending',
                isFeatured: true
              })
            }
          }
        ]
      })
    })

    const ai = require('../utils/ai')

    await ai.parseTask('Finish launch plan tomorrow')

    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(global.fetch.mock.calls[0][0]).toBe('https://api.xiaomimimo.com/v1/chat/completions')
  })

  test('keeps parsed task title in the user language when Mimo translates it', async () => {
    process.env = {
      ...originalEnv,
      MIMO_API_KEY: 'test-mimo-key',
      OPENAI_API_KEY: ''
    }
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: 'Complete homework',
                category: 'work',
                priority: 'high',
                startTime: '21:00',
                endTime: '22:00',
                location: '',
                note: '',
                date: '2026-07-04',
                status: 'pending',
                isFeatured: false
              })
            }
          }
        ]
      })
    })

    const ai = require('../utils/ai')

    const result = await ai.parseTask('创建任务，今天晚上9:00~10:00我要去完成作业。')

    expect(result.title).toBe('完成作业')
  })
})
