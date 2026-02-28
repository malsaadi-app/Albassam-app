import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'
import { cookies } from 'next/headers'
import {
  MaintenanceRole,
  MaintenanceTeam,
  MaintenanceType,
  type Employee,
  type MaintenanceRequest
} from '@prisma/client'
import { getMaintenanceManagerUserId } from '@/lib/maintenance/routing'

export type MaintenanceAccess = {
  sessionUserId: string
  isAdmin: boolean
  employee: Employee | null
  maintenanceRole: MaintenanceRole | null
  maintenanceTeam: MaintenanceTeam | null
  isGlobalMaintenanceManager: boolean
}

export async function getMaintenanceAccess(): Promise<MaintenanceAccess> {
  const session = await getSession(await cookies())
  if (!session.user) {
    throw new Error('UNAUTHORIZED')
  }

  const isAdmin = session.user.role === 'ADMIN'

  const employee = await prisma.employee.findFirst({
    where: { userId: session.user.id }
  })

  const managerUserId = await getMaintenanceManagerUserId()
  const isGlobalMaintenanceManager = managerUserId ? session.user.id === managerUserId : false

  return {
    sessionUserId: session.user.id,
    isAdmin,
    employee,
    maintenanceRole: (employee?.maintenanceRole as MaintenanceRole | null) ?? null,
    maintenanceTeam: (employee?.maintenanceTeam as MaintenanceTeam | null) ?? null,
    isGlobalMaintenanceManager
  }
}

export function isMaintenanceManager(access: MaintenanceAccess) {
  return (
    access.isAdmin ||
    access.isGlobalMaintenanceManager ||
    access.maintenanceRole === 'BUILDING_MANAGER' ||
    access.maintenanceRole === 'IT_MANAGER'
  )
}

export function isMaintenanceTechnician(access: MaintenanceAccess) {
  return (
    access.isAdmin ||
    access.maintenanceRole === 'BUILDING_TECH' ||
    access.maintenanceRole === 'IT_TECH'
  )
}

export function teamForType(type: MaintenanceType): MaintenanceTeam {
  return type === 'BUILDING' ? 'BUILDING' : 'IT'
}

export function canAccessRequest(access: MaintenanceAccess, req: Pick<MaintenanceRequest, 'requestedById' | 'assignedToId' | 'type'>) {
  if (access.isAdmin) return true

  const employeeId = access.employee?.id
  if (!employeeId) return false

  // Managers can view all requests in their team (if team set)
  if (isMaintenanceManager(access)) {
    const team = access.maintenanceTeam
    if (!team) return true
    return teamForType(req.type) === team
  }

  // Technicians: assigned or creator
  if (isMaintenanceTechnician(access)) {
    return req.assignedToId === employeeId || req.requestedById === employeeId
  }

  // Regular employees: only their own
  return req.requestedById === employeeId
}

export function canEditRequest(access: MaintenanceAccess, req: Pick<MaintenanceRequest, 'requestedById' | 'status' | 'type'>) {
  if (access.isAdmin) return true

  const employeeId = access.employee?.id
  if (!employeeId) return false

  if (isMaintenanceManager(access)) {
    const team = access.maintenanceTeam
    if (!team) return true
    return teamForType(req.type) === team
  }

  // Creator can edit early
  if (req.requestedById === employeeId && (req.status === 'SUBMITTED' || req.status === 'UNDER_REVIEW')) {
    return true
  }

  return false
}

export function canAssign(access: MaintenanceAccess, type: MaintenanceType) {
  if (access.isAdmin) return true
  if (!isMaintenanceManager(access)) return false
  if (!access.maintenanceTeam) return true
  return teamForType(type) === access.maintenanceTeam
}

export function canUpdateStatus(access: MaintenanceAccess, req: Pick<MaintenanceRequest, 'assignedToId' | 'requestedById' | 'type'>) {
  if (access.isAdmin) return true
  const employeeId = access.employee?.id
  if (!employeeId) return false

  if (isMaintenanceManager(access)) {
    if (!access.maintenanceTeam) return true
    return teamForType(req.type) === access.maintenanceTeam
  }

  if (isMaintenanceTechnician(access)) {
    return req.assignedToId === employeeId
  }

  // Requester can cancel/reopen via status endpoint (handled in route)
  return req.requestedById === employeeId
}
