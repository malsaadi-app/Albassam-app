import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/session';

// GET /api/auth/session - Get current session
export async function GET() {
  try {
    const session = await getSession(await cookies());
    
    if (!session || !session.user) {
      // Return 401 Unauthorized when no session exists
      return NextResponse.json({ error: 'Unauthorized', user: null }, { status: 401 });
    }

    return NextResponse.json(session, { status: 200 });
  } catch (error) {
    console.error('Error getting session:', error);
    // Return 401 on error
    return NextResponse.json({ error: 'Session error', user: null }, { status: 401 });
  }
}
