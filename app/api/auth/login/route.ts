import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'
import { applyRateLimit, loginLimiter } from '@/lib/rate-limit'
import { loginSchema, validateRequestBody } from '@/lib/validations'

export async function POST(req: Request) {
  // Apply rate limiting (5 attempts per 15 minutes)
  const rateLimitResult = await applyRateLimit(req, loginLimiter)
  if (rateLimitResult) {
    return rateLimitResult
  }

  const json = await req.json().catch(() => null)
  const validation = validateRequestBody(loginSchema, json)
  
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  const { username, password } = validation.data

  const user = await prisma.user.findUnique({ 
    where: { username },
    include: {
      systemRole: {
        select: {
          id: true,
          name: true,
          nameAr: true,
          nameEn: true
        }
      }
    }
  })
  if (!user) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
  }

  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
  }

  const cookieStore = await cookies()
  const session = await getSession(cookieStore)
  session.user = {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    systemRole: user.systemRole || undefined
  }
  await session.save()

  return NextResponse.json({ ok: true })
}
