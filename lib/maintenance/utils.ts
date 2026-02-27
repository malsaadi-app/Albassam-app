import { MaintenancePriority, MaintenanceStatus, MaintenanceType } from '@prisma/client'

export function pad4(n: number) {
  return String(n).padStart(4, '0')
}

export function requestNumberFor(year: number, seq: number) {
  return `REQ-${year}-${pad4(seq)}`
}

export function assetNumberFor(year: number, seq: number) {
  return `AST-${year}-${pad4(seq)}`
}

export function maintenanceTypeLabel(t: MaintenanceType) {
  return t === 'BUILDING' ? 'مباني' : 'أجهزة/تقنيات'
}

export function maintenancePriorityLabel(p: MaintenancePriority) {
  switch (p) {
    case 'EMERGENCY':
      return 'طارئ'
    case 'HIGH':
      return 'عالي'
    default:
      return 'عادي'
  }
}

export function maintenanceStatusLabel(s: MaintenanceStatus) {
  switch (s) {
    case 'SUBMITTED':
      return 'تم الإرسال'
    case 'UNDER_REVIEW':
      return 'قيد المراجعة'
    case 'ASSIGNED':
      return 'تم التعيين'
    case 'IN_PROGRESS':
      return 'قيد التنفيذ'
    case 'COMPLETED_PENDING_CONFIRMATION':
      return 'منتهي بانتظار التأكيد'
    case 'COMPLETED':
      return 'مكتمل'
    case 'CANCELLED':
      return 'ملغي'
    case 'REJECTED':
      return 'مرفوض'
    case 'ON_HOLD':
      return 'مؤجل'
    case 'REOPENED':
      return 'أعيد فتحه'
    default:
      return s
  }
}

export function statusColor(s: MaintenanceStatus) {
  switch (s) {
    case 'COMPLETED':
      return { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.35)', text: '#166534' }
    case 'IN_PROGRESS':
      return { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.35)', text: '#1d4ed8' }
    case 'ASSIGNED':
    case 'UNDER_REVIEW':
      return { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)', text: '#92400e' }
    case 'ON_HOLD':
      return { bg: 'rgba(148,163,184,0.2)', border: 'rgba(148,163,184,0.5)', text: '#334155' }
    case 'REJECTED':
    case 'CANCELLED':
      return { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)', text: '#991b1b' }
    default:
      return { bg: 'rgba(0,0,0,0.06)', border: 'rgba(0,0,0,0.12)', text: '#111827' }
  }
}
