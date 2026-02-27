import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { syncDelegationNotifications } from '@/lib/delegation';


export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession(await cookies());
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const delegation = await prisma.hRDelegation.findUnique({ where: { id } });
    if (!delegation) return NextResponse.json({ error: 'غير موجود' }, { status: 404 });

    const now = new Date();
    const updated = await prisma.hRDelegation.update({
      where: { id },
      data: {
        active: false,
        endAt: delegation.endAt > now ? now : delegation.endAt
      }
    });

    await syncDelegationNotifications(prisma, updated.delegateToUserId);

    return NextResponse.json({ delegation: updated });
  } catch (err) {
    console.error('Error cancel delegation:', err);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
