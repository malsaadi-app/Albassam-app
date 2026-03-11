#!/usr/bin/env node
/**
 * Database Integrity Test
 * Verifies database schema, relationships, and data consistency
 */

const { PrismaClient } = require('@prisma/client');

// Use a unique connection for each test run with pgbouncer mode
const DATABASE_URL = process.env.DATABASE_URL + (process.env.DATABASE_URL.includes('?') ? '&' : '?') + 'pgbouncer=true';
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
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
  const timestamp = new Date().toLocaleTimeString('ar-SA');
  const prefix = {
    'pass': `${GREEN}✅`,
    'fail': `${RED}❌`,
    'warn': `${YELLOW}⚠️ `,
    'info': `${BLUE}ℹ️ `
  }[level] || '';
  
  console.log(`${prefix} [${timestamp}] ${message}${RESET}`);
  
  if (level === 'pass') passed++;
  if (level === 'fail') failed++;
  if (level === 'warn') warnings++;
}

async function testModelCounts() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1️⃣  DATABASE MODEL COUNTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    const counts = {
      users: await prisma.user.count(),
      employees: await prisma.employee.count(),
      branches: await prisma.branch.count(),
      departments: await prisma.department.count(),
      attendanceRecords: await prisma.attendanceRecord.count(),
      hrRequests: await prisma.hRRequest.count(),
      payrollRuns: await prisma.payrollRun.count(),
      workflows: await prisma.workflowDefinition.count(),
      workflowApprovals: await prisma.workflowRuntimeApproval.count()
    };
    
    log('info', `Users: ${counts.users}`);
    log('info', `Employees: ${counts.employees}`);
    log('info', `Branches: ${counts.branches}`);
    log('info', `Departments: ${counts.departments}`);
    log('info', `Attendance Records: ${counts.attendanceRecords}`);
    log('info', `HR Requests: ${counts.hrRequests}`);
    log('info', `Payroll Runs: ${counts.payrollRuns}`);
    log('info', `Workflows: ${counts.workflows}`);
    log('info', `Workflow Approvals: ${counts.workflowApprovals}`);
    
    // Basic sanity checks
    if (counts.users > 0) log('pass', 'Users table populated');
    else log('warn', 'Users table is empty');
    
    if (counts.employees > 0) log('pass', 'Employees table populated');
    else log('warn', 'Employees table is empty');
    
    if (counts.branches > 0) log('pass', 'Branches table populated');
    else log('warn', 'Branches table is empty');
    
  } catch (error) {
    log('fail', `Model counts test failed: ${error.message}`);
  }
}

async function testRelationships() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('2️⃣  RELATIONSHIP INTEGRITY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    // Test Employee → User relationship
    const employeesWithoutUser = await prisma.employee.count({
      where: { userId: null }
    });
    
    if (employeesWithoutUser === 0) {
      log('pass', 'All employees have associated users');
    } else {
      log('warn', `${employeesWithoutUser} employees without user accounts`);
    }
    
    // Test User → Role relationship
    const usersWithoutRole = await prisma.user.count({
      where: { roleId: null }
    });
    
    if (usersWithoutRole === 0) {
      log('pass', 'All users have assigned roles');
    } else {
      log('fail', `${usersWithoutRole} users without assigned roles`);
    }
    
    // Test Attendance → User relationship
    const orphanedAttendance = await prisma.attendanceRecord.count({
      where: {
        userId: null
      }
    });
    
    if (orphanedAttendance === 0) {
      log('pass', 'All attendance records have valid users');
    } else {
      log('fail', `${orphanedAttendance} orphaned attendance records`);
    }
    
    // Test PayrollRun → Lines relationship
    const payrollRuns = await prisma.payrollRun.findMany({
      include: {
        _count: {
          select: { lines: true }
        }
      }
    });
    
    const emptyRuns = payrollRuns.filter(run => run._count.lines === 0);
    if (emptyRuns.length === 0) {
      log('pass', 'All payroll runs have employee lines');
    } else {
      log('warn', `${emptyRuns.length} payroll runs with no employee lines`);
    }
    
  } catch (error) {
    log('fail', `Relationship test failed: ${error.message}`);
  }
}

async function testDataConsistency() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('3️⃣  DATA CONSISTENCY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    // Check for duplicate employee numbers
    const employees = await prisma.employee.findMany({
      select: { employeeNumber: true }
    });
    
    const employeeNumbers = employees.map(e => e.employeeNumber);
    const duplicates = employeeNumbers.filter((num, idx) => 
      employeeNumbers.indexOf(num) !== idx
    );
    
    if (duplicates.length === 0) {
      log('pass', 'No duplicate employee numbers');
    } else {
      log('fail', `Found ${duplicates.length} duplicate employee numbers`);
    }
    
    // Check for users with usernames
    const usersWithUsername = await prisma.user.count({
      where: {
        username: { not: null }
      }
    });
    
    if (usersWithUsername > 0) {
      log('pass', 'Users have usernames configured');
    } else {
      log('warn', 'Some users without usernames');
    }
    
    // Check for attendance records with invalid work hours
    const invalidAttendance = await prisma.attendanceRecord.count({
      where: {
        workHours: { gt: 24 }
      }
    });
    
    if (invalidAttendance === 0) {
      log('pass', 'All attendance work hours are realistic');
    } else {
      log('fail', `${invalidAttendance} attendance records with >24 work hours`);
    }
    
    // Check payroll calculations consistency
    const payrollLines = await prisma.payrollLine.findMany({
      take: 100 // Sample for performance
    });
    
    let inconsistentLines = 0;
    payrollLines.forEach(line => {
      const calculated = line.basicSalary + line.housingAllowance + 
                        line.transportAllowance + line.otherAllowances + 
                        line.additions - line.deductions;
      
      const diff = Math.abs(calculated - line.totalSalary);
      if (diff > 0.01) { // Allow 1 fils tolerance for rounding
        inconsistentLines++;
      }
    });
    
    if (inconsistentLines === 0) {
      log('pass', 'Payroll calculations are consistent');
    } else {
      log('fail', `${inconsistentLines} payroll lines with calculation errors`);
    }
    
  } catch (error) {
    log('fail', `Data consistency test failed: ${error.message}`);
  }
}

async function testWorkflowIntegrity() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('4️⃣  WORKFLOW INTEGRITY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    // Check for workflow definitions
    const totalWorkflows = await prisma.workflowDefinition.count();
    
    if (totalWorkflows > 0) {
      log('pass', `${totalWorkflows} workflow definitions found`);
    } else {
      log('warn', 'No workflow definitions configured');
    }
    
    // Check for pending approvals
    const pendingApprovals = await prisma.workflowRuntimeApproval.count({
      where: { status: 'PENDING' }
    });
    
    log('info', `${pendingApprovals} pending workflow approvals`);
    
    // Check for stuck/escalated approvals
    const escalatedApprovals = await prisma.workflowRuntimeApproval.count({
      where: { 
        escalatedAt: { not: null }
      }
    });
    
    if (escalatedApprovals > 0) {
      log('warn', `${escalatedApprovals} escalated approvals need attention`);
    } else {
      log('pass', 'No escalated approvals');
    }
    
  } catch (error) {
    log('fail', `Workflow integrity test failed: ${error.message}`);
  }
}

async function testIndexes() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('5️⃣  DATABASE PERFORMANCE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    // Test query performance
    const start = Date.now();
    await prisma.employee.findMany({
      take: 100,
      include: {
        user: true,
        branch: true
      }
    });
    const duration = Date.now() - start;
    
    if (duration < 500) {
      log('pass', `Employee query performance good (${duration}ms)`);
    } else if (duration < 1000) {
      log('warn', `Employee query performance acceptable (${duration}ms)`);
    } else {
      log('fail', `Employee query performance poor (${duration}ms)`);
    }
    
    // Test attendance query
    const attStart = Date.now();
    await prisma.attendanceRecord.findMany({
      where: {
        date: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      take: 1000
    });
    const attDuration = Date.now() - attStart;
    
    if (attDuration < 1000) {
      log('pass', `Attendance query performance good (${attDuration}ms)`);
    } else {
      log('warn', `Attendance query performance slow (${attDuration}ms)`);
    }
    
  } catch (error) {
    log('fail', `Performance test failed: ${error.message}`);
  }
}

async function runTests() {
  console.log('================================================');
  console.log('🧪 DATABASE INTEGRITY TEST');
  console.log('================================================');
  console.log(`Time: ${new Date().toLocaleString('ar-SA')}`);
  console.log('================================================\n');
  
  await testModelCounts();
  await testRelationships();
  await testDataConsistency();
  await testWorkflowIntegrity();
  await testIndexes();
  
  console.log('\n================================================');
  console.log('📊 TEST SUMMARY');
  console.log('================================================');
  console.log(`${GREEN}✅ Passed:${RESET}         ${passed}`);
  console.log(`${YELLOW}⚠️  Warnings:${RESET}      ${warnings}`);
  console.log(`${RED}❌ Failed:${RESET}         ${failed}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const total = passed + failed + warnings;
  const successRate = Math.round((passed / total) * 100);
  
  console.log(`Total Tests:     ${total}`);
  console.log(`Success Rate:    ${successRate}%\n`);
  
  if (failed === 0) {
    console.log(`${GREEN}🎉 ALL CRITICAL TESTS PASSED!${RESET}\n`);
    process.exit(0);
  } else {
    console.log(`${RED}❌ SOME TESTS FAILED${RESET}`);
    console.log('Review failed tests above\n');
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
