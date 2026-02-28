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

    return NextResponse.json({
      user: session.user,
      // Backward-compatible fields (some UI code expects them at top-level)
      role: session.user.role,
      displayName: session.user.displayName,
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
