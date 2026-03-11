import * as XLSX from 'xlsx';

/**
 * Analytics Data Export to Excel
 */
export interface AnalyticsExportData {
  employees: {
    total: number;
    active: number;
    onLeave: number;
    resigned: number;
    terminated: number;
    byBranch: Array<{ branch: string; count: number }>;
    byDepartment: Array<{ department: string; count: number }>;
  };
  attendance: {
    present: number;
    late: number;
    absent: number;
    excused: number;
    attendanceRate: number;
  };
  hr: {
    pendingRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
    totalRequests: number;
  };
  workflows: {
    activeApprovals: number;
    escalatedApprovals: number;
    averageApprovalTime: number;
  };
}

export function exportAnalyticsToExcel(data: AnalyticsExportData) {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Employee Summary
  const employeeSummary = [
    ['إحصائيات الموظفين', ''],
    ['الوصف', 'العدد'],
    ['إجمالي الموظفين', data.employees.total],
    ['نشط', data.employees.active],
    ['إجازة', data.employees.onLeave],
    ['مستقيل', data.employees.resigned],
    ['منتهي', data.employees.terminated],
    [],
    ['التوزيع حسب الفرع', ''],
    ['الفرع', 'العدد'],
    ...data.employees.byBranch.map(b => [b.branch, b.count]),
    [],
    ['التوزيع حسب القسم', ''],
    ['القسم', 'العدد'],
    ...data.employees.byDepartment.map(d => [d.department, d.count])
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(employeeSummary);
  ws1['!cols'] = [{ wch: 30 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, ws1, 'الموظفون');

  // Sheet 2: Attendance
  const attendanceData = [
    ['إحصائيات الحضور (اليوم)', ''],
    ['الحالة', 'العدد'],
    ['حاضر', data.attendance.present],
    ['متأخر', data.attendance.late],
    ['غائب', data.attendance.absent],
    ['معذور', data.attendance.excused],
    [],
    ['نسبة الحضور', `${data.attendance.attendanceRate.toFixed(2)}%`]
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(attendanceData);
  ws2['!cols'] = [{ wch: 30 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, ws2, 'الحضور');

  // Sheet 3: HR Requests
  const hrData = [
    ['طلبات الموارد البشرية', ''],
    ['الحالة', 'العدد'],
    ['قيد المراجعة', data.hr.pendingRequests],
    ['تمت الموافقة', data.hr.approvedRequests],
    ['مرفوضة', data.hr.rejectedRequests],
    [],
    ['الإجمالي', data.hr.totalRequests]
  ];
  const ws3 = XLSX.utils.aoa_to_sheet(hrData);
  ws3['!cols'] = [{ wch: 30 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, ws3, 'الطلبات');

  // Sheet 4: Workflows
  const workflowData = [
    ['إحصائيات سير العمل', ''],
    ['الوصف', 'القيمة'],
    ['موافقات نشطة', data.workflows.activeApprovals],
    ['تم تصعيدها', data.workflows.escalatedApprovals],
    ['متوسط وقت الموافقة (ساعة)', data.workflows.averageApprovalTime.toFixed(2)]
  ];
  const ws4 = XLSX.utils.aoa_to_sheet(workflowData);
  ws4['!cols'] = [{ wch: 30 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, ws4, 'سير العمل');

  // Generate file
  const date = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `analytics-${date}.xlsx`);
}

/**
 * Employee List Export to Excel
 */
export interface EmployeeExportData {
  id: string;
  employeeNumber: string;
  fullNameAr: string;
  nationalId: string;
  jobTitle?: string;
  department?: string;
  branch?: string;
  status: string;
  hireDate?: string;
  salary?: number;
  phone?: string;
  email?: string;
}

export function exportEmployeesToExcel(employees: EmployeeExportData[], filename?: string) {
  const workbook = XLSX.utils.book_new();

  // Prepare data
  const headers = [
    'رقم الموظف',
    'الاسم',
    'رقم الهوية',
    'المسمى الوظيفي',
    'القسم',
    'الفرع',
    'الحالة',
    'تاريخ التعيين',
    'الراتب',
    'الهاتف',
    'البريد الإلكتروني'
  ];

  const rows = employees.map(emp => [
    emp.employeeNumber || '',
    emp.fullNameAr,
    emp.nationalId,
    emp.jobTitle || '',
    emp.department || '',
    emp.branch || '',
    emp.status,
    emp.hireDate || '',
    emp.salary || '',
    emp.phone || '',
    emp.email || ''
  ]);

  const data = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  ws['!cols'] = [
    { wch: 15 }, // Employee Number
    { wch: 30 }, // Name
    { wch: 15 }, // National ID
    { wch: 25 }, // Job Title
    { wch: 20 }, // Department
    { wch: 20 }, // Branch
    { wch: 12 }, // Status
    { wch: 15 }, // Hire Date
    { wch: 12 }, // Salary
    { wch: 15 }, // Phone
    { wch: 25 }  // Email
  ];

  XLSX.utils.book_append_sheet(workbook, ws, 'الموظفون');

  // Generate file
  const date = new Date().toISOString().split('T')[0];
  const outputFilename = filename || `employees-${date}.xlsx`;
  XLSX.writeFile(workbook, outputFilename);
}

/**
 * Attendance Report Export to Excel
 */
export interface AttendanceExportData {
  date: string;
  employeeName: string;
  employeeNumber: string;
  checkIn?: string;
  checkOut?: string;
  workHours?: number;
  status: string;
  notes?: string;
}

export function exportAttendanceToExcel(records: AttendanceExportData[], filename?: string) {
  const workbook = XLSX.utils.book_new();

  const headers = [
    'التاريخ',
    'اسم الموظف',
    'رقم الموظف',
    'وقت الدخول',
    'وقت الخروج',
    'ساعات العمل',
    'الحالة',
    'ملاحظات'
  ];

  const rows = records.map(record => [
    record.date,
    record.employeeName,
    record.employeeNumber,
    record.checkIn || '',
    record.checkOut || '',
    record.workHours !== undefined ? record.workHours.toFixed(2) : '',
    record.status,
    record.notes || ''
  ]);

  const data = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(data);

  ws['!cols'] = [
    { wch: 12 }, // Date
    { wch: 30 }, // Name
    { wch: 15 }, // Number
    { wch: 12 }, // Check In
    { wch: 12 }, // Check Out
    { wch: 12 }, // Hours
    { wch: 12 }, // Status
    { wch: 30 }  // Notes
  ];

  XLSX.utils.book_append_sheet(workbook, ws, 'الحضور');

  const date = new Date().toISOString().split('T')[0];
  const outputFilename = filename || `attendance-${date}.xlsx`;
  XLSX.writeFile(workbook, outputFilename);
}

/**
 * Payroll Export to Excel
 */
export interface PayrollExportData {
  employeeNumber: string;
  employeeName: string;
  nationalId: string;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
  additions: number;
  deductions: number;
  totalSalary: number;
  bankName?: string;
  iban?: string;
}

export function exportPayrollToExcel(
  data: PayrollExportData[],
  year: number,
  month: number,
  filename?: string
) {
  const workbook = XLSX.utils.book_new();

  const monthNames = [
    'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  // Title row
  const title = [[`رواتب ${monthNames[month - 1]} ${year}`]];
  
  const headers = [
    'رقم الموظف',
    'الاسم',
    'رقم الهوية',
    'الراتب الأساسي',
    'بدل سكن',
    'بدل نقل',
    'بدلات أخرى',
    'إضافات',
    'خصومات',
    'صافي الراتب',
    'البنك',
    'IBAN'
  ];

  const rows = data.map(emp => [
    emp.employeeNumber || '',
    emp.employeeName,
    emp.nationalId,
    emp.basicSalary,
    emp.housingAllowance,
    emp.transportAllowance,
    emp.otherAllowances,
    emp.additions,
    emp.deductions,
    emp.totalSalary,
    emp.bankName || '',
    emp.iban || ''
  ]);

  // Summary row
  const totalSalaries = data.reduce((sum, emp) => sum + emp.totalSalary, 0);
  const summary = [
    [],
    ['', '', '', '', '', '', '', '', 'الإجمالي', totalSalaries, '', '']
  ];

  const sheetData = [...title, [], headers, ...rows, ...summary];
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  ws['!cols'] = [
    { wch: 15 }, // Number
    { wch: 30 }, // Name
    { wch: 15 }, // ID
    { wch: 12 }, // Basic
    { wch: 12 }, // Housing
    { wch: 12 }, // Transport
    { wch: 12 }, // Other
    { wch: 12 }, // Additions
    { wch: 12 }, // Deductions
    { wch: 15 }, // Total
    { wch: 20 }, // Bank
    { wch: 25 }  // IBAN
  ];

  XLSX.utils.book_append_sheet(workbook, ws, 'الرواتب');

  const outputFilename = filename || `payroll-${year}-${month}.xlsx`;
  XLSX.writeFile(workbook, outputFilename);
}
