// @vitest-environment node
import { describe, it, expect } from 'vitest'

const baseUrl = process.env.BASE_URL || 'https://app.albassam-app.com'

async function login(username: string, password: string) {
  // Make a manual cookie jar
  let cookie = ''

  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, password }),
    redirect: 'manual',
  })

  expect([200, 302]).toContain(res.status)

  const setCookie = res.headers.get('set-cookie')
  if (setCookie) cookie = setCookie.split(';')[0]

  return {
    async post(path: string, data?: any) {
      const r = await fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(cookie ? { cookie } : {}),
        },
        body: data ? JSON.stringify(data) : undefined,
      })
      return r
    },
    async get(path: string) {
      const r = await fetch(`${baseUrl}${path}`, {
        method: 'GET',
        headers: {
          ...(cookie ? { cookie } : {}),
        },
      })
      return r
    },
  }
}

describe('procurement workflow e2e (API)', () => {
  it('requester -> asma -> mq -> abdullahsh -> requester confirm receipt', async () => {
    const requester = await login('qa_requester_girls', 'qa12345')

    const createRes = await requester.post('/api/procurement/requests', {
      department: 'QA Dept',
      category: 'STATIONERY',
      items: [{ name: 'QA Item', quantity: 1, unit: 'pcs', specifications: 'test', estimatedPrice: 10 }],
      priority: 'NORMAL',
      justification: 'QA',
      attachments: [],
    })
    expect(createRes.status).toBe(200)
    const createJson = await createRes.json()
    const id = createJson?.request?.id
    expect(id).toBeTruthy()

    // Step0: gatekeeper (asma)
    const asma = await login('asma', 'Test1234')
    const step0 = await asma.post(`/api/procurement/requests/${id}/process-step`, { action: 'approve', comment: 'OK' })
    expect(step0.status).toBe(200)

    // Step1: mq
    const mq = await login('mq', 'Test1234')
    const step1 = await mq.post(`/api/procurement/requests/${id}/process-step`, { action: 'approve', comment: 'OK' })
    expect(step1.status).toBe(200)

    // Step2: abdullahsh (last step -> IN_PROGRESS)
    const abd = await login('abdullahsh', 'Test1234')
    const step2 = await abd.post(`/api/procurement/requests/${id}/process-step`, { action: 'approve', comment: 'Delivering' })
    expect(step2.status).toBe(200)
    const step2Json = await step2.json()
    expect(step2Json.status).toBe('IN_PROGRESS')

    // Requester confirms receipt -> COMPLETED
    const confirm = await requester.post(`/api/procurement/requests/${id}/confirm-receipt`)
    expect(confirm.status).toBe(200)
    const confirmJson = await confirm.json()
    expect(confirmJson.status).toBe('COMPLETED')
  })
})
