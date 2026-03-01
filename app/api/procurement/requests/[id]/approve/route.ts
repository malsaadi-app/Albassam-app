import { NextRequest } from 'next/server'
import { POST as processStep } from '../process-step/route'

// POST /api/procurement/requests/[id]/approve
// Compatibility endpoint for UI: delegates to workflow engine (process-step approve)
export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const body = await request.json().catch(() => ({} as any))
  const notes = body?.notes

  const proxyReq = new NextRequest(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({ action: 'approve', comment: notes || null }),
  })

  return processStep(proxyReq, ctx)
}

