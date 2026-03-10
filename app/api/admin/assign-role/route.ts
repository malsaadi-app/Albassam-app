import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'

// POST: Assign system role to user
export async function POST(request: NextRequest) {
  const session = await getSession(await cookies())
  
  // Only SUPER_ADMIN can assign roles
  if (!session.user || !session.user.permissions?.includes('*')) {
    return NextResponse.json({ error: 'غير مصرح - SUPER_ADMIN فقط' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const { username, roleName } = body

  if (!username || !roleName) {
    return NextResponse.json({ error: 'username and roleName required' }, { status: 400 })
  }

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user) {
      return NextResponse.json({ error: `User ${username} not found` }, { status: 404 })
    }

    // Find role
    const role = await prisma.systemRole.findUnique({
      where: { name: roleName },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    })

    if (!role) {
      return NextResponse.json({ error: `Role ${roleName} not found` }, { status: 404 })
    }

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: { roleId: role.id }
    })

    return NextResponse.json({
      ok: true,
      message: `تم ربط ${user.displayName} بدور ${role.nameAr}`,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName
      },
      role: {
        id: role.id,
        name: role.name,
        nameAr: role.nameAr,
        permissionsCount: role.permissions.length
      }
    })
  } catch (error) {
    console.error('Error assigning role:', error)
    return NextResponse.json({ error: 'Failed to assign role' }, { status: 500 })
  }
}
