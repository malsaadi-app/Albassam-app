import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'

// POST: Assign user(s) to role
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  const session = await getSession(await cookies())
  
  // Check ADMIN permission
  if (!session.user || !session.user.permissions?.includes('settings.manage_roles') && !session.user.permissions?.includes('*')) {
    return NextResponse.json({ error: 'غير مصرح - يتطلب صلاحية إدارة الأدوار' }, { status: 403 })
  }

  const roleId = params.id
  const body = await request.json().catch(() => ({}))
  const { userId, userIds } = body

  // Support both single user (userId) and multiple users (userIds)
  const idsToAssign = userIds || (userId ? [userId] : [])

  if (!idsToAssign || idsToAssign.length === 0) {
    return NextResponse.json({ error: 'userId or userIds is required' }, { status: 400 })
  }

  try {
    // Verify role exists
    const role = await prisma.systemRole.findUnique({
      where: { id: roleId }
    })

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    // Verify all users exist
    const users = await prisma.user.findMany({
      where: { id: { in: idsToAssign } }
    })

    if (users.length !== idsToAssign.length) {
      return NextResponse.json({ error: 'Some users not found' }, { status: 404 })
    }

    // Update all users' roleId
    await prisma.user.updateMany({
      where: { id: { in: idsToAssign } },
      data: { roleId: roleId }
    })

    // Return updated list of users with this role
    const updatedRole = await prisma.systemRole.findUnique({
      where: { id: roleId },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            displayName: true
          }
        }
      }
    })

    return NextResponse.json({
      ok: true,
      message: `تم ربط ${idsToAssign.length} مستخدم بدور ${role.nameAr}`,
      users: updatedRole?.users || []
    })
  } catch (error) {
    console.error('Error assigning users to role:', error)
    return NextResponse.json({ error: 'Failed to assign users' }, { status: 500 })
  }
}

// DELETE: Unassign user from role
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  const session = await getSession(await cookies())
  
  // Check ADMIN permission
  if (!session.user || !session.user.permissions?.includes('settings.manage_roles') && !session.user.permissions?.includes('*')) {
    return NextResponse.json({ error: 'غير مصرح - يتطلب صلاحية إدارة الأدوار' }, { status: 403 })
  }

  const roleId = params.id
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  try {
    // Verify user is actually assigned to this role
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.roleId !== roleId) {
      return NextResponse.json({ error: 'User is not assigned to this role' }, { status: 400 })
    }

    // Remove role assignment (set roleId to null)
    await prisma.user.update({
      where: { id: userId },
      data: { roleId: null }
    })

    // Return updated list of users with this role
    const updatedRole = await prisma.systemRole.findUnique({
      where: { id: roleId },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            displayName: true
          }
        }
      }
    })

    return NextResponse.json({
      ok: true,
      message: `تم إلغاء ربط المستخدم`,
      users: updatedRole?.users || []
    })
  } catch (error) {
    console.error('Error unassigning user from role:', error)
    return NextResponse.json({ error: 'Failed to unassign user' }, { status: 500 })
  }
}
