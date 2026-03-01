// @vitest-environment node
import { describe, it, expect } from 'vitest'

const baseUrl = process.env.BASE_URL || 'http://localhost:3000'

describe('health endpoints', () => {
  it('GET /api/health returns ok', async () => {
    const res = await fetch(`${baseUrl}/api/health`)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.status).toBe('ok')
    expect(json.database).toBe(true)
  })

  it('GET /api/status returns operational', async () => {
    const res = await fetch(`${baseUrl}/api/status`)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(['operational', 'degraded', 'down']).toContain(json.status)
    expect(json.services?.application?.status).toBe('operational')
  })
})
