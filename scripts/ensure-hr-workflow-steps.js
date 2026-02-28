#!/usr/bin/env node
/*
  Ensure HRRequestTypeWorkflow has the expected number of HRWorkflowStep rows.

  Note: Steps use dynamic routing; the userId stored in HRWorkflowStep is a placeholder.
  We keep it set to an existing ADMIN user to satisfy the schema.

  Rules (V1):
    - Branch-manager-first types (e.g., LEAVE) => 3 steps:
        0: "اعتماد المدير المباشر" (or branch manager)
        1: "مراجعة الموارد البشرية"
        2: "اعتماد نهائي"

    - HR-first types (e.g., SALARY_CERTIFICATE) => 2 steps:
        0: "مراجعة الموارد البشرية"
        1: "اعتماد نهائي"

  Usage:
    node scripts/ensure-hr-workflow-steps.js
*/

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const BRANCH_MANAGER_FIRST_STEP_TYPES = new Set([
  'LEAVE',
  'UNPAID_LEAVE',
  'FLIGHT_BOOKING',
  'VISA_EXIT_REENTRY_SINGLE',
  'VISA_EXIT_REENTRY_MULTI',
  'RESIGNATION'
])

// Educational chain (boys branch only for now)
const EDUCATIONAL_CHAIN_TYPES = new Set([
  'LEAVE',
  'VISA_EXIT_REENTRY_SINGLE',
  'VISA_EXIT_REENTRY_MULTI',
  'RESIGNATION'
])

const HR_FIRST_STEP_TYPES = new Set([
  'TICKET_ALLOWANCE',
  'HOUSING_ALLOWANCE',
  'SALARY_CERTIFICATE'
])

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' }, select: { id: true, username: true } })
  if (!admin) {
    console.error('No ADMIN user found. Cannot seed placeholder step userId.')
    process.exit(1)
  }

  const workflows = await prisma.hRRequestTypeWorkflow.findMany({
    select: { id: true, requestType: true }
  })

  let updated = 0

  for (const wf of workflows) {
    const rt = wf.requestType

    let steps = []

    if (EDUCATIONAL_CHAIN_TYPES.has(rt)) {
      steps = [
        { order: 0, statusName: 'اعتماد مدير المرحلة' },
        { order: 1, statusName: 'اعتماد نائب الرئيس للشؤون التعليمية' },
        { order: 2, statusName: 'مراجعة الموارد البشرية' },
        { order: 3, statusName: 'اعتماد نهائي' },
      ]
    } else if (BRANCH_MANAGER_FIRST_STEP_TYPES.has(rt)) {
      steps = [
        { order: 0, statusName: 'اعتماد المدير المباشر' },
        { order: 1, statusName: 'مراجعة الموارد البشرية' },
        { order: 2, statusName: 'اعتماد نهائي' },
      ]
    } else if (HR_FIRST_STEP_TYPES.has(rt)) {
      steps = [
        { order: 0, statusName: 'مراجعة الموارد البشرية' },
        { order: 1, statusName: 'اعتماد نهائي' },
      ]
    } else {
      // Default to 2 steps as safe fallback
      steps = [
        { order: 0, statusName: 'مراجعة الموارد البشرية' },
        { order: 1, statusName: 'اعتماد نهائي' },
      ]
    }

    await prisma.$transaction(async (tx) => {
      await tx.hRWorkflowStep.deleteMany({ where: { workflowId: wf.id } })
      for (const s of steps) {
        await tx.hRWorkflowStep.create({
          data: {
            workflowId: wf.id,
            order: s.order,
            statusName: s.statusName,
            userId: admin.id,
          }
        })
      }
    })

    updated++
  }

  console.log(`Done. Placeholder admin=${admin.username}. Updated workflows: ${updated}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
