export type ApprovalAudience = {
  canApprovePurchaseRequests: boolean
  canApproveSupplierRequests: boolean
}

// Centralized policy: easy to change later.
// Later we can move these to DB settings/UI without touching the rest of the code.
export function approvalAudienceForRole(role: string): ApprovalAudience {
  // ADMIN always can.
  if (role === 'ADMIN') {
    return { canApprovePurchaseRequests: true, canApproveSupplierRequests: true }
  }

  // Requested by user:
  // - SUPPORT_SERVICES_MANAGER approves procurement + supplier onboarding.
  if (role === 'SUPPORT_SERVICES_MANAGER') {
    return { canApprovePurchaseRequests: true, canApproveSupplierRequests: true }
  }

  // Default: no approvals.
  return { canApprovePurchaseRequests: false, canApproveSupplierRequests: false }
}

export function canCreateSupplierRequest(role: string): boolean {
  return role === 'PROCUREMENT_OFFICER' || role === 'ADMIN' || role === 'HR_EMPLOYEE'
}

export function canDirectCreateSupplier(role: string): boolean {
  // Keep direct creation limited. (Procurement officer must submit a request.)
  return role === 'ADMIN' || role === 'HR_EMPLOYEE'
}
