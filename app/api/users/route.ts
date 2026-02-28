import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(await cookies());
    
    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        employee: {
          select: {
            fullNameAr: true,
            fullNameEn: true,
            position: true,
            department: true,
            jobTitleRef: { select: { nameAr: true, nameEn: true } }
          }
        }
      },
      orderBy: {
        displayName: 'asc'
      }
    });

    const shaped = users.map((u) => {
      const emp = u.employee as any
      const name = emp?.fullNameAr || u.displayName
      const jobTitle = emp?.jobTitleRef?.nameAr || emp?.position || ''
      return {
        id: u.id,
        username: u.username,
        displayName: name,
        jobTitle,
        department: emp?.department || '',
        role: u.role
      }
    })

    return NextResponse.json(shaped);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
