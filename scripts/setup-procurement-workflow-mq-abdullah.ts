import prisma from '@/lib/prisma'
import { PurchaseCategory } from '@prisma/client'

const MQ_USERNAME = 'mq'
const ABDULLAH_USERNAME = 'abdullahsh'

async function main() {
  const mq = await prisma.user.findUnique({ where: { username: MQ_USERNAME }, select: { id: true, username: true, displayName: true } })
  const abd = await prisma.user.findUnique({ where: { username: ABDULLAH_USERNAME }, select: { id: true, username: true, displayName: true } })

  if (!mq) throw new Error(`User not found: ${MQ_USERNAME}`)
  if (!abd) throw new Error(`User not found: ${ABDULLAH_USERNAME}`)

  const categories = Object.values(PurchaseCategory)

  const results: any[] = []

  for (const category of categories) {
    const workflow = await prisma.procurementCategoryWorkflow.upsert({
      where: { category },
      update: {
        reviewerUserId: mq.id,
        approverUserId: abd.id,
        requireReview: true,
        requireApproval: true,
        autoApprove: false,
        updatedBy: mq.id,
      },
      create: {
        category,
        reviewerUserId: mq.id,
        approverUserId: abd.id,
        requireReview: true,
        requireApproval: true,
        autoApprove: false,
        updatedBy: mq.id,
      },
      select: { id: true, category: true },
    })

    await prisma.$transaction([
      prisma.procurementWorkflowStep.deleteMany({ where: { workflowId: workflow.id } }),
      prisma.procurementWorkflowStep.createMany({
        data: [
          {
            workflowId: workflow.id,
            order: 0,
            userId: mq.id,
            statusName: 'مراجعة مشتريات (mq)',
          },
          {
            workflowId: workflow.id,
            order: 1,
            userId: abd.id,
            statusName: 'تنفيذ الشراء والتسليم (abdullahsh)',
          },
        ],
      }),
    ])

    results.push({ category, workflowId: workflow.id })
  }

  console.log(JSON.stringify({ ok: true, mq, abd, categories: categories.length, results }, null, 2))
}

main()
  .catch((e) => {
    console.error('setup-procurement-workflow-mq-abdullah failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
