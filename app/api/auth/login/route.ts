import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { getSession, CURRENT_SESSION_VERSION } from '@/lib/session'
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
          nameEn: true,
          permissions: {
            select: {
              permission: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      },
      employee: {
        select: {
          id: true,
          orgAssignments: {
            where: { active: true },
            select: {
              id: true,
              orgUnitId: true,
              role: true,
              assignmentType: true
            }
          }
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
  
  // Extract permissions from systemRole
  const permissions = user.systemRole?.permissions.map(rp => rp.permission.name) || []
  
  // Extract org assignments
  const orgAssignments = user.employee?.orgAssignments || []
  
  session.user = {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    systemRole: user.systemRole ? {
      id: user.systemRole.id,
      name: user.systemRole.name,
      nameAr: user.systemRole.nameAr,
      nameEn: user.systemRole.nameEn
    } : undefined,
    permissions,
    orgAssignments
  }
  session.version = CURRENT_SESSION_VERSION
  await session.save()

  return NextResponse.json({ ok: true })
}
