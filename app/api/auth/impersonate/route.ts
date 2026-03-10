import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession, CURRENT_SESSION_VERSION } from '@/lib/session';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const session = await getSession(await cookies());

    // Check if user is logged in
    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is ADMIN
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can impersonate users' }, { status: 403 });
    }

    const body = await request.json();
    const { targetUserId } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: 'Target user ID is required' }, { status: 400 });
    }

    // Get target user with permissions
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { 
        id: true, 
        username: true, 
        displayName: true, 
        role: true,
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
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    // Extract permissions from systemRole (same as login)
    const permissions = targetUser.systemRole?.permissions.map(rp => rp.permission.name) || [];
    const orgAssignments = targetUser.employee?.orgAssignments || [];
    
    // Save original user before impersonation
    (session as any).originalUser = session.user;
    (session as any).isImpersonating = true;
    
    session.user = {
      id: targetUser.id,
      username: targetUser.username,
      displayName: targetUser.displayName,
      role: targetUser.role as 'ADMIN' | 'HR_EMPLOYEE' | 'USER',
      systemRole: targetUser.systemRole ? {
        id: targetUser.systemRole.id,
        name: targetUser.systemRole.name,
        nameAr: targetUser.systemRole.nameAr,
        nameEn: targetUser.systemRole.nameEn
      } : undefined,
      permissions,
      orgAssignments
    };
    session.version = CURRENT_SESSION_VERSION;

    await session.save();

    return NextResponse.json({
      success: true,
      message: `Now logged in as ${targetUser.displayName} (${targetUser.username})`,
      targetUser
    });

  } catch (error) {
    console.error('Impersonation error:', error);
    return NextResponse.json(
      { error: 'Failed to impersonate user' },
      { status: 500 }
    );
  }
}
