import { prisma } from '@/lib/db'
import { getApproverUserIdsForHRRequestStep } from '@/lib/hrWorkflowRouting'

export type PendingApprovalItem = {
  id: string
  type: 'hr_request' | 'purchase_request' | 'purchase_order'
  title: string
  submittedBy: string
  submittedAt: Date
  status: string
  action: string
  url: string
}

export async function getPendingApprovals(params: {
  userId: string
  userRole: 'ADMIN' | 'HR_EMPLOYEE' | 'USER'
  take?: number
}): Promise<{ approvals: PendingApprovalItem[]; total: number }> {
  const { userId, userRole, take = 20 } = params

  const pendingApprovals: PendingApprovalItem[] = []

  // 1) HR Requests
  if (userRole === 'ADMIN' || userRole === 'HR_EMPLOYEE') {
    const hrRequests = await prisma.hRRequest.findMany({
      where: { status: { in: ['PENDING_REVIEW', 'PENDING_APPROVAL'] } },
      include: { employee: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    for (const req of hrRequests) {
      const workflow = await prisma.hRRequestTypeWorkflow.findFirst({
        where: { requestType: req.type },
        include: { steps: true }
      })

      if (workflow && workflow.steps.length > 0) {
        const currentStep = req.currentWorkflowStep ?? 0
        const workflowStep = workflow.steps.find((s) => s.order === currentStep)

        if (!workflowStep) continue

        const { userIds: allowedUserIds } = await getApproverUserIdsForHRRequestStep({
          requestType: req.type,
          requesterUserId: req.employeeId,
          stepOrder: workflowStep.order
        })

        if (!allowedUserIds.includes(userId)) continue

        let typeLabel: string = req.type
        if (req.type === 'LEAVE') typeLabel = `إجازة ${req.leaveType || ''}`.trim()
        else if (req.type === 'TICKET_ALLOWANCE') typeLabel = 'بدل تذاكر'
        else if (req.type === 'HOUSING_ALLOWANCE') typeLabel = 'بدل سكن'
        else if (req.type === 'FLIGHT_BOOKING') typeLabel = 'حجز طيران'
        else if (req.type === 'SALARY_CERTIFICATE') typeLabel = 'شهادة راتب'
        else if (req.type === 'VISA_EXIT_REENTRY_SINGLE') typeLabel = 'خروج/عودة مفرد'
        else if (req.type === 'VISA_EXIT_REENTRY_MULTI') typeLabel = 'خروج/عودة متعدد'
        else if (req.type === 'RESIGNATION') typeLabel = 'استقالة'

        pendingApprovals.push({
          id: req.id,
          type: 'hr_request',
          title: `${typeLabel} - ${req.employee.displayName}`,
          submittedBy: req.employee.displayName,
          submittedAt: req.createdAt,
          status: req.status,
          action: workflowStep.statusName || 'مراجعة',
          url: `/hr/requests/${req.id}`
        })
      }
    }
  }

  // 2) Purchase Requests
  if (userRole === 'ADMIN') {
    const purchaseRequests = await prisma.purchaseRequest.findMany({
      where: { status: { in: ['PENDING_REVIEW', 'REVIEWED'] } },
      include: { requestedBy: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    for (const req of purchaseRequests) {
      const workflow = await prisma.procurementCategoryWorkflow.findFirst({
        where: { category: req.category },
        include: { steps: true }
      })

      if (workflow && workflow.steps.length > 0) {
        const currentStep = req.currentWorkflowStep ?? 0
        const workflowStep = workflow.steps.find((s) => s.order === currentStep)

        if (workflowStep && workflowStep.userId === userId) {
          pendingApprovals.push({
            id: req.id,
            type: 'purchase_request',
            title: `طلب شراء - ${req.category}`,
            submittedBy: req.requestedBy.displayName,
            submittedAt: req.createdAt,
            status: req.status,
            action: workflowStep.statusName || 'مراجعة',
            url: `/procurement/requests/${req.id}`
          })
        }
      } else {
        // no workflow: show to ADMIN
        pendingApprovals.push({
          id: req.id,
          type: 'purchase_request',
          title: `طلب شراء - ${req.category}`,
          submittedBy: req.requestedBy.displayName,
          submittedAt: req.createdAt,
          status: req.status,
          action: req.status === 'PENDING_REVIEW' ? 'مراجعة' : 'موافقة',
          url: `/procurement/requests/${req.id}`
        })
      }
    }
  }

  // 3) Purchase Orders
  if (userRole === 'ADMIN') {
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: { status: 'PENDING' },
      include: { supplier: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    for (const order of purchaseOrders) {
      pendingApprovals.push({
        id: order.id,
        type: 'purchase_order',
        title: `أمر شراء ${order.orderNumber} - ${order.supplier.name}`,
        submittedBy: 'النظام',
        submittedAt: order.createdAt,
        status: order.status,
        action: 'اعتماد',
        url: `/procurement/purchase-orders/${order.id}`
      })
    }
  }

  pendingApprovals.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())

  return {
    approvals: pendingApprovals.slice(0, take),
    total: pendingApprovals.length
  }
}
