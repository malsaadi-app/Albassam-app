import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';
import { isSuperAdmin } from '@/lib/permissions';

// Get all roles with user counts
export async function GET() {
  try {
    // Define available roles
    const availableRoles = [
      { id: 'ADMIN', nameAr: 'مدير النظام', role: 'ADMIN' },
      { id: 'HR_EMPLOYEE', nameAr: 'موظف موارد بشرية', role: 'HR_EMPLOYEE' },
      { id: 'USER', nameAr: 'مستخدم عادي', role: 'USER' }
    ];

    // Get all users grouped by role
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: true
    });

    // Convert to RoleStats format with counts
    const roles = availableRoles.map(availableRole => {
      const userCount = usersByRole.find(u => u.role === availableRole.role)?._count || 0;
      return {
        id: availableRole.id,
        nameAr: availableRole.nameAr,
        role: availableRole.role,
        count: userCount,
        permissions: []
      };
    });

    return NextResponse.json({ roles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create new role
export async function POST(request: NextRequest) {
  try {
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

    if (!nameAr) {
      return NextResponse.json({ error: 'Name in Arabic is required' }, { status: 400 });
    }

    // Check if name already exists
    const existing = await prisma.systemRole.findFirst({
      where: {
        OR: [
          { nameAr },
          { name: nameAr.toUpperCase().replace(/\s+/g, '_') }
        ]
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'اسم الدور موجود مسبقاً' }, { status: 400 });
    }

    // Generate unique name (snake_case from Arabic)
    const name = nameAr
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_')
      .replace(/[^\w_]/g, '');

    // Create role
    const role = await prisma.systemRole.create({
      data: {
        name,
        nameAr: nameAr.trim(),
        nameEn: nameEn?.trim() || null,
        description: description?.trim() || null,
        isActive: isActive !== false,
        isSystem: false,
        sortOrder: 100 // Custom roles come after system roles
      }
    });

    // Log audit
    await prisma.permissionAuditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE_ROLE',
        roleId: role.id,
        roleName: role.name,
        details: JSON.stringify({ nameAr, nameEn, description })
      }
    });

    return NextResponse.json(role);
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
