import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession(await cookies());
    
    // Log to server console (PM2 logs)
    console.log('\n' + '='.repeat(80));
    console.log('🔍 SESSION DEBUG:');
    console.log('='.repeat(80));
    console.log('Has session:', !!session);
    console.log('Has user:', !!session?.user);
    console.log('User ID:', session?.user?.id);
    console.log('Username:', session?.user?.username);
    console.log('Display Name:', session?.user?.displayName);
    console.log('System Role ID:', session?.user?.systemRole?.id);
    console.log('System Role Name:', session?.user?.systemRole?.name);
    console.log('System Role NameAr:', session?.user?.systemRole?.nameAr);
    console.log('Permissions Array:', JSON.stringify(session?.user?.permissions));
    console.log('Permissions Count:', session?.user?.permissions?.length || 0);
    console.log('\nPermissions Detail:');
    if (session?.user?.permissions && session.user.permissions.length > 0) {
      session.user.permissions.forEach((perm, index) => {
        const icon = perm.includes('attendance') ? '🎯' : '  ';
        console.log(`  ${icon} ${index + 1}. ${perm}`);
      });
    } else {
      console.log('  ❌ NO PERMISSIONS!');
    }
    console.log('\nChecks:');
    console.log('  includes("attendance.submit"):', session?.user?.permissions?.includes('attendance.submit'));
    console.log('  includes("attendance.view_own"):', session?.user?.permissions?.includes('attendance.view_own'));
    console.log('='.repeat(80) + '\n');
    
    return NextResponse.json({
      ok: true,
      message: 'Session logged to server console (check PM2 logs)',
      summary: {
        hasSession: !!session,
        hasUser: !!session?.user,
        username: session?.user?.username,
        role: session?.user?.systemRole?.nameAr,
        permissionsCount: session?.user?.permissions?.length || 0,
        hasAttendanceSubmit: session?.user?.permissions?.includes('attendance.submit')
      }
    });
  } catch (error) {
    console.error('❌ Session Debug Error:', error);
    return NextResponse.json({ 
      error: String(error)
    }, { status: 500 });
  }
}
