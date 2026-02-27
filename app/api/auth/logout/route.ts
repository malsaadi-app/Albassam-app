import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'

export async function POST() {
  const cookieStore = await cookies()
  const session = await getSession(cookieStore)
  session.destroy()
  return NextResponse.redirect(new URL('/auth/login', process.env.APP_URL || 'http://localhost:3000'))
}
