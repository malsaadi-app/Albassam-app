import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';
import { isSuperAdmin } from '@/lib/permissions';

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const session = await getSession(await cookies());
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is Super Admin
    const isAdmin = await isSuperAdmin(session.user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { permissionIds } = await request.json();

    if (!Array.isArray(permissionIds)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    // Check if role exists
    const role = await prisma.systemRole.findUnique({
      where: { id: params.id }
    });

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Note: We allow modifying permissions even for system roles
    // The isSystem flag only protects from deletion

    // Delete existing permissions
    await prisma.rolePermission.deleteMany({
      where: { roleId: params.id }
    });

    // Add new permissions
    await prisma.rolePermission.createMany({
      data: permissionIds.map(permId => ({
        roleId: params.id,
        permissionId: permId
      }))
    });

    // Log audit
    await prisma.permissionAuditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE_ROLE_PERMISSIONS',
        roleId: params.id,
        roleName: role.name,
        details: JSON.stringify({ permissionCount: permissionIds.length })
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating role permissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
