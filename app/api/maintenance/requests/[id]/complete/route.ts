import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'
import { cookies } from 'next/headers'
import { canUpdateStatus, getMaintenanceAccess, isMaintenanceManager, isMaintenanceTechnician } from '@/lib/maintenance/auth'
import { MaintenanceHistoryAction } from '@prisma/client'

const schema = z.object({
  laborHours: z.number().nonnegative().optional(),
  notes: z.string().optional(),
  parts: z
    .array(
      z.object({
        partName: z.string().min(1),
        quantity: z.number().int().positive(),
        unitCost: z.number().nonnegative()
      })
    )
    .optional(),
  partsCost: z.number().nonnegative().optional(),
  totalCost: z.number().nonnegative().optional()
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const { id } = await params
    const access = await getMaintenanceAccess()
    if (!access.isAdmin && !access.employee) {
      return NextResponse.json({ error: 'لا يوجد ملف موظف مرتبط' }, { status: 403 })
    }

    const body = await request.json()
    const data = schema.parse(body)

    const req = await prisma.maintenanceRequest.findUnique({
      where: { id },
      include: {
        asset: true,
        requestedBy: true
      }
    })
    if (!req) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })

    const actorId = access.employee!.id

    // Only tech assigned or manager/admin
    const isMgrOrTech = access.isAdmin || isMaintenanceManager(access) || isMaintenanceTechnician(access)
    if (!isMgrOrTech) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    // Technician must be assigned
    if (!access.isAdmin && isMaintenanceTechnician(access) && req.assignedToId && req.assignedToId !== actorId && !isMaintenanceManager(access)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const now = new Date()

    const updated = await prisma.$transaction(async (tx) => {
      let partsCost = data.partsCost

      if (data.parts && data.parts.length > 0) {
        const computed = data.parts.reduce((sum, p) => sum + p.quantity * p.unitCost, 0)
        partsCost = partsCost ?? computed

        for (const p of data.parts) {
          await tx.maintenanceRequestPart.create({
            data: {
              requestId: id,
              partName: p.partName,
              quantity: p.quantity,
              unitCost: p.unitCost,
              totalCost: p.quantity * p.unitCost
            }
          })
        }

        await tx.maintenanceHistory.create({
          data: {
            requestId: id,
            action: 'PART_ADDED' as MaintenanceHistoryAction,
            notes: `تمت إضافة قطع غيار (${data.parts.length})`,
            userId: actorId
          }
        })
      }

      const totalCost = data.totalCost ?? (partsCost ?? 0)

      const next = await tx.maintenanceRequest.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          completedAt: now,
          completedById: actorId,
          laborHours: data.laborHours,
          partsCost: partsCost,
          totalCost: totalCost
        }
      })

      await tx.maintenanceHistory.create({
        data: {
          requestId: id,
          action: 'COMPLETED' as MaintenanceHistoryAction,
          notes: data.notes,
          userId: actorId
        }
      })

      // Update asset maintenance dates
      if (req.assetId) {
        const asset = await tx.asset.findUnique({ where: { id: req.assetId } })
        if (asset) {
          const intervalDays = asset.maintenanceInterval
          const nextDate = intervalDays ? new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000) : null

          await tx.asset.update({
            where: { id: asset.id },
            data: {
              lastMaintenanceDate: now,
              nextMaintenanceDate: nextDate
            }
          })

          await tx.maintenanceHistory.create({
            data: {
              assetId: asset.id,
              requestId: id,
              action: 'COMPLETED' as MaintenanceHistoryAction,
              notes: `تم تحديث سجل صيانة الأصل عبر الطلب ${req.requestNumber}`,
              userId: actorId
            }
          })
        }
      }

      // Notify requester
      if (req.requestedBy.userId) {
        await tx.notification.create({
          data: {
            userId: req.requestedBy.userId,
            title: 'تم إنجاز طلب الصيانة',
            message: `تم وضع الطلب ${req.requestNumber} كمكتمل. يمكنك الآن تقييم الخدمة.`,
            type: 'MAINTENANCE_COMPLETED',
            relatedId: id,
            isRead: false
          }
        })
      }

      return next
    })

    return NextResponse.json({ request: updated })
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'بيانات غير صحيحة', details: e.errors }, { status: 400 })
    }
    console.error('POST /api/maintenance/requests/[id]/complete error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء إنهاء الطلب' }, { status: 500 })
  }
}
