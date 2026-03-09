import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/session';

// GET /api/auth/session - Get current session
export async function GET() {
  try {
    const session = await getSession(await cookies());
    
    if (!session || !session.user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json(session, { status: 200 });
  } catch (error) {
    console.error('Error getting session:', error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
