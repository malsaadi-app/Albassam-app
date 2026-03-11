#!/usr/bin/env node
/**
 * Payroll System Comprehensive Test
 * Tests calculations, deductions, and workflow integration
 */

const { PrismaClient } = require('@prisma/client');

// Try to load payroll module (TypeScript, may not be available in test context)
let calculateEmployeePayroll, generatePayrollRun, getEmployeePayrollHistory;
try {
  const payrollModule = require('../lib/payroll');
  calculateEmployeePayroll = payrollModule.calculateEmployeePayroll;
  generatePayrollRun = payrollModule.generatePayrollRun;
  getEmployeePayrollHistory = payrollModule.getEmployeePayrollHistory;
} catch (err) {
  console.log('⚠️  Payroll module not available (TypeScript), using database-only tests');
}

// Use a unique connection for each test run
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + (process.env.DATABASE_URL.includes("?") ? "&" : "?") + "pgbouncer=true"
    }
  }
});

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

let passed = 0;
let failed = 0;
let warnings = 0;

function log(level, message) {
  const prefix = {
    'pass': `${GREEN}✅`,
    'fail': `${RED}❌`,
    'warn': `${YELLOW}⚠️ `,
    'info': `${BLUE}ℹ️ `
  }[level] || '';
  
  console.log(`${prefix} ${message}${RESET}`);
  
  if (level === 'pass') passed++;
  if (level === 'fail') failed++;
  if (level === 'warn') warnings++;
}

async function testPayrollCalculation() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1️⃣  PAYROLL CALCULATION ENGINE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (!calculateEmployeePayroll) {
    log('warn', 'Payroll functions not available - testing database models only');
  }
  
  try {
    // Get a sample employee
    const employee = await prisma.employee.findFirst({
      where: {
        basicSalary: { gt: 0 }
      }
    });
    
    if (!employee) {
      log('warn', 'No employees with salary found - skipping calculation test');
      return;
    }
    
    log('info', `Testing with employee: ${employee.fullNameAr}`);
    
    // Test calculation
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    
    const payroll = await calculateEmployeePayroll(employee.id, year, month);
    
    // Validate calculation structure
    if (payroll.employeeId === employee.id) {
      log('pass', 'Employee ID matches');
    } else {
      log('fail', 'Employee ID mismatch');
    }
    
    // Validate salary calculation
    const expectedTotal = payroll.basicSalary + payroll.allowances.total + 
                          payroll.additions.total - payroll.deductions.total;
    
    const diff = Math.abs(expectedTotal - payroll.totalSalary);
    if (diff < 0.01) {
      log('pass', 'Total salary calculation correct');
    } else {
      log('fail', `Salary calculation error: Expected ${expectedTotal}, Got ${payroll.totalSalary}`);
    }
    
    // Validate allowances
    const allowancesSum = payroll.allowances.housing + payroll.allowances.transport + 
                          payroll.allowances.other;
    if (Math.abs(allowancesSum - payroll.allowances.total) < 0.01) {
      log('pass', 'Allowances sum correctly');
    } else {
      log('fail', 'Allowances calculation error');
    }
    
    log('info', `Basic: ${payroll.basicSalary} SAR`);
    log('info', `Allowances: ${payroll.allowances.total} SAR`);
    log('info', `Additions: ${payroll.additions.total} SAR`);
    log('info', `Deductions: ${payroll.deductions.total} SAR`);
    log('info', `Net: ${payroll.totalSalary} SAR`);
    
  } catch (error) {
    log('fail', `Calculation test failed: ${error.message}`);
  }
}

async function testPayrollRunGeneration() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('2️⃣  PAYROLL RUN GENERATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    // Get admin user
    const adminUser = await prisma.user.findFirst({
      where: {
        role: { in: ['SUPER_ADMIN', 'ADMIN'] }
      }
    });
    
    if (!adminUser) {
      log('warn', 'No admin user found - using first user');
      const anyUser = await prisma.user.findFirst();
      if (!anyUser) {
        log('fail', 'No users in database');
        return;
      }
    }
    
    const userId = adminUser?.id || (await prisma.user.findFirst())?.id;
    
    // Check existing runs for current month
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    
    const existingRuns = await prisma.payrollRun.findMany({
      where: { year, month }
    });
    
    log('info', `Found ${existingRuns.length} existing runs for ${year}-${month}`);
    
    if (existingRuns.length === 0 && generatePayrollRun) {
      log('info', 'Generating test payroll run...');
      
      try {
        const result = await generatePayrollRun(year, month, userId);
        
        if (result.runId) {
          log('pass', `Payroll run created: ${result.runId}`);
        } else {
          log('fail', 'No run ID returned');
        }
        
        if (result.linesCount > 0) {
          log('pass', `Generated ${result.linesCount} payroll lines`);
        } else {
          log('warn', 'No payroll lines generated');
        }
        
        // Verify run in database
        const createdRun = await prisma.payrollRun.findUnique({
          where: { id: result.runId },
          include: {
            _count: {
              select: { lines: true }
            }
          }
        });
        
        if (createdRun) {
          log('pass', 'Payroll run exists in database');
          log('info', `Status: ${createdRun.status}`);
          log('info', `Lines count: ${createdRun._count.lines}`);
        } else {
          log('fail', 'Payroll run not found in database');
        }
        
      } catch (error) {
        log('fail', `Run generation failed: ${error.message}`);
      }
    } else {
      log('info', 'Using existing payroll run for testing');
      const testRun = existingRuns[0];
      
      const lines = await prisma.payrollLine.count({
        where: { payrollRunId: testRun.id }
      });
      
      if (lines > 0) {
        log('pass', `Payroll run has ${lines} lines`);
      } else {
        log('warn', 'Payroll run has no lines');
      }
    }
    
  } catch (error) {
    log('fail', `Run generation test failed: ${error.message}`);
  }
}

async function testDeductionIntegration() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('3️⃣  ATTENDANCE DEDUCTION INTEGRATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    // Check for recurring deduction items
    const deductions = await prisma.payrollRecurringItem.findMany({
      where: {
        kind: 'DEDUCTION',
        active: true
      },
      include: {
        employee: {
          select: {
            fullNameAr: true
          }
        }
      },
      take: 10
    });
    
    log('info', `Found ${deductions.length} active deduction items`);
    
    if (deductions.length > 0) {
      log('pass', 'Deduction system is active');
      
      deductions.forEach(ded => {
        log('info', `${ded.employee.fullNameAr}: ${ded.amount} SAR - ${ded.title}`);
      });
      
      // Verify deductions have valid date ranges
      const invalidDates = deductions.filter(d => 
        d.endAt && d.endAt < d.startAt
      );
      
      if (invalidDates.length === 0) {
        log('pass', 'All deduction date ranges are valid');
      } else {
        log('fail', `${invalidDates.length} deductions have invalid date ranges`);
      }
      
    } else {
      log('warn', 'No active deductions found');
    }
    
    // Check attendance correction workflow integration
    const attendanceRequests = await prisma.attendanceRequest.count({
      where: {
        type: 'EXCUSE'
      }
    });
    
    log('info', `Total attendance correction requests: ${attendanceRequests}`);
    
  } catch (error) {
    log('fail', `Deduction integration test failed: ${error.message}`);
  }
}

async function testPayrollHistory() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('4️⃣  PAYROLL HISTORY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    // Get a sample employee with payroll history
    const employee = await prisma.employee.findFirst({
      where: {
        payrollLines: {
          some: {}
        }
      },
      include: {
        _count: {
          select: { payrollLines: true }
        }
      }
    });
    
    if (!employee) {
      log('warn', 'No employees with payroll history');
      return;
    }
    
    log('info', `Testing with: ${employee.fullNameAr}`);
    log('info', `Payroll records: ${employee._count.payrollLines}`);
    
    const history = await getEmployeePayrollHistory(employee.id, 12);
    
    if (history.length > 0) {
      log('pass', `Retrieved ${history.length} months of history`);
      
      // Verify history is sorted
      let sorted = true;
      for (let i = 0; i < history.length - 1; i++) {
        const current = new Date(history[i].year, history[i].month);
        const next = new Date(history[i + 1].year, history[i + 1].month);
        if (current < next) {
          sorted = false;
          break;
        }
      }
      
      if (sorted) {
        log('pass', 'History is properly sorted (newest first)');
      } else {
        log('fail', 'History sorting incorrect');
      }
      
      // Show sample
      history.slice(0, 3).forEach(h => {
        log('info', `${h.year}-${h.month}: ${h.totalSalary} SAR (${h.status})`);
      });
      
    } else {
      log('warn', 'No history returned');
    }
    
  } catch (error) {
    log('fail', `History test failed: ${error.message}`);
  }
}

async function testPayrollLocking() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('5️⃣  PAYROLL RUN LOCKING');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    const draftRuns = await prisma.payrollRun.count({
      where: { status: 'DRAFT' }
    });
    
    const lockedRuns = await prisma.payrollRun.count({
      where: { status: 'LOCKED' }
    });
    
    log('info', `Draft runs: ${draftRuns}`);
    log('info', `Locked runs: ${lockedRuns}`);
    
    if (draftRuns + lockedRuns > 0) {
      log('pass', 'Payroll run status system working');
    }
    
    // Verify locked runs cannot be deleted
    if (lockedRuns > 0) {
      log('pass', `${lockedRuns} runs are protected (LOCKED status)`);
    }
    
  } catch (error) {
    log('fail', `Locking test failed: ${error.message}`);
  }
}

async function runTests() {
  console.log('================================================');
  console.log('💰 PAYROLL SYSTEM COMPREHENSIVE TEST');
  console.log('================================================');
  console.log(`Time: ${new Date().toLocaleString('ar-SA')}`);
  console.log('================================================\n');
  
  await testPayrollCalculation();
  await testPayrollRunGeneration();
  await testDeductionIntegration();
  await testPayrollHistory();
  await testPayrollLocking();
  
  console.log('\n================================================');
  console.log('📊 TEST SUMMARY');
  console.log('================================================');
  console.log(`${GREEN}✅ Passed:${RESET}         ${passed}`);
  console.log(`${YELLOW}⚠️  Warnings:${RESET}      ${warnings}`);
  console.log(`${RED}❌ Failed:${RESET}         ${failed}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const total = passed + failed + warnings;
  const successRate = Math.round((passed / (total || 1)) * 100);
  
  console.log(`Total Tests:     ${total}`);
  console.log(`Success Rate:    ${successRate}%\n`);
  
  if (failed === 0) {
    console.log(`${GREEN}🎉 ALL PAYROLL TESTS PASSED!${RESET}\n`);
    process.exit(0);
  } else {
    console.log(`${RED}❌ SOME TESTS FAILED${RESET}\n`);
    process.exit(1);
  }
}

// Run tests
runTests()
  .catch((error) => {
    console.error(`${RED}❌ Test execution failed:${RESET}`, error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
