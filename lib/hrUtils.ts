// HR request utilities

export const getRequestTypeArabic = (type: string): string => {
  const types: { [key: string]: string } = {
    LEAVE: 'إجازة',
    UNPAID_LEAVE: 'إجازة بدون راتب',
    TICKET_ALLOWANCE: 'بدل تذاكر',
    FLIGHT_BOOKING: 'حجز طيران',
    SALARY_CERTIFICATE: 'تعريف بالراتب',
    HOUSING_ALLOWANCE: 'بدل سكن'
  };
  return types[type] || type;
};

export const getRequestTypeIcon = (type: string): string => {
  const icons: { [key: string]: string } = {
    LEAVE: '🌴',
    UNPAID_LEAVE: '🚫💰',
    TICKET_ALLOWANCE: '🎫',
    FLIGHT_BOOKING: '✈️',
    SALARY_CERTIFICATE: '📄',
    HOUSING_ALLOWANCE: '🏠'
  };
  return icons[type] || '📋';
};

export const getStatusConfig = (status: string) => {
  const configs: { [key: string]: { bg: string; text: string; label: string; borderColor: string } } = {
    PENDING_REVIEW: { 
      bg: 'rgba(255, 165, 0, 0.15)', 
      text: '#FFA500', 
      label: 'قيد المراجعة',
      borderColor: '#FFA500'
    },
    RETURNED: { 
      bg: 'rgba(255, 107, 53, 0.15)', 
      text: '#FF6B35', 
      label: 'مرتجع',
      borderColor: '#FF6B35'
    },
    PENDING_APPROVAL: { 
      bg: 'rgba(255, 215, 0, 0.15)', 
      text: '#FFD700', 
      label: 'بانتظار الموافقة',
      borderColor: '#FFD700'
    },
    APPROVED: { 
      bg: 'rgba(16, 185, 129, 0.15)', 
      text: '#10B981', 
      label: 'موافق عليه',
      borderColor: '#10B981'
    },
    REJECTED: { 
      bg: 'rgba(239, 68, 68, 0.15)', 
      text: '#EF4444', 
      label: 'مرفوض',
      borderColor: '#EF4444'
    }
  };

  return configs[status] || { 
    bg: 'rgba(156, 163, 175, 0.15)', 
    text: '#9CA3AF', 
    label: status,
    borderColor: '#9CA3AF'
  };
};

export const getStatusBadge = (status: string, size: 'sm' | 'md' | 'lg' = 'md') => {
  const config = getStatusConfig(status);
  
  const sizes = {
    sm: { fontSize: '11px', padding: '3px 10px' },
    md: { fontSize: '12px', padding: '5px 14px' },
    lg: { fontSize: '14px', padding: '8px 20px' }
  };
  
  const { fontSize, padding } = sizes[size];
  
  return {
    background: config.bg,
    color: config.text,
    border: `1px solid ${config.borderColor}`,
    padding,
    borderRadius: '20px',
    fontSize,
    fontWeight: '600',
    display: 'inline-block'
  };
};

export const getLeaveTypeArabic = (leaveType: string): string => {
  const types: { [key: string]: string } = {
    annual: 'سنوية',
    sick: 'مرضية',
    emergency: 'طارئة',
    unpaid: 'بدون راتب'
  };
  return types[leaveType] || leaveType;
};

export const formatCurrency = (amount: number): string => {
  return `${amount.toLocaleString('en-US')} ريال`;
};

export const getActionLabel = (action: string): string => {
  const actions: { [key: string]: string } = {
    approve: 'موافقة',
    reject: 'رفض',
    return: 'إرجاع',
    submit: 'تقديم',
    edit: 'تعديل'
  };
  return actions[action] || action;
};

export const getActionIcon = (action: string): string => {
  const icons: { [key: string]: string } = {
    created: '✨',
    submitted: '📤',
    reviewed: '👀',
    approved: '✅',
    rejected: '❌',
    returned: '↩️',
    edited: '✏️'
  };
  return icons[action] || '📝';
};
