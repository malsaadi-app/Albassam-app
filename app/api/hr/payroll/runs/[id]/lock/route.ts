import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/session';
import { lockPayrollRun } from '@/lib/payroll';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

// POST /api/hr/payroll/runs/[id]/lock - Lock payroll run
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await getSession(await cookies());

    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const hasPermission = session.user.permissions?.includes('payroll.manage');
    if (!hasPermission) {
      return NextResponse.json({ error: 'ليس لديك صلاحية' }, { status: 403 });
    }

    const { id } = await params;

    await lockPayrollRun(id);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error locking payroll run:', error);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء القفل' },
      { status: 500 }
    );
  }
}
