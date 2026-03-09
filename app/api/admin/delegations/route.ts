import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { syncDelegationNotifications } from '@/lib/delegation';


const createSchema = z.object({
  delegateToUserId: z.string().min(1),
  startAt: z.string().min(1),
  endAt: z.string().min(1),
  active: z.boolean().optional().default(true)
});

export async function GET() {
  try {
    const session = await getSession(await cookies());
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const delegations = await prisma.hRDelegation.findMany({
      include: {
        delegateTo: { select: { id: true, displayName: true, username: true } },
        createdBy: { select: { id: true, displayName: true, username: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ delegations });
  } catch (err) {
    console.error('Error listing delegations:', err);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(await cookies());
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const body = await req.json();
    const data = createSchema.parse(body);

    const startAt = new Date(data.startAt);
    const endAt = new Date(data.endAt);

    if (!(startAt instanceof Date) || isNaN(startAt.getTime())) {
      return NextResponse.json({ error: 'تاريخ البداية غير صحيح' }, { status: 400 });
    }
    if (!(endAt instanceof Date) || isNaN(endAt.getTime())) {
      return NextResponse.json({ error: 'تاريخ النهاية غير صحيح' }, { status: 400 });
    }
    if (endAt < startAt) {
      return NextResponse.json({ error: 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية' }, { status: 400 });
    }

    const delegation = await prisma.hRDelegation.create({
      data: {
        delegateToUserId: data.delegateToUserId,
        createdByUserId: session.user.id,
        startAt,
        endAt,
        active: data.active
      },
      include: {
        delegateTo: { select: { id: true, displayName: true, username: true } }
      }
    });

    // Opportunistic notify if started already
    await syncDelegationNotifications(prisma as any, delegation.delegateToUserId);

    return NextResponse.json({ delegation }, { status: 201 });
  } catch (err) {
    console.error('Error creating delegation:', err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'بيانات غير صحيحة', details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
