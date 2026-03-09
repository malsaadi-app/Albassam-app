import { type SessionOptions, getIronSession } from 'iron-session'
import type { cookies } from 'next/headers'

export type SessionUser = {
  id: string
  username: string
  displayName: string
  role: string
  systemRole?: {
    id: string
    name: string
    nameAr: string
    nameEn: string
  }
  permissions?: string[] // User permissions array (from systemRole)
  orgAssignments?: Array<{ // Org structure assignments for data filtering
    id: string
    orgUnitId: string
    role: 'HEAD' | 'SUPERVISOR' | 'MEMBER'
    assignmentType: 'ADMIN' | 'FUNCTIONAL' | 'EXECUTIVE' // 🆕
  }>
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
    // Allow session to work across subdomains (e.g. app. and p.)
    ...(process.env.NODE_ENV === 'production' ? { domain: '.albassam-app.com' } : {}),
    maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
  },
  ttl: 60 * 60 * 24 * 7 // 7 days in seconds
}

export async function getSession(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return getIronSession<AppSession>(cookieStore as any, sessionOptions)
}
