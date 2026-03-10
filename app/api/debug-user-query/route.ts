import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username') || '1113256885';
    
    console.log('\n' + '='.repeat(80));
    console.log('🔍 DEBUG USER QUERY FOR:', username);
    console.log('='.repeat(80));
    
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
            fullNameAr: true,
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
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    console.log('\n📋 User found:');
    console.log('  ID:', user.id);
    console.log('  Username:', user.username);
    console.log('  Display Name:', user.displayName);
    console.log('  roleId:', user.roleId);
    
    console.log('\n🎭 SystemRole:');
    console.log('  Exists:', !!user.systemRole);
    if (user.systemRole) {
      console.log('  ID:', user.systemRole.id);
      console.log('  Name:', user.systemRole.name);
      console.log('  NameAr:', user.systemRole.nameAr);
      console.log('  Permissions array:', user.systemRole.permissions);
      console.log('  Permissions count:', user.systemRole.permissions?.length || 0);
    }
    
    // Simulate what login does
    const permissions = user.systemRole?.permissions.map(rp => rp.permission.name) || [];
    
    console.log('\n🔐 Extracted permissions:');
    console.log('  Array:', permissions);
    console.log('  Count:', permissions.length);
    if (permissions.length > 0) {
      permissions.forEach((p, i) => {
        const icon = p.includes('attendance') ? '🎯' : '  ';
        console.log(`  ${icon} ${i + 1}. ${p}`);
      });
    } else {
      console.log('  ❌ EMPTY!');
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
    
    return NextResponse.json({
      username: user.username,
      displayName: user.displayName,
      roleId: user.roleId,
      systemRole: user.systemRole ? {
        id: user.systemRole.id,
        name: user.systemRole.name,
        nameAr: user.systemRole.nameAr,
        permissionsCount: user.systemRole.permissions?.length || 0,
        permissionsRaw: user.systemRole.permissions
      } : null,
      extractedPermissions: permissions,
      permissionsCount: permissions.length
    });
  } catch (error) {
    console.error('❌ Debug query error:', error);
    return NextResponse.json({ 
      error: String(error)
    }, { status: 500 });
  }
}
