import prisma from '@/lib/prisma'

export async function getMaintenanceManagerUserId(): Promise<string | null> {
  const row = await prisma.maintenanceRoutingSettings.findFirst({
    orderBy: { updatedAt: 'desc' }
  })
  return row?.maintenanceManagerUserId ?? null
}

export async function getBranchForwarderUserId(branchId: string): Promise<string | null> {
  const row = await prisma.maintenanceBranchForwarder.findUnique({
    where: { branchId }
  })
  return row?.userId ?? null
}

export async function ensureMaintenanceSettings() {
  const existing = await prisma.maintenanceRoutingSettings.findFirst()
  if (existing) return existing
  return prisma.maintenanceRoutingSettings.create({ data: {} })
}
