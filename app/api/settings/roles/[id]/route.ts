import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';
import { isSuperAdmin } from '@/lib/permissions';

// Get role details
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const session = await getSession(await cookies());
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = await prisma.systemRole.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        nameAr: true,
        nameEn: true,
        description: true,
        isActive: true,
        isSystem: true
      }
    });

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    return NextResponse.json(role);
  } catch (error) {
    console.error('Error fetching role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update role
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

    const { nameAr, nameEn, description, isActive } = await request.json();

    // Get existing role
    const role = await prisma.systemRole.findUnique({
      where: { id: params.id }
    });

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Prevent editing SUPER_ADMIN role
    if (role.name === 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'لا يمكن تعديل دور المدير العام' }, { status: 403 });
    }

    // Update role
    const updated = await prisma.systemRole.update({
      where: { id: params.id },
      data: {
        nameAr: nameAr?.trim() || role.nameAr,
        nameEn: nameEn?.trim() || role.nameEn,
        description: description?.trim() || role.description,
        isActive: isActive !== undefined ? isActive : role.isActive
      }
    });

    // Log audit
    await prisma.permissionAuditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE_ROLE',
        roleId: role.id,
        roleName: role.name,
        details: JSON.stringify({ nameAr, nameEn, description, isActive })
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Delete role
export async function DELETE(
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

    // Get existing role
    const role = await prisma.systemRole.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { users: true }
        }
      }
    });

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Prevent deleting system roles
    if (role.isSystem) {
      return NextResponse.json({ error: 'لا يمكن حذف أدوار النظام' }, { status: 403 });
    }

    // Prevent deleting if users assigned
    if (role._count.users > 0) {
      return NextResponse.json({ 
        error: `لا يمكن حذف الدور لأن ${role._count.users} مستخدم مرتبط به` 
      }, { status: 400 });
    }

    // Delete role (permissions will be deleted automatically via cascade)
    await prisma.systemRole.delete({
      where: { id: params.id }
    });

    // Log audit
    await prisma.permissionAuditLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE_ROLE',
        roleId: role.id,
        roleName: role.name,
        details: JSON.stringify({ nameAr: role.nameAr })
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
