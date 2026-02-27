import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/session';

export async function POST() {
  try {
    const session = await getSession(await cookies());

    // Check if user is impersonating
    if (!(session as any).isImpersonating || !(session as any).originalUser) {
      return NextResponse.json({ error: 'Not currently impersonating' }, { status: 400 });
    }

    // Restore original user
    session.user = (session as any).originalUser;
    delete (session as any).originalUser;
    delete (session as any).isImpersonating;

    await session.save();

    return NextResponse.json({
      success: true,
      message: 'Returned to original account'
    });

  } catch (error) {
    console.error('Revert impersonation error:', error);
    return NextResponse.json(
      { error: 'Failed to revert impersonation' },
      { status: 500 }
    );
  }
}
