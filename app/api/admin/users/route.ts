import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';


export async function GET() {
  try {
    const session = await getSession(await cookies());
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true
      },
      orderBy: { displayName: 'asc' }
    });

    return NextResponse.json({ users });
  } catch (err) {
    console.error('Error listing users:', err);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
