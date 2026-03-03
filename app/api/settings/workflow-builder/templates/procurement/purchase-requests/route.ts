import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'

// POST /api/settings/workflow-builder/templates/procurement/purchase-requests
// Creates procurement workflow templates for Purchase Requests (by PurchaseCategory + branch).
export async function POST() {
  const session = await getSession(await cookies())
  if (!session.user || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  const branches = await prisma.branch.findMany({
    where: { status: 'ACTIVE', NOT: { name: { contains: 'QA' } } },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  const purchaseCategories = [
    'STATIONERY',
    'CLEANING',
    'MAINTENANCE',
    'FOOD',
    'EQUIPMENT',
    'TECHNOLOGY',
    'FURNITURE',
    'TEXTBOOKS',
    'UNIFORMS',
    'OTHER',
  ]

  const name = 'المشتريات — طلب شراء'
  const description = 'قالب طلبات الشراء (Gatekeeper الفرع → مراجعة مشتريات → تنفيذ)'

  const created: any[] = []
  const ensured: any[] = []

  await prisma.$transaction(async (tx) => {
    const existing = await tx.workflowDefinition.findFirst({ where: { module: 'PROCUREMENT', name }, select: { id: true } })

    const defId = existing
      ? existing.id
      : (
          await tx.workflowDefinition.create({
            data: {
              module: 'PROCUREMENT',
              name,
              description,
              createdBy: session.user!.id,
              updatedBy: session.user!.id,
            },
            select: { id: true },
          })
        ).id

    if (existing) ensured.push({ workflowId: defId, name })
    else created.push({ workflowId: defId, name })

    // Create a new Draft version (always)
    const latest = await tx.workflowVersion.findFirst({ where: { workflowId: defId }, orderBy: { version: 'desc' }, select: { version: true } })
    const nextVersion = (latest?.version || 0) + 1

    const version = await tx.workflowVersion.create({
      data: { workflowId: defId, version: nextVersion, status: 'DRAFT', createdBy: session.user!.id },
      select: { id: true },
    })

    // Rules: (requestType = PURCHASE_REQUEST) + branchId + conditionsJson.category
    const rules: any[] = []
    for (const b of branches) {
      for (const c of purchaseCategories) {
        rules.push({
          workflowVersionId: version.id,
          requestType: 'PURCHASE_REQUEST',
          branchId: b.id,
          enabled: true,
          conditionsJson: { category: c },
        })
      }
    }
    if (rules.length) await tx.workflowRule.createMany({ data: rules })

    // Steps (v1):
    // 1) Gatekeeper (branch coverage)
    // 2) Procurement Review (SYSTEM_ROLE)
    // 3) Execution (DELEGATE_POOL)
    await tx.workflowStepDefinition.createMany({
      data: [
        {
          workflowVersionId: version.id,
          order: 1,
          titleAr: 'اعتماد مسؤول مشتريات الفرع',
          titleEn: 'Branch Procurement Gatekeeper',
          stepType: 'PROCUREMENT_GATEKEEPER',
          configJson: { module: 'PROCUREMENT', role: 'GATEKEEPER' },
          requireComment: true,
          allowConsult: true,
          allowDelegation: false,
        },
        {
          workflowVersionId: version.id,
          order: 2,
          titleAr: 'مراجعة إدارة المشتريات',
          titleEn: 'Procurement Review',
          stepType: 'SYSTEM_ROLE',
          configJson: { systemRoleName: 'PROCUREMENT_MANAGER' },
          requireComment: true,
          allowConsult: true,
          allowDelegation: true,
        },
        {
          workflowVersionId: version.id,
          order: 3,
          titleAr: 'تنفيذ المشتريات/المخزن',
          titleEn: 'Procurement Execution',
          stepType: 'DELEGATE_POOL',
          configJson: { mode: 'pool', allowAny: true },
          requireComment: true,
          allowConsult: false,
          allowDelegation: true,
        },
      ],
    })

    created.push({ versionId: version.id, version: nextVersion, rules: rules.length, branches: branches.length, categories: purchaseCategories.length })
  })

  return NextResponse.json({ ok: true, created, ensured, branchesCount: branches.length })
}
