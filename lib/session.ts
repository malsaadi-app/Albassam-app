import { type SessionOptions, getIronSession } from 'iron-session'
import type { cookies } from 'next/headers'

export type SessionUser = {
  id: string
  username: string
  displayName: string
  role: 'ADMIN' | 'HR_EMPLOYEE' | 'USER'
  systemRole?: {
    id: string
    name: string
    nameAr: string
    nameEn: string
  }
}

export type AppSession = {
  user?: SessionUser
}

const password = process.env.SESSION_PASSWORD
if (!password) {
  throw new Error('Missing SESSION_PASSWORD env var (must be 32+ chars)')
}

export const sessionOptions: SessionOptions = {
  password,
  cookieName: 'albassam_tasks_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 // 7 days in seconds
  },
  ttl: 60 * 60 * 24 * 7 // 7 days in seconds
}

export async function getSession(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return getIronSession<AppSession>(cookieStore as any, sessionOptions)
}
