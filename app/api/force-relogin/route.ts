import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/session';

// Force logout and redirect to login
export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);
    
    // Destroy session
    session.destroy();
    await session.save();
    
    return NextResponse.json({
      ok: true,
      message: 'Session cleared. Redirecting to login...',
      redirect: '/auth/login'
    });
  } catch (error) {
    return NextResponse.json({ 
      error: String(error)
    }, { status: 500 });
  }
}
