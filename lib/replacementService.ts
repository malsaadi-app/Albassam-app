import { prisma } from '@/lib/db'

function assert(cond: any, messageAr: string): asserts cond {
  if (!cond) {
    const err = new Error(messageAr)
    ;(err as any).statusCode = 400
    throw err
  }
}

function addMonths(date: Date, months: number) {
  const d = new Date(date)
  const day = d.getDate()
  d.setMonth(d.getMonth() + months)

  // Handle month overflow (e.g., Jan 31 -> Mar 3). Clamp to last day of previous month.
  if (d.getDate() !== day) {
    d.setDate(0)
  }
  return d
}

async function createInAppNotification(db: any, userId: string, title: string, message: string, type: string, relatedId?: string) {
  try {
    await db.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        relatedId: relatedId ?? null,
        isRead: false,
      },
    })
  } catch (e) {
    console.error('Replacement: failed to create in-app notification', e)
  }
}

async function getHrAndAdminUserIds() {
  const users = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'HR_EMPLOYEE'] } },
    select: { id: true },
  })
  return users.map((u) => u.id)
}

async function generateRequestNumber(now = new Date()) {
  const year = now.getFullYear()
  const prefix = `REP-${year}-`

  const last = await prisma.replacementRequest.findFirst({
    where: { requestNumber: { startsWith: prefix } },
    orderBy: { createdAt: 'desc' },
    select: { requestNumber: true },
  })

  let next = 1
  if (last?.requestNumber) {
    const m = last.requestNumber.match(/REP-\d{4}-(\d+)/)
    if (m?.[1]) {
      const n = Number(m[1])
      if (Number.isFinite(n) && n > 0) next = n + 1
    }
  }

  return `${prefix}${String(next).padStart(3, '0')}`
}

function atHour(date: Date, hour = 8) {
  const d = new Date(date)
  d.setHours(hour, 0, 0, 0)
  return d
}

function daysBefore(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() - days)
  return d
}

export type CreateReplacementInput = {
  positionId: number
  newEmployeeId: string
  probationStartDate?: Date
  probationMonths: number
  replacementReason: string
  expectedImprovement?: string | null
  requestedByUserId: string
}

export async function createReplacementRequest(input: CreateReplacementInput) {
  assert(Number.isFinite(input.positionId), 'معرّف الوظيفة غير صحيح')
  assert(input.newEmployeeId && input.newEmployeeId.trim(), 'يجب اختيار الموظف الجديد')
  assert(input.probationMonths >= 1 && input.probationMonths <= 3, 'مدة التجربة يجب أن تكون بين 1 و 3 أشهر')
  assert(input.replacementReason && input.replacementReason.trim().length >= 3, 'سبب الإحلال مطلوب')

  const start = input.probationStartDate ? new Date(input.probationStartDate) : new Date()
  const end = addMonths(start, input.probationMonths)

  return prisma.$transaction(async (tx) => {
    const position = await tx.organizationalPosition.findUnique({
      where: { id: input.positionId },
      select: { id: true, status: true, currentEmployeeId: true, inReplacement: true, title: true, code: true, department: true },
    })

    assert(position, 'الوظيفة غير موجودة')
    assert(position.status === 'FILLED' && position.currentEmployeeId, 'لا يمكن بدء إحلال لوظيفة شاغرة')
    assert(!position.inReplacement, 'هذه الوظيفة لديها إحلال نشط بالفعل')
    assert(position.currentEmployeeId !== input.newEmployeeId, 'الموظف الجديد يجب أن يكون مختلفاً عن الموظف الحالي')

    const requestNumber = await generateRequestNumber(new Date())

    const replacement = await tx.replacementRequest.create({
      data: {
        requestNumber,
        positionId: position.id,
        currentEmployeeId: position.currentEmployeeId!,
        newEmployeeId: input.newEmployeeId,
        probationStartDate: start,
        probationEndDate: end,
        probationMonths: input.probationMonths,
        status: 'ACTIVE',
        replacementReason: input.replacementReason.trim(),
        expectedImprovement: input.expectedImprovement?.trim() || null,
        requestedByUserId: input.requestedByUserId,
      },
    })

    await tx.organizationalPosition.update({
      where: { id: position.id },
      data: {
        inReplacement: true,
        activeReplacementId: replacement.id,
      },
    })

    await tx.replacementTimeline.create({
      data: {
        replacementId: replacement.id,
        eventType: 'STARTED',
        eventDescription: `تم بدء إحلال على الوظيفة ${position.title} (${position.code})`,
        performedByUserId: input.requestedByUserId,
        metadataJson: JSON.stringify({ positionId: position.id, probationMonths: input.probationMonths }),
      },
    })

    // Schedule reminders
    const weekBefore = atHour(daysBefore(end, 7), 8)
    const dayBefore = atHour(daysBefore(end, 1), 8)

    const hrAndAdmins = await tx.user.findMany({
      where: { role: { in: ['ADMIN', 'HR_EMPLOYEE'] } },
      select: { id: true },
    })

    // also notify both employees if they have user accounts
    const [currentEmployee, newEmployee] = await Promise.all([
      tx.employee.findUnique({ where: { id: position.currentEmployeeId! }, select: { userId: true, fullNameAr: true } }),
      tx.employee.findUnique({ where: { id: input.newEmployeeId }, select: { userId: true, fullNameAr: true } }),
    ])

    const startedRecipients = new Set<string>()
    startedRecipients.add(input.requestedByUserId)
    hrAndAdmins.forEach((u) => startedRecipients.add(u.id))
    if (currentEmployee?.userId) startedRecipients.add(currentEmployee.userId)
    if (newEmployee?.userId) startedRecipients.add(newEmployee.userId)

    // Create scheduled ReplacementNotification records for HR/admin/requester only
    const scheduleRecipients = new Set<string>()
    scheduleRecipients.add(input.requestedByUserId)
    hrAndAdmins.forEach((u) => scheduleRecipients.add(u.id))

    await tx.replacementNotification.createMany({
      data: Array.from(scheduleRecipients).flatMap((uid) => [
        {
          replacementId: replacement.id,
          notificationType: 'WEEK_BEFORE_END',
          scheduledFor: weekBefore,
          recipientUserId: uid,
          message: `تبقى أسبوع على نهاية فترة الإحلال للوظيفة ${position.title} (${position.code}). الرجاء تجهيز التقييم.`,
        },
        {
          replacementId: replacement.id,
          notificationType: 'DAY_BEFORE_END',
          scheduledFor: dayBefore,
          recipientUserId: uid,
          message: `تبقى يوم واحد على نهاية فترة الإحلال للوظيفة ${position.title} (${position.code}). الرجاء إكمال التقييم.`,
        },
      ]),
    })

    // Immediate in-app notifications
    for (const uid of startedRecipients) {
      await createInAppNotification(
        tx,
        uid,
        'بدء إحلال وظيفي',
        `تم بدء إحلال للوظيفة ${position.title} (${position.code}) لمدة ${input.probationMonths} شهر.`,
        'replacement_started',
        String(replacement.id)
      )
    }

    return replacement
  })
}

export async function submitReplacementReport(input: {
  replacementId: number
  reportedByUserId: string
  reportPeriod: string
  currentEmployeeScore?: number | null
  currentEmployeeNotes?: string | null
  newEmployeeScore?: number | null
  newEmployeeNotes?: string | null
  comparisonNotes?: string | null
  recommendation?: string | null
}) {
  return prisma.$transaction(async (tx) => {
    const replacement = await tx.replacementRequest.findUnique({
      where: { id: input.replacementId },
      include: { position: { select: { title: true, code: true } } },
    })
    assert(replacement, 'طلب الإحلال غير موجود')

    const report = await tx.replacementPerformanceReport.create({
      data: {
        replacementId: replacement.id,
        reportPeriod: input.reportPeriod,
        currentEmployeeScore: input.currentEmployeeScore ?? null,
        currentEmployeeNotes: input.currentEmployeeNotes?.trim() || null,
        newEmployeeScore: input.newEmployeeScore ?? null,
        newEmployeeNotes: input.newEmployeeNotes?.trim() || null,
        comparisonNotes: input.comparisonNotes?.trim() || null,
        recommendation: input.recommendation ?? null,
        reportedByUserId: input.reportedByUserId,
      },
    })

    await tx.replacementTimeline.create({
      data: {
        replacementId: replacement.id,
        eventType: 'REPORT_SUBMITTED',
        eventDescription: `تم إرسال تقرير أداء (${input.reportPeriod})`,
        performedByUserId: input.reportedByUserId,
        metadataJson: JSON.stringify({ reportId: report.id, recommendation: input.recommendation ?? null }),
      },
    })

    return report
  })
}

export async function submitReplacementEvaluation(input: {
  replacementId: number
  evaluatedByUserId: string
  evaluationScore: number
  evaluationNotes?: string | null
}) {
  assert(input.evaluationScore >= 1 && input.evaluationScore <= 10, 'درجة التقييم يجب أن تكون بين 1 و 10')

  return prisma.$transaction(async (tx) => {
    const replacement = await tx.replacementRequest.findUnique({
      where: { id: input.replacementId },
      include: { position: { select: { title: true, code: true } } },
    })
    assert(replacement, 'طلب الإحلال غير موجود')
    assert(replacement.status === 'ACTIVE' || replacement.status === 'EXTENDED', 'لا يمكن تقييم طلب غير نشط')

    const updated = await tx.replacementRequest.update({
      where: { id: replacement.id },
      data: {
        evaluationScore: input.evaluationScore,
        evaluationNotes: input.evaluationNotes?.trim() || null,
        evaluatedByUserId: input.evaluatedByUserId,
        evaluatedAt: new Date(),
      },
    })

    await tx.replacementTimeline.create({
      data: {
        replacementId: replacement.id,
        eventType: 'EVALUATION_ADDED',
        eventDescription: `تم إضافة تقييم نهائي (درجة: ${input.evaluationScore}/10)`,
        performedByUserId: input.evaluatedByUserId,
      },
    })

    const hrAndAdmins = await getHrAndAdminUserIds()
    for (const uid of hrAndAdmins) {
      await createInAppNotification(
        tx,
        uid,
        'تم إرسال تقييم الإحلال',
        `تم إرسال تقييم الإحلال للوظيفة ${replacement.position.title} (${replacement.position.code}). قرار نهائي مطلوب.`,
        'replacement_evaluation_submitted',
        String(replacement.id)
      )
    }

    return updated
  })
}

export async function decideReplacement(input: {
  replacementId: number
  decisionByUserId: string
  decision: 'CONFIRM_NEW' | 'KEEP_OLD' | 'EXTEND_PROBATION'
  decisionReason: string
  extendMonths?: number
}) {
  assert(input.decisionReason && input.decisionReason.trim().length >= 2, 'سبب القرار مطلوب')

  return prisma.$transaction(async (tx) => {
    const replacement = await tx.replacementRequest.findUnique({
      where: { id: input.replacementId },
      include: {
        position: { select: { id: true, title: true, code: true, currentEmployeeId: true } },
        currentEmployee: { select: { id: true, fullNameAr: true, userId: true } },
        newEmployee: { select: { id: true, fullNameAr: true, userId: true } },
      },
    })

    assert(replacement, 'طلب الإحلال غير موجود')
    assert(replacement.status === 'ACTIVE' || replacement.status === 'EXTENDED', 'لا يمكن اتخاذ قرار لطلب غير نشط')

    const now = new Date()

    if (input.decision === 'EXTEND_PROBATION') {
      const m = input.extendMonths ?? 1
      assert(m >= 1 && m <= 2, 'التمديد يجب أن يكون بين 1 و 2 شهر')
      const newEnd = addMonths(replacement.probationEndDate, m)

      const updated = await tx.replacementRequest.update({
        where: { id: replacement.id },
        data: {
          status: 'EXTENDED',
          decision: 'EXTEND_PROBATION',
          decisionReason: input.decisionReason.trim(),
          decisionByUserId: input.decisionByUserId,
          decisionAt: now,
          probationEndDate: newEnd,
          probationMonths: replacement.probationMonths + m,
        },
      })

      // reschedule notifications
      await tx.replacementNotification.deleteMany({ where: { replacementId: replacement.id, sent: false } })

      const scheduleRecipients = new Set<string>()
      scheduleRecipients.add(replacement.requestedByUserId)
      const hrAndAdmins = await tx.user.findMany({ where: { role: { in: ['ADMIN', 'HR_EMPLOYEE'] } }, select: { id: true } })
      hrAndAdmins.forEach((u) => scheduleRecipients.add(u.id))

      const weekBefore = atHour(daysBefore(newEnd, 7), 8)
      const dayBefore = atHour(daysBefore(newEnd, 1), 8)

      await tx.replacementNotification.createMany({
        data: Array.from(scheduleRecipients).flatMap((uid) => [
          {
            replacementId: replacement.id,
            notificationType: 'WEEK_BEFORE_END',
            scheduledFor: weekBefore,
            recipientUserId: uid,
            message: `تم تمديد فترة الإحلال. تبقى أسبوع على النهاية الجديدة للوظيفة ${replacement.position.title} (${replacement.position.code}).`,
          },
          {
            replacementId: replacement.id,
            notificationType: 'DAY_BEFORE_END',
            scheduledFor: dayBefore,
            recipientUserId: uid,
            message: `تم تمديد فترة الإحلال. تبقى يوم واحد على النهاية الجديدة للوظيفة ${replacement.position.title} (${replacement.position.code}).`,
          },
        ]),
      })

      await tx.replacementTimeline.create({
        data: {
          replacementId: replacement.id,
          eventType: 'PROBATION_EXTENDED',
          eventDescription: `تم تمديد فترة التجربة ${m} شهر`,
          performedByUserId: input.decisionByUserId,
          metadataJson: JSON.stringify({ extendMonths: m, newEndDate: newEnd.toISOString() }),
        },
      })

      const recipients = new Set<string>()
      if (replacement.currentEmployee.userId) recipients.add(replacement.currentEmployee.userId)
      if (replacement.newEmployee.userId) recipients.add(replacement.newEmployee.userId)
      recipients.add(replacement.requestedByUserId)
      hrAndAdmins.forEach((u) => recipients.add(u.id))

      for (const uid of recipients) {
        await createInAppNotification(
          tx,
          uid,
          'تم تمديد الإحلال',
          `تم تمديد فترة الإحلال للوظيفة ${replacement.position.title} (${replacement.position.code}) بمقدار ${m} شهر.`,
          'replacement_extended',
          String(replacement.id)
        )
      }

      return updated
    }

    // Decisions that complete the workflow
    const status = input.decision === 'CONFIRM_NEW' ? 'COMPLETED_SUCCESS' : 'COMPLETED_FAILED'

    const updated = await tx.replacementRequest.update({
      where: { id: replacement.id },
      data: {
        status,
        decision: input.decision,
        decisionReason: input.decisionReason.trim(),
        decisionByUserId: input.decisionByUserId,
        decisionAt: now,
      },
    })

    await tx.organizationalPosition.update({
      where: { id: replacement.position.id },
      data: {
        inReplacement: false,
        activeReplacementId: null,
        currentEmployeeId: input.decision === 'CONFIRM_NEW' ? replacement.newEmployeeId : replacement.currentEmployeeId,
        status: 'FILLED',
      },
    })

    // Update employee statuses (best-effort)
    if (input.decision === 'CONFIRM_NEW') {
      await tx.employee.update({
        where: { id: replacement.currentEmployeeId },
        data: {
          status: 'TERMINATED',
          contractEndDate: replacement.probationEndDate,
        },
      }).catch(() => null)
    } else {
      await tx.employee.update({
        where: { id: replacement.newEmployeeId },
        data: {
          status: 'TERMINATED',
          contractEndDate: replacement.probationEndDate,
        },
      }).catch(() => null)
    }

    // Position history
    await tx.positionHistory.create({
      data: {
        positionId: replacement.position.id,
        action: 'FILLED',
        employeeId: input.decision === 'CONFIRM_NEW' ? replacement.newEmployeeId : replacement.currentEmployeeId,
        performedBy: (await tx.employee.findUnique({ where: { userId: input.decisionByUserId }, select: { id: true } }))?.id || replacement.currentEmployeeId,
        notes: `قرار الإحلال: ${input.decision}`,
      },
    }).catch(() => null)

    await tx.replacementTimeline.create({
      data: {
        replacementId: replacement.id,
        eventType: 'DECISION_MADE',
        eventDescription: `تم اتخاذ القرار النهائي: ${input.decision}`,
        performedByUserId: input.decisionByUserId,
        metadataJson: JSON.stringify({ decision: input.decision }),
      },
    })

    await tx.replacementTimeline.create({
      data: {
        replacementId: replacement.id,
        eventType: 'COMPLETED',
        eventDescription: `تم إغلاق طلب الإحلال (${status})`,
        performedByUserId: input.decisionByUserId,
      },
    })

    const hrAndAdmins = await tx.user.findMany({ where: { role: { in: ['ADMIN', 'HR_EMPLOYEE'] } }, select: { id: true } })

    const recipients = new Set<string>()
    recipients.add(replacement.requestedByUserId)
    hrAndAdmins.forEach((u) => recipients.add(u.id))
    if (replacement.currentEmployee.userId) recipients.add(replacement.currentEmployee.userId)
    if (replacement.newEmployee.userId) recipients.add(replacement.newEmployee.userId)

    for (const uid of recipients) {
      await createInAppNotification(
        tx,
        uid,
        'قرار الإحلال',
        `تم اتخاذ قرار الإحلال للوظيفة ${replacement.position.title} (${replacement.position.code}): ${input.decision === 'CONFIRM_NEW' ? 'تثبيت الموظف الجديد' : 'الإبقاء على الموظف الحالي'}.`,
        'replacement_decision_made',
        String(replacement.id)
      )
    }

    // mark unsent scheduled notifications as sent to avoid later delivery
    await tx.replacementNotification.updateMany({
      where: { replacementId: replacement.id, sent: false },
      data: { sent: true, sentAt: now },
    })

    return updated
  })
}

export async function cancelReplacement(input: { replacementId: number; cancelledByUserId: string; reason?: string }) {
  return prisma.$transaction(async (tx) => {
    const replacement = await tx.replacementRequest.findUnique({
      where: { id: input.replacementId },
      include: { position: { select: { id: true, title: true, code: true } } },
    })
    assert(replacement, 'طلب الإحلال غير موجود')

    const now = new Date()

    const updated = await tx.replacementRequest.update({
      where: { id: replacement.id },
      data: {
        status: 'CANCELLED',
        decision: null,
        decisionReason: input.reason?.trim() || null,
        decisionByUserId: input.cancelledByUserId,
        decisionAt: now,
      },
    })

    await tx.organizationalPosition.update({
      where: { id: replacement.positionId },
      data: { inReplacement: false, activeReplacementId: null },
    })

    await tx.replacementTimeline.create({
      data: {
        replacementId: replacement.id,
        eventType: 'CANCELLED',
        eventDescription: `تم إلغاء طلب الإحلال${input.reason ? `: ${input.reason}` : ''}`,
        performedByUserId: input.cancelledByUserId,
      },
    })

    await tx.replacementNotification.updateMany({
      where: { replacementId: replacement.id, sent: false },
      data: { sent: true, sentAt: now },
    })

    return updated
  })
}

export async function runReplacementNotificationsCron(now = new Date()) {
  // 1) Ensure scheduled reminders exist for active replacements (best-effort)
  const active = await prisma.replacementRequest.findMany({
    where: { status: { in: ['ACTIVE', 'EXTENDED'] } },
    include: { position: { select: { title: true, code: true } } },
  })

  const hrAndAdmins = await getHrAndAdminUserIds()

  for (const r of active) {
    const scheduleRecipients = new Set<string>()
    scheduleRecipients.add(r.requestedByUserId)
    hrAndAdmins.forEach((id) => scheduleRecipients.add(id))

    const weekBefore = atHour(daysBefore(r.probationEndDate, 7), 8)
    const dayBefore = atHour(daysBefore(r.probationEndDate, 1), 8)

    // Only create missing reminders per recipient
    for (const uid of scheduleRecipients) {
      const existing = await prisma.replacementNotification.findMany({
        where: {
          replacementId: r.id,
          recipientUserId: uid,
          notificationType: { in: ['WEEK_BEFORE_END', 'DAY_BEFORE_END'] },
          sent: false,
        },
        select: { notificationType: true },
      })

      const hasWeek = existing.some((x) => x.notificationType === 'WEEK_BEFORE_END')
      const hasDay = existing.some((x) => x.notificationType === 'DAY_BEFORE_END')

      const data: any[] = []
      if (!hasWeek) {
        data.push({
          replacementId: r.id,
          notificationType: 'WEEK_BEFORE_END',
          scheduledFor: weekBefore,
          recipientUserId: uid,
          message: `تبقى أسبوع على نهاية فترة الإحلال للوظيفة ${r.position.title} (${r.position.code}).`,
        })
      }
      if (!hasDay) {
        data.push({
          replacementId: r.id,
          notificationType: 'DAY_BEFORE_END',
          scheduledFor: dayBefore,
          recipientUserId: uid,
          message: `تبقى يوم واحد على نهاية فترة الإحلال للوظيفة ${r.position.title} (${r.position.code}).`,
        })
      }

      if (data.length) {
        await prisma.replacementNotification.createMany({ data })
      }
    }

    // If probation ended and no decision, create urgent notification for HR/admin
    if (r.probationEndDate.getTime() < now.getTime() && !r.decision) {
      for (const uid of hrAndAdmins) {
        const existsUrgent = await prisma.replacementNotification.findFirst({
          where: { replacementId: r.id, recipientUserId: uid, notificationType: 'DECISION_DUE', sent: false },
        })
        if (existsUrgent) continue
        await prisma.replacementNotification.create({
          data: {
            replacementId: r.id,
            notificationType: 'DECISION_DUE',
            scheduledFor: now,
            recipientUserId: uid,
            message: `عاجل: قرار الإحلال متأخر للوظيفة ${r.position.title} (${r.position.code}).`,
          },
        })
      }
    }
  }

  // 2) Send due notifications
  const due = await prisma.replacementNotification.findMany({
    where: { sent: false, scheduledFor: { lte: now } },
    orderBy: { scheduledFor: 'asc' },
    take: 200,
  })

  let sentCount = 0
  for (const n of due) {
    await createInAppNotification(
      prisma,
      n.recipientUserId,
      'تنبيه إحلال وظيفي',
      n.message,
      'replacement_reminder',
      String(n.replacementId)
    )

    await prisma.replacementNotification.update({
      where: { id: n.id },
      data: { sent: true, sentAt: now },
    })
    sentCount++
  }

  return { dueCount: due.length, sentCount }
}
