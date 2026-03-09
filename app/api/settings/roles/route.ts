import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';
import { isSuperAdmin } from '@/lib/permissions';

// Get all system roles with user counts
export async function GET() {
  try {
    const session = await getSession(await cookies())
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Admin-only
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const roles = await prisma.systemRole.findMany({
      orderBy: [{ sortOrder: 'asc' }, { nameAr: 'asc' }],
      include: {
        _count: { 
          select: { 
            employees: true,  // Changed from users to employees
            permissions: true 
          } 
        },
      },
    })

    return NextResponse.json({
      roles: roles.map((r) => ({
        id: r.id,
        name: r.name,
        nameAr: r.nameAr,
        nameEn: r.nameEn,
        description: r.description,
        isActive: r.isActive,
        isSystem: r.isSystem,
        userCount: r._count.employees,  // Changed from users to employees
        permissionCount: r._count.permissions,
      })),
    })
  } catch (error) {
    console.error('Error fetching roles:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Create new role
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(await cookies());
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin-only (same as GET endpoint)
    if (session.user.role !== 'ADMIN') {
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
        nameEn: nameEn?.trim() || nameAr.trim(), // ✅ Use Arabic as fallback if English not provided
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
