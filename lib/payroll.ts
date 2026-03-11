import prisma from './prisma';

export interface PayrollCalculation {
  employeeId: string;
  employeeName: string;
  nationalId: string;
  bankName: string | null;
  iban: string | null;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
  additions: number;
  deductions: number;
  totalSalary: number;
  items: Array<{
    kind: 'ADDITION' | 'DEDUCTION';
    title: string;
    amount: number;
    notes?: string;
  }>;
}

/**
 * Calculate payroll for a single employee for a specific month
 */
export async function calculateEmployeePayroll(
  employeeId: string,
  year: number,
  month: number
): Promise<PayrollCalculation | null> {
  // Get employee data
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { user: true }
  });

  if (!employee) {
    return null;
  }

  // Get recurring items for this employee
  const recurringItems = await prisma.payrollRecurringItem.findMany({
    where: {
      employeeId,
      active: true,
      OR: [
        { startAt: null },
        { startAt: { lte: new Date(year, month - 1, 1) } }
      ],
      AND: [
        {
          OR: [
            { endAt: null },
            { endAt: { gte: new Date(year, month - 1, 1) } }
          ]
        }
      ]
    }
  });

  // Calculate base amounts
  const basicSalary = employee.basicSalary || 0;
  const housingAllowance = employee.housingAllowance || 0;
  const transportAllowance = employee.transportAllowance || 0;
  const otherAllowances = employee.otherAllowances || 0;

  // Calculate additions and deductions from recurring items
  const additions = recurringItems
    .filter(item => item.kind === 'ADDITION')
    .reduce((sum, item) => sum + item.amount, 0);

  const deductions = recurringItems
    .filter(item => item.kind === 'DEDUCTION')
    .reduce((sum, item) => sum + item.amount, 0);

  // Calculate total
  const totalSalary =
    basicSalary +
    housingAllowance +
    transportAllowance +
    otherAllowances +
    additions -
    deductions;

  // Build items array
  const items = recurringItems.map(item => ({
    kind: item.kind,
    title: item.title,
    amount: item.amount
  }));

  return {
    employeeId: employee.id,
    employeeName: employee.fullNameAr,
    nationalId: employee.nationalId,
    bankName: employee.bankName,
    iban: employee.iban,
    basicSalary,
    housingAllowance,
    transportAllowance,
    otherAllowances,
    additions,
    deductions,
    totalSalary,
    items
  };
}

/**
 * Generate payroll run for all active employees for a specific month
 */
export async function generatePayrollRun(
  year: number,
  month: number,
  createdById: string
): Promise<{ runId: string; linesCount: number }> {
  // Check if run already exists
  const existing = await prisma.payrollRun.findUnique({
    where: {
      year_month: { year, month }
    }
  });

  if (existing) {
    throw new Error(`Payroll run for ${year}-${month} already exists`);
  }

  // Get all active employees
  const employees = await prisma.employee.findMany({
    where: {
      status: 'ACTIVE'
    },
    include: { user: true }
  });

  if (employees.length === 0) {
    throw new Error('No active employees found');
  }

  // Create payroll run
  const run = await prisma.payrollRun.create({
    data: {
      year,
      month,
      status: 'DRAFT',
      createdBy: createdById
    }
  });

  // Calculate and create payroll lines
  const lines = await Promise.all(
    employees.map(async (employee) => {
      const calculation = await calculateEmployeePayroll(employee.id, year, month);
      
      if (!calculation) {
        return null;
      }

      // Create payroll line
      const line = await prisma.payrollLine.create({
        data: {
          payrollRunId: run.id,
          employeeId: employee.id,
          employeeName: calculation.employeeName,
          nationalId: calculation.nationalId,
          bankName: calculation.bankName,
          iban: calculation.iban,
          basicSalary: calculation.basicSalary,
          housingAllowance: calculation.housingAllowance,
          transportAllowance: calculation.transportAllowance,
          otherAllowances: calculation.otherAllowances,
          additions: calculation.additions,
          deductions: calculation.deductions,
          totalSalary: calculation.totalSalary
        }
      });

      // Create line items
      if (calculation.items.length > 0) {
        await prisma.payrollLineItem.createMany({
          data: calculation.items.map(item => ({
            payrollLineId: line.id,
            kind: item.kind,
            title: item.title,
            amount: item.amount,
            notes: item.notes
          }))
        });
      }

      return line;
    })
  );

  const validLines = lines.filter(line => line !== null);

  return {
    runId: run.id,
    linesCount: validLines.length
  };
}

/**
 * Lock a payroll run (prevent further edits)
 */
export async function lockPayrollRun(runId: string): Promise<void> {
  await prisma.payrollRun.update({
    where: { id: runId },
    data: { status: 'LOCKED' }
  });
}

/**
 * Delete a draft payroll run
 */
export async function deletePayrollRun(runId: string): Promise<void> {
  const run = await prisma.payrollRun.findUnique({
    where: { id: runId }
  });

  if (!run) {
    throw new Error('Payroll run not found');
  }

  if (run.status === 'LOCKED') {
    throw new Error('Cannot delete a locked payroll run');
  }

  await prisma.payrollRun.delete({
    where: { id: runId }
  });
}

/**
 * Get payroll history for an employee
 */
export async function getEmployeePayrollHistory(
  employeeId: string,
  limit: number = 12
): Promise<Array<{
  id: string;
  year: number;
  month: number;
  totalSalary: number;
  status: string;
  createdAt: Date;
}>> {
  const lines = await prisma.payrollLine.findMany({
    where: { employeeId },
    include: {
      payrollRun: {
        select: {
          year: true,
          month: true,
          status: true,
          createdAt: true
        }
      }
    },
    orderBy: [
      { payrollRun: { year: 'desc' } },
      { payrollRun: { month: 'desc' } }
    ],
    take: limit
  });

  return lines.map(line => ({
    id: line.id,
    year: line.payrollRun.year,
    month: line.payrollRun.month,
    totalSalary: line.totalSalary,
    status: line.payrollRun.status,
    createdAt: line.payrollRun.createdAt
  }));
}

/**
 * Get payslip data for an employee for a specific month
 */
export async function getEmployeePayslip(
  employeeId: string,
  year: number,
  month: number
) {
  const line = await prisma.payrollLine.findFirst({
    where: {
      employeeId,
      payrollRun: {
        year,
        month
      }
    },
    include: {
      items: true,
      payrollRun: true,
      employee: {
        include: {
          branch: true,
          stage: true
        }
      }
    }
  });

  if (!line) {
    return null;
  }

  return {
    ...line,
    monthName: getMonthName(month),
    yearHijri: year // TODO: Convert to Hijri if needed
  };
}

function getMonthName(month: number): string {
  const months = [
    'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  return months[month - 1] || '';
}
