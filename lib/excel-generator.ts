/**
 * Excel Generator Utility
 * 
 * Provides functions to export data to Excel format (.xlsx)
 * Supports: Payroll runs, Employee lists, Analytics data
 */

import * as XLSX from 'xlsx';

// ============================================
// 1. PAYROLL RUN EXPORT
// ============================================

export interface PayrollRunExportData {
  runId: string;
  year: number;
  month: number;
  status: string;
  employees: {
    employeeName: string;
    employeeNumber: string;
    nationalId: string;
    basicSalary: number;
    allowances: number;
    additions: number;
    deductions: number;
    totalSalary: number;
    bankName?: string;
    iban?: string;
  }[];
  summary: {
    totalEmployees: number;
    totalBasicSalary: number;
    totalAllowances: number;
    totalAdditions: number;
    totalDeductions: number;
    totalNetSalary: number;
  };
}

export function generatePayrollRunExcel(data: PayrollRunExportData): Blob {
  const workbook = XLSX.utils.book_new();
  
  // Sheet 1: Employee Payroll Details
  const employeeData = data.employees.map((emp, index) => ({
    '#': index + 1,
    'اسم الموظف': emp.employeeName,
    'رقم الموظف': emp.employeeNumber,
    'رقم الهوية': emp.nationalId,
    'الراتب الأساسي': emp.basicSalary,
    'البدلات': emp.allowances,
    'الإضافات': emp.additions,
    'الخصومات': emp.deductions,
    'صافي الراتب': emp.totalSalary,
    'البنك': emp.bankName || '',
    'الآيبان': emp.iban || ''
  }));
  
  const employeeSheet = XLSX.utils.json_to_sheet(employeeData, {
    header: ['#', 'اسم الموظف', 'رقم الموظف', 'رقم الهوية', 'الراتب الأساسي', 
             'البدلات', 'الإضافات', 'الخصومات', 'صافي الراتب', 'البنك', 'الآيبان']
  });
  
  // Set column widths
  employeeSheet['!cols'] = [
    { wch: 5 },  // #
    { wch: 25 }, // اسم الموظف
    { wch: 12 }, // رقم الموظف
    { wch: 15 }, // رقم الهوية
    { wch: 12 }, // الراتب الأساسي
    { wch: 10 }, // البدلات
    { wch: 10 }, // الإضافات
    { wch: 10 }, // الخصومات
    { wch: 12 }, // صافي الراتب
    { wch: 15 }, // البنك
    { wch: 25 }  // الآيبان
  ];
  
  XLSX.utils.book_append_sheet(workbook, employeeSheet, 'تفاصيل الرواتب');
  
  // Sheet 2: Summary
  const summaryData = [
    { 'البند': 'عدد الموظفين', 'القيمة': data.summary.totalEmployees },
    { 'البند': 'إجمالي الرواتب الأساسية', 'القيمة': data.summary.totalBasicSalary },
    { 'البند': 'إجمالي البدلات', 'القيمة': data.summary.totalAllowances },
    { 'البند': 'إجمالي الإضافات', 'القيمة': data.summary.totalAdditions },
    { 'البند': 'إجمالي الخصومات', 'القيمة': data.summary.totalDeductions },
    { 'البند': 'صافي الرواتب', 'القيمة': data.summary.totalNetSalary }
  ];
  
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 30 }, { wch: 20 }];
  
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'الملخص');
  
  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  const blob = new Blob([excelBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  return blob;
}

// ============================================
// 2. EMPLOYEE LIST EXPORT
// ============================================

export interface EmployeeExportData {
  employees: {
    name: string;
    employeeNumber: string;
    nationalId: string;
    email?: string;
    phone?: string;
    department?: string;
    branch?: string;
    jobTitle?: string;
    status: string;
    hireDate?: Date;
    basicSalary?: number;
  }[];
}

export function generateEmployeeListExcel(data: EmployeeExportData): Blob {
  const workbook = XLSX.utils.book_new();
  
  const employeeData = data.employees.map((emp, index) => ({
    '#': index + 1,
    'الاسم': emp.name,
    'رقم الموظف': emp.employeeNumber,
    'رقم الهوية': emp.nationalId,
    'البريد الإلكتروني': emp.email || '',
    'الهاتف': emp.phone || '',
    'القسم': emp.department || '',
    'الفرع': emp.branch || '',
    'المسمى الوظيفي': emp.jobTitle || '',
    'الحالة': emp.status,
    'تاريخ التعيين': emp.hireDate ? new Date(emp.hireDate).toLocaleDateString('ar-SA') : '',
    'الراتب الأساسي': emp.basicSalary || ''
  }));
  
  const sheet = XLSX.utils.json_to_sheet(employeeData);
  
  sheet['!cols'] = [
    { wch: 5 },  // #
    { wch: 25 }, // الاسم
    { wch: 12 }, // رقم الموظف
    { wch: 15 }, // رقم الهوية
    { wch: 25 }, // البريد
    { wch: 15 }, // الهاتف
    { wch: 20 }, // القسم
    { wch: 20 }, // الفرع
    { wch: 20 }, // المسمى
    { wch: 10 }, // الحالة
    { wch: 15 }, // التاريخ
    { wch: 12 }  // الراتب
  ];
  
  XLSX.utils.book_append_sheet(workbook, sheet, 'قائمة الموظفين');
  
  const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  const blob = new Blob([excelBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  return blob;
}

// ============================================
// 3. ANALYTICS EXPORT
// ============================================

export interface AnalyticsExportData {
  employeeMetrics: {
    total: number;
    active: number;
    onLeave: number;
    resigned: number;
    terminated: number;
  };
  attendanceToday: {
    present: number;
    late: number;
    absent: number;
    excused: number;
    rate: number;
  };
  hrRequests: {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  };
  workflows: {
    active: number;
    escalated: number;
    avgApprovalHours: number;
  };
  byDepartment?: { department: string; count: number }[];
  byBranch?: { branch: string; count: number }[];
}

export function generateAnalyticsExcel(data: AnalyticsExportData): Blob {
  const workbook = XLSX.utils.book_new();
  
  // Sheet 1: Employee Metrics
  const employeeMetrics = [
    { 'المؤشر': 'إجمالي الموظفين', 'القيمة': data.employeeMetrics.total },
    { 'المؤشر': 'نشط', 'القيمة': data.employeeMetrics.active },
    { 'المؤشر': 'في إجازة', 'القيمة': data.employeeMetrics.onLeave },
    { 'المؤشر': 'مستقيل', 'القيمة': data.employeeMetrics.resigned },
    { 'المؤشر': 'منتهي الخدمة', 'القيمة': data.employeeMetrics.terminated }
  ];
  
  const empSheet = XLSX.utils.json_to_sheet(employeeMetrics);
  empSheet['!cols'] = [{ wch: 25 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, empSheet, 'مؤشرات الموظفين');
  
  // Sheet 2: Attendance Today
  const attendanceMetrics = [
    { 'المؤشر': 'حاضر', 'القيمة': data.attendanceToday.present },
    { 'المؤشر': 'متأخر', 'القيمة': data.attendanceToday.late },
    { 'المؤشر': 'غائب', 'القيمة': data.attendanceToday.absent },
    { 'المؤشر': 'بعذر', 'القيمة': data.attendanceToday.excused },
    { 'المؤشر': 'نسبة الحضور %', 'القيمة': data.attendanceToday.rate.toFixed(2) }
  ];
  
  const attSheet = XLSX.utils.json_to_sheet(attendanceMetrics);
  attSheet['!cols'] = [{ wch: 25 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, attSheet, 'الحضور اليوم');
  
  // Sheet 3: HR Requests
  const hrMetrics = [
    { 'المؤشر': 'قيد المراجعة', 'القيمة': data.hrRequests.pending },
    { 'المؤشر': 'موافق عليها', 'القيمة': data.hrRequests.approved },
    { 'المؤشر': 'مرفوضة', 'القيمة': data.hrRequests.rejected },
    { 'المؤشر': 'الإجمالي', 'القيمة': data.hrRequests.total }
  ];
  
  const hrSheet = XLSX.utils.json_to_sheet(hrMetrics);
  hrSheet['!cols'] = [{ wch: 25 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, hrSheet, 'الطلبات');
  
  // Sheet 4: Department Distribution (if available)
  if (data.byDepartment && data.byDepartment.length > 0) {
    const deptData = data.byDepartment.map((d, i) => ({
      '#': i + 1,
      'القسم': d.department,
      'العدد': d.count
    }));
    
    const deptSheet = XLSX.utils.json_to_sheet(deptData);
    deptSheet['!cols'] = [{ wch: 5 }, { wch: 30 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(workbook, deptSheet, 'توزيع الأقسام');
  }
  
  // Sheet 5: Branch Distribution (if available)
  if (data.byBranch && data.byBranch.length > 0) {
    const branchData = data.byBranch.map((b, i) => ({
      '#': i + 1,
      'الفرع': b.branch,
      'العدد': b.count
    }));
    
    const branchSheet = XLSX.utils.json_to_sheet(branchData);
    branchSheet['!cols'] = [{ wch: 5 }, { wch: 30 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(workbook, branchSheet, 'توزيع الفروع');
  }
  
  const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  const blob = new Blob([excelBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  return blob;
}

// ============================================
// 4. ATTENDANCE EXPORT
// ============================================

export interface AttendanceExportData {
  records: {
    date: Date;
    employeeName: string;
    employeeNumber: string;
    status: string;
    checkIn?: Date;
    checkOut?: Date;
    workHours?: number;
    lateMinutes?: number;
  }[];
}

export function generateAttendanceExcel(data: AttendanceExportData): Blob {
  const workbook = XLSX.utils.book_new();
  
  const recordsData = data.records.map((record, index) => ({
    '#': index + 1,
    'التاريخ': new Date(record.date).toLocaleDateString('ar-SA'),
    'اسم الموظف': record.employeeName,
    'رقم الموظف': record.employeeNumber,
    'الحالة': record.status === 'PRESENT' ? 'حاضر' : 
              record.status === 'LATE' ? 'متأخر' :
              record.status === 'ABSENT' ? 'غائب' :
              record.status === 'EXCUSED' ? 'بعذر' : record.status,
    'وقت الدخول': record.checkIn ? new Date(record.checkIn).toLocaleTimeString('ar-SA') : '',
    'وقت الخروج': record.checkOut ? new Date(record.checkOut).toLocaleTimeString('ar-SA') : '',
    'ساعات العمل': record.workHours?.toFixed(2) || '',
    'دقائق التأخير': record.lateMinutes || 0
  }));
  
  const sheet = XLSX.utils.json_to_sheet(recordsData);
  
  sheet['!cols'] = [
    { wch: 5 },  // #
    { wch: 12 }, // التاريخ
    { wch: 25 }, // الموظف
    { wch: 12 }, // رقم
    { wch: 10 }, // الحالة
    { wch: 12 }, // دخول
    { wch: 12 }, // خروج
    { wch: 10 }, // ساعات
    { wch: 10 }  // تأخير
  ];
  
  XLSX.utils.book_append_sheet(workbook, sheet, 'سجل الحضور');
  
  const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  const blob = new Blob([excelBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  return blob;
}

// ============================================
// 5. UTILITY FUNCTIONS
// ============================================

/**
 * Trigger browser download for Excel file
 */
export function downloadExcel(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format filename with date
 */
export function formatExcelFilename(base: string, date?: Date): string {
  const timestamp = date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  return `${base}-${timestamp}.xlsx`;
}
