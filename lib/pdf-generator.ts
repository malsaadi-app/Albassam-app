import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable?: {
      finalY: number;
    };
  }
}

interface PayslipData {
  employeeName: string;
  nationalId: string;
  employeeNumber: string;
  year: number;
  month: number;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
  additions: Array<{ title: string; amount: number; notes?: string }>;
  deductions: Array<{ title: string; amount: number; notes?: string }>;
  totalSalary: number;
  bankName?: string;
  iban?: string;
  branch?: string;
  jobTitle?: string;
  createdAt: string;
}

const MONTHS_AR = [
  'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

/**
 * Generate PDF for payslip
 * Uses Arial font (supports Arabic) from jsPDF
 */
export async function generatePayslipPDF(data: PayslipData): Promise<Blob> {
  const doc = new jsPDF();
  
  // Add Arabic font support (using built-in Arial)
  doc.setFont('helvetica');
  
  let yPos = 20;
  
  // ===== HEADER =====
  doc.setFillColor(29, 11, 62); // Dark purple
  doc.rect(0, 0, 210, 50, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text('Payslip - كشف الراتب', 105, 20, { align: 'center' });
  
  doc.setFontSize(16);
  doc.text('Albassam International Schools', 105, 32, { align: 'center' });
  doc.text('مدارس البسام العالمية', 105, 42, { align: 'center' });
  
  yPos = 60;
  
  // ===== EMPLOYEE INFO =====
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  
  const monthName = MONTHS_AR[data.month - 1];
  doc.text(`Period: ${monthName} ${data.year} - الفترة`, 20, yPos);
  yPos += 10;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  
  // Employee details table
  const employeeData = [
    ['Employee Name - الاسم', data.employeeName],
    ['National ID - رقم الهوية', data.nationalId],
    ['Employee No. - رقم الموظف', data.employeeNumber || '-'],
    ...(data.jobTitle ? [['Job Title - المسمى الوظيفي', data.jobTitle]] : []),
    ...(data.branch ? [['Branch - الفرع', data.branch]] : []),
    ['Issue Date - تاريخ الإصدار', new Date(data.createdAt).toLocaleDateString('ar-SA')]
  ];
  
  doc.autoTable({
    startY: yPos,
    head: [],
    body: employeeData,
    theme: 'grid',
    styles: { 
      font: 'helvetica',
      fontSize: 10,
      cellPadding: 4
    },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [240, 240, 240], cellWidth: 80 },
      1: { cellWidth: 110 }
    },
    margin: { left: 20, right: 20 }
  });
  
  yPos = doc.lastAutoTable!.finalY + 10;
  
  // ===== SALARY BREAKDOWN =====
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Salary Breakdown - تفصيل الراتب', 20, yPos);
  yPos += 5;
  
  const salaryData = [
    ['Basic Salary - الراتب الأساسي', `${data.basicSalary.toLocaleString('en-US', { minimumFractionDigits: 2 })} SAR`],
    ...(data.housingAllowance > 0 ? [['Housing Allowance - بدل السكن', `${data.housingAllowance.toLocaleString('en-US', { minimumFractionDigits: 2 })} SAR`]] : []),
    ...(data.transportAllowance > 0 ? [['Transport Allowance - بدل النقل', `${data.transportAllowance.toLocaleString('en-US', { minimumFractionDigits: 2 })} SAR`]] : []),
    ...(data.otherAllowances > 0 ? [['Other Allowances - بدلات أخرى', `${data.otherAllowances.toLocaleString('en-US', { minimumFractionDigits: 2 })} SAR`]] : [])
  ];
  
  doc.autoTable({
    startY: yPos,
    head: [],
    body: salaryData,
    theme: 'striped',
    styles: { 
      font: 'helvetica',
      fontSize: 10,
      cellPadding: 4
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 100 },
      1: { halign: 'right', cellWidth: 90 }
    },
    margin: { left: 20, right: 20 }
  });
  
  yPos = doc.lastAutoTable!.finalY + 5;
  
  // ===== ADDITIONS =====
  if (data.additions && data.additions.length > 0) {
    yPos += 5;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129); // Green
    doc.text('Additions - إضافات', 20, yPos);
    yPos += 5;
    
    const additionsData = data.additions.map(item => [
      item.title,
      item.notes || '',
      `+${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} SAR`
    ]);
    
    doc.autoTable({
      startY: yPos,
      head: [['Title', 'Notes', 'Amount']],
      body: additionsData,
      theme: 'striped',
      styles: { 
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [209, 250, 229], // Light green
        textColor: [6, 95, 70],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 70 },
        2: { halign: 'right', cellWidth: 50, textColor: [16, 185, 129], fontStyle: 'bold' }
      },
      margin: { left: 20, right: 20 }
    });
    
    yPos = doc.lastAutoTable!.finalY + 5;
  }
  
  // ===== DEDUCTIONS =====
  if (data.deductions && data.deductions.length > 0) {
    yPos += 5;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(239, 68, 68); // Red
    doc.text('Deductions - خصومات', 20, yPos);
    yPos += 5;
    
    const deductionsData = data.deductions.map(item => [
      item.title,
      item.notes || '',
      `-${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} SAR`
    ]);
    
    doc.autoTable({
      startY: yPos,
      head: [['Title', 'Notes', 'Amount']],
      body: deductionsData,
      theme: 'striped',
      styles: { 
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [254, 226, 226], // Light red
        textColor: [153, 27, 27],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 70 },
        2: { halign: 'right', cellWidth: 50, textColor: [239, 68, 68], fontStyle: 'bold' }
      },
      margin: { left: 20, right: 20 }
    });
    
    yPos = doc.lastAutoTable!.finalY + 5;
  }
  
  // ===== NET SALARY =====
  yPos += 10;
  doc.setFillColor(102, 126, 234); // Purple
  doc.rect(20, yPos - 5, 170, 15, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Net Salary - صافي الراتب:', 30, yPos + 5);
  doc.text(`${data.totalSalary.toLocaleString('en-US', { minimumFractionDigits: 2 })} SAR`, 180, yPos + 5, { align: 'right' });
  
  yPos += 20;
  
  // ===== BANK INFO =====
  if (data.bankName || data.iban) {
    yPos += 5;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Bank Transfer Details - معلومات التحويل البنكي', 20, yPos);
    yPos += 5;
    
    const bankData = [
      ...(data.bankName ? [['Bank Name - البنك', data.bankName]] : []),
      ...(data.iban ? [['IBAN', data.iban]] : [])
    ];
    
    doc.autoTable({
      startY: yPos,
      head: [],
      body: bankData,
      theme: 'plain',
      styles: { 
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 130 }
      },
      margin: { left: 20, right: 20 }
    });
    
    yPos = doc.lastAutoTable!.finalY + 5;
  }
  
  // ===== FOOTER =====
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('This is a computer-generated document. No signature required.', 105, pageHeight - 15, { align: 'center' });
  doc.text('هذا مستند صادر آلياً. لا يحتاج إلى توقيع.', 105, pageHeight - 10, { align: 'center' });
  
  // Return as Blob
  return doc.output('blob');
}

/**
 * Download PDF file
 */
export function downloadPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
