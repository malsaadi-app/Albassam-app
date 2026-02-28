import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { syncDelegationNotifications } from '@/lib/delegation';


export async function GET() {
  try {
    const session = await getSession(await cookies());

    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // Opportunistically deliver delegation start/end notifications.
    await syncDelegationNotifications(prisma, session.user.id);

    const emp = await prisma.employee.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        fullNameAr: true,
        fullNameEn: true,
        nationalId: true,
        employeeNumber: true,
        position: true,
        department: true,
        branch: { select: { id: true, name: true } },
        stage: { select: { id: true, name: true } },
        jobTitleRef: { select: { nameAr: true, nameEn: true } }
      }
    });

    const displayName = emp?.fullNameAr || session.user.displayName;

    return NextResponse.json({
      user: {
        ...session.user,
        displayName
      },
      employee: emp
        ? {
            id: emp.id,
            fullNameAr: emp.fullNameAr,
            fullNameEn: emp.fullNameEn,
            nationalId: emp.nationalId,
            employeeNumber: emp.employeeNumber,
            jobTitle: emp.jobTitleRef?.nameAr || emp.position || null,
            department: emp.department || null,
            branch: emp.branch,
            stage: emp.stage
          }
        : null,
      // Backward-compatible fields (some UI code expects them at top-level)
      role: session.user.role,
      displayName,
      fullNameAr: displayName,
      isImpersonating: (session as any).isImpersonating || false
    });
  } catch (error) {
    console.error('Error getting user:', error);
    return NextResponse.json(
      { error: 'حدث خطأ' },
      { status: 500 }
    );
  }
}
