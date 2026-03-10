import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession(await cookies());
    
    return NextResponse.json({
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      username: session?.user?.username,
      displayName: session?.user?.displayName,
      roleId: session?.user?.systemRole?.id,
      roleName: session?.user?.systemRole?.nameAr,
      permissionsCount: session?.user?.permissions?.length || 0,
      permissions: session?.user?.permissions || [],
      attendanceSubmit: session?.user?.permissions?.includes('attendance.submit'),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ 
      error: String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
