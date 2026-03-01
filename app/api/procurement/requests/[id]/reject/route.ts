import { NextRequest } from 'next/server'
import { POST as processStep } from '../process-step/route'

// POST /api/procurement/requests/[id]/reject
// Compatibility endpoint for UI: delegates to workflow engine (process-step reject)
export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const body = await request.json().catch(() => ({} as any))
  const reason = body?.reason

  const proxyReq = new NextRequest(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({ action: 'reject', comment: reason || null }),
  })

  return processStep(proxyReq, ctx)
}

