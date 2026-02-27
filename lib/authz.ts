import { Role } from '@prisma/client'

export function isAdmin(role: Role | 'ADMIN' | 'EMPLOYEE') {
  return role === 'ADMIN'
}
