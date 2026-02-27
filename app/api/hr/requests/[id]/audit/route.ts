import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { isDelegatedViewer } from '@/lib/delegation';


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession(await cookies());

    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const hrRequest = await prisma.hRRequest.findUnique({ where: { id } });
    if (!hrRequest) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });

    const delegated = await isDelegatedViewer(prisma, session.user.id);

    const canView =
      session.user.role === 'ADMIN' ||
      session.user.role === 'HR_EMPLOYEE' ||
      delegated ||
      hrRequest.employeeId === session.user.id;

    if (!canView) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const logs = await prisma.hRRequestAuditLog.findMany({
      where: { requestId: id },
      include: { actor: { select: { id: true, displayName: true, username: true, role: true } } },
      orderBy: { createdAt: 'asc' }
    });

    const normalized = logs.map((l) => ({
      ...l,
      diffJson: l.diffJson ? safeJsonParse(l.diffJson) : null
    }));

    return NextResponse.json({ logs: normalized });
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
