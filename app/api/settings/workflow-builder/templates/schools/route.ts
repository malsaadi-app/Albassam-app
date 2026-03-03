import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'

// POST /api/settings/workflow-builder/templates/schools
// Creates (or ensures) initial HR School workflow templates for the 3 real school branches.
export async function POST() {
  const session = await getSession(await cookies())
  if (!session.user || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  // Resolve HR Manager (Mohammed)
  const hrManager = await prisma.user.findFirst({
    where: { username: 'mohammed' },
    select: { id: true, username: true, displayName: true },
  })
  if (!hrManager) return NextResponse.json({ error: 'HR Manager user (mohammed) not found' }, { status: 400 })

  const branches = await prisma.branch.findMany({
    where: {
      type: 'SCHOOL',
      status: 'ACTIVE',
      NOT: { name: { contains: 'QA' } },
    },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  const templates: Array<{ requestType: any; name: string; description: string }> = [
    { requestType: 'LEAVE', name: 'الموارد البشرية — طلب إجازة', description: 'قالب مدارس (مرحلة → VP → HR)' },
    { requestType: 'VISA_EXIT_REENTRY_SINGLE', name: 'الموارد البشرية — خروج وعودة (مفرد)', description: 'قالب مدارس (مرحلة → VP → HR)' },
    { requestType: 'VISA_EXIT_REENTRY_MULTI', name: 'الموارد البشرية — خروج وعودة (متعدد)', description: 'قالب مدارس (مرحلة → VP → HR)' },
    { requestType: 'RESIGNATION', name: 'الموارد البشرية — استقالة', description: 'قالب مدارس (مرحلة → VP → HR)' },
  ]

  const created: any[] = []
  const ensured: any[] = []

  await prisma.$transaction(async (tx) => {
    for (const t of templates) {
      const existing = await tx.workflowDefinition.findFirst({
        where: { module: 'HR', name: t.name },
        select: { id: true },
      })

      if (!existing) {
        const def = await tx.workflowDefinition.create({
          data: {
            module: 'HR',
            name: t.name,
            description: t.description,
            createdBy: session.user!.id,
            updatedBy: session.user!.id,
          },
          select: { id: true },
        })

        const version = await tx.workflowVersion.create({
          data: {
            workflowId: def.id,
            version: 1,
            status: 'DRAFT',
            createdBy: session.user!.id,
          },
          select: { id: true },
        })

        // Rules: one per active school branch
        if (branches.length) {
          await tx.workflowRule.createMany({
            data: branches.map((b) => ({
              workflowVersionId: version.id,
              requestType: t.requestType,
              branchId: b.id,
              enabled: true,
            })),
          })
        }

        // Steps (v1)
        await tx.workflowStepDefinition.createMany({
          data: [
            {
              workflowVersionId: version.id,
              order: 1,
              titleAr: 'اعتماد مسؤول المرحلة',
              titleEn: 'Stage Head Approval',
              stepType: 'STAGE_HEAD',
              configJson: { resolver: 'ORG_STRUCTURE_STAGE_HEAD' },
              requireComment: true,
              allowConsult: true,
              allowDelegation: false,
            },
            {
              workflowVersionId: version.id,
              order: 2,
              titleAr: 'اعتماد نائب الرئيس للشؤون التعليمية',
              titleEn: 'VP Educational Approval',
              stepType: 'VP_EDUCATIONAL',
              configJson: { resolver: 'EDUCATIONAL_ROUTING_SETTINGS' },
              requireComment: true,
              allowConsult: true,
              allowDelegation: false,
            },
            {
              workflowVersionId: version.id,
              order: 3,
              titleAr: 'مراجعة مدير الموارد البشرية',
              titleEn: 'HR Manager Review',
              stepType: 'USER',
              configJson: { userId: hrManager.id },
              requireComment: true,
              allowConsult: true,
              allowDelegation: true,
            },
            {
              workflowVersionId: version.id,
              order: 4,
              titleAr: 'تنفيذ الموارد البشرية',
              titleEn: 'HR Execution',
              stepType: 'DELEGATE_POOL',
              configJson: { mode: 'pool', allowAny: true },
              requireComment: true,
              allowConsult: false,
              allowDelegation: true,
            },
          ],
        })

        created.push({ workflowId: def.id, versionId: version.id, name: t.name })
      } else {
        ensured.push({ workflowId: existing.id, name: t.name })
      }
    }
  })

  return NextResponse.json({ ok: true, branchesCount: branches.length, created, ensured })
}
