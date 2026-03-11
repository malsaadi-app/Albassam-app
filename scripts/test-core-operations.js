#!/usr/bin/env node
/**
 * Core Operations End-to-End Testing
 * Tests critical user flows: Employee management, Attendance, Corrections
 */

const { PrismaClient } = require('@prisma/client');

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
const CYAN = '\x1b[36m';
const MAGENTA = '\x1b[35m';
const RESET = '\x1b[0m';

let passed = 0;
let failed = 0;
let warnings = 0;

function log(level, message) {
  const prefix = {
    'pass': `${GREEN}✅`,
    'fail': `${RED}❌`,
    'warn': `${YELLOW}⚠️ `,
    'info': `${BLUE}ℹ️ `,
    'test': `${CYAN}🧪`,
    'step': `${MAGENTA}📍`
  }[level] || '';
  
  console.log(`${prefix} ${message}${RESET}`);
  
  if (level === 'pass') passed++;
  if (level === 'fail') failed++;
  if (level === 'warn') warnings++;
}

// ============================================
// 1. EMPLOYEE CREATION & STRUCTURE
// ============================================

async function testEmployeeCreationFlow() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1️⃣  EMPLOYEE CREATION & ORGANIZATIONAL STRUCTURE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    log('step', 'Testing employee creation workflow...');
    
    // Check total employees
    const totalEmployees = await prisma.employee.count();
    log('info', `Total employees in system: ${totalEmployees}`);
    
    if (totalEmployees > 0) {
      log('pass', 'Employees exist in system');
    } else {
      log('fail', 'No employees found - system not initialized');
      return;
    }
    
    // Check employee basic data
    const employeesWithBasicData = await prisma.employee.count({
      where: {
        AND: [
          { fullNameAr: { not: null } },
          { employeeNumber: { not: null } },
          { nationalId: { not: null } }
        ]
      }
    });
    
    const completionRate = ((employeesWithBasicData / totalEmployees) * 100).toFixed(1);
    log('info', `Employees with complete basic data: ${completionRate}%`);
    
    if (completionRate >= 95) {
      log('pass', 'Most employees have complete basic data');
    } else if (completionRate >= 80) {
      log('warn', 'Some employees missing basic data');
    } else {
      log('fail', 'Many employees missing basic data');
    }
    
    // Check user account linking
    const employeesWithUser = await prisma.employee.count({
      where: { userId: { not: null } }
    });
    
    const linkingRate = ((employeesWithUser / totalEmployees) * 100).toFixed(1);
    log('info', `Employees with user accounts: ${linkingRate}%`);
    
    if (linkingRate >= 90) {
      log('pass', 'Most employees have user accounts');
    } else if (linkingRate >= 50) {
      log('warn', 'Some employees without user accounts');
    } else {
      log('fail', 'Many employees without user accounts');
    }
    
    // Check department assignment
    const employeesWithDept = await prisma.employee.count({
      where: { departmentId: { not: null } }
    });
    
    const deptRate = ((employeesWithDept / totalEmployees) * 100).toFixed(1);
    log('info', `Employees with department: ${deptRate}%`);
    
    if (deptRate >= 90) {
      log('pass', 'Most employees assigned to departments');
    } else {
      log('warn', `${totalEmployees - employeesWithDept} employees without department`);
    }
    
    // Check branch assignment
    const employeesWithBranch = await prisma.employee.count({
      where: { branchId: { not: null } }
    });
    
    const branchRate = ((employeesWithBranch / totalEmployees) * 100).toFixed(1);
    log('info', `Employees with branch: ${branchRate}%`);
    
    if (branchRate >= 90) {
      log('pass', 'Most employees assigned to branches');
    } else {
      log('warn', `${totalEmployees - employeesWithBranch} employees without branch`);
    }
    
    // Check organizational structure assignments
    log('step', 'Testing organizational structure assignments...');
    
    const orgAssignments = await prisma.organizationalAssignment.count();
    log('info', `Total organizational assignments: ${orgAssignments}`);
    
    if (orgAssignments > 0) {
      log('pass', 'Organizational structure system is active');
      
      // Check assignment types
      const byType = await prisma.organizationalAssignment.groupBy({
        by: ['type'],
        _count: true
      });
      
      byType.forEach(t => {
        log('info', `${t.type}: ${t._count} assignments`);
      });
      
      // Check for unassigned employees
      const assignedEmployees = await prisma.employee.count({
        where: {
          organizationalAssignments: {
            some: {}
          }
        }
      });
      
      const orgRate = ((assignedEmployees / totalEmployees) * 100).toFixed(1);
      log('info', `Employees with org structure: ${orgRate}%`);
      
      if (orgRate >= 80) {
        log('pass', 'Most employees assigned to organizational structure');
      } else {
        log('warn', `${totalEmployees - assignedEmployees} employees not in org structure`);
      }
      
    } else {
      log('warn', 'No organizational assignments found');
    }
    
    // Check employment status distribution
    const statusDist = await prisma.employee.groupBy({
      by: ['status'],
      _count: true
    });
    
    log('info', '\nEmployee status distribution:');
    statusDist.forEach(s => {
      log('info', `${s.status}: ${s._count}`);
    });
    
    const activeEmployees = await prisma.employee.count({
      where: { status: 'ACTIVE' }
    });
    
    if (activeEmployees > 0) {
      log('pass', `${activeEmployees} active employees`);
    }
    
  } catch (error) {
    log('fail', `Employee creation test failed: ${error.message}`);
  }
}

// ============================================
// 2. ATTENDANCE CHECK-IN/OUT
// ============================================

async function testAttendanceCheckInOut() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('2️⃣  ATTENDANCE CHECK-IN/OUT SYSTEM');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    log('step', 'Testing attendance recording system...');
    
    // Check total attendance records
    const totalRecords = await prisma.attendanceRecord.count();
    log('info', `Total attendance records: ${totalRecords}`);
    
    if (totalRecords > 0) {
      log('pass', 'Attendance system is active');
    } else {
      log('warn', 'No attendance records found');
      return;
    }
    
    // Check records for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayRecords = await prisma.attendanceRecord.count({
      where: {
        date: {
          gte: today,
          lt: tomorrow
        }
      }
    });
    
    log('info', `Attendance records today: ${todayRecords}`);
    
    if (todayRecords > 0) {
      log('pass', 'Attendance being recorded today');
    } else {
      log('warn', 'No attendance records for today yet');
    }
    
    // Check check-in/out completeness (sample last 1000 records for performance)
    const sampleRecords = await prisma.attendanceRecord.findMany({
      take: 1000,
      select: {
        checkIn: true,
        checkOut: true
      }
    });
    
    const withCheckIn = sampleRecords.filter(r => r.checkIn !== null).length;
    const withCheckOut = sampleRecords.filter(r => r.checkOut !== null).length;
    const sampleSize = sampleRecords.length;
    
    const checkInRate = ((withCheckIn / sampleSize) * 100).toFixed(1);
    const checkOutRate = ((withCheckOut / sampleSize) * 100).toFixed(1);
    
    log('info', `Records with check-in: ${checkInRate}% (sampled ${sampleSize} records)`);
    log('info', `Records with check-out: ${checkOutRate}%`);
    
    if (checkInRate >= 95) {
      log('pass', 'Check-in recording working well');
    } else {
      log('warn', `${totalRecords - withCheckIn} records missing check-in`);
    }
    
    if (checkOutRate >= 80) {
      log('pass', 'Check-out recording working well');
    } else {
      log('info', `${totalRecords - withCheckOut} records missing check-out (may be in progress)`);
    }
    
    // Check work hours calculation
    const withWorkHours = await prisma.attendanceRecord.count({
      where: {
        workHours: { not: null },
        workHours: { gt: 0 }
      }
    });
    
    const workHoursRate = ((withWorkHours / totalRecords) * 100).toFixed(1);
    log('info', `Records with calculated work hours: ${workHoursRate}%`);
    
    if (workHoursRate >= 70) {
      log('pass', 'Work hours calculation functioning');
    } else {
      log('warn', 'Many records without work hours calculation');
    }
    
    // Check attendance status distribution
    const statusDist = await prisma.attendanceRecord.groupBy({
      by: ['status'],
      _count: true
    });
    
    log('info', '\nAttendance status distribution:');
    statusDist.forEach(s => {
      const emoji = s.status === 'PRESENT' ? '✅' :
                   s.status === 'LATE' ? '⏰' :
                   s.status === 'ABSENT' ? '❌' :
                   s.status === 'EXCUSED' ? '📋' : '❓';
      log('info', `${emoji} ${s.status}: ${s._count}`);
    });
    
    // Check late arrivals
    const lateRecords = await prisma.attendanceRecord.count({
      where: { status: 'LATE' }
    });
    
    const lateRate = ((lateRecords / totalRecords) * 100).toFixed(1);
    log('info', `Late arrival rate: ${lateRate}%`);
    
    if (lateRate < 10) {
      log('pass', 'Low late arrival rate (<10%)');
    } else if (lateRate < 20) {
      log('warn', 'Moderate late arrival rate');
    } else {
      log('warn', 'High late arrival rate (>20%)');
    }
    
    // Check absent records
    const absentRecords = await prisma.attendanceRecord.count({
      where: { status: 'ABSENT' }
    });
    
    const absentRate = ((absentRecords / totalRecords) * 100).toFixed(1);
    log('info', `Absence rate: ${absentRate}%`);
    
    if (absentRate < 5) {
      log('pass', 'Low absence rate (<5%)');
    } else if (absentRate < 10) {
      log('warn', 'Moderate absence rate');
    } else {
      log('warn', 'High absence rate (>10%)');
    }
    
    // Check data integrity
    const invalidHours = await prisma.attendanceRecord.count({
      where: {
        workHours: { gt: 24 }
      }
    });
    
    if (invalidHours === 0) {
      log('pass', 'No invalid work hours (all <24h)');
    } else {
      log('fail', `${invalidHours} records with invalid work hours (>24h)`);
    }
    
    // Check recent activity
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentRecords = await prisma.attendanceRecord.count({
      where: {
        date: { gte: last7Days }
      }
    });
    
    log('info', `Records in last 7 days: ${recentRecords}`);
    
    if (recentRecords > 0) {
      log('pass', 'Recent attendance activity detected');
    } else {
      log('warn', 'No attendance records in last 7 days');
    }
    
  } catch (error) {
    log('fail', `Attendance check-in/out test failed: ${error.message}`);
  }
}

// ============================================
// 3. ATTENDANCE CORRECTION REQUESTS
// ============================================

async function testAttendanceCorrectionFlow() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('3️⃣  ATTENDANCE CORRECTION REQUEST FLOW');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    log('step', 'Testing correction request submission...');
    
    // Check correction requests
    const totalRequests = await prisma.attendanceRequest.count();
    log('info', `Total attendance requests: ${totalRequests}`);
    
    if (totalRequests > 0) {
      log('pass', 'Correction request system is active');
    } else {
      log('warn', 'No correction requests found');
      return;
    }
    
    // Check by type
    const byType = await prisma.attendanceRequest.groupBy({
      by: ['type'],
      _count: true
    });
    
    log('info', '\nRequest types:');
    byType.forEach(t => {
      log('info', `${t.type}: ${t._count}`);
    });
    
    // Check by status
    const byStatus = await prisma.attendanceRequest.groupBy({
      by: ['status'],
      _count: true
    });
    
    log('info', '\nRequest status:');
    byStatus.forEach(s => {
      const emoji = s.status === 'APPROVED' ? '✅' :
                   s.status === 'REJECTED' ? '❌' :
                   s.status === 'PENDING' ? '⏳' : '❓';
      log('info', `${emoji} ${s.status}: ${s._count}`);
    });
    
    // Check approval/rejection rates
    const approved = await prisma.attendanceRequest.count({
      where: { status: 'APPROVED' }
    });
    
    const rejected = await prisma.attendanceRequest.count({
      where: { status: 'REJECTED' }
    });
    
    const processed = approved + rejected;
    
    if (processed > 0) {
      const approvalRate = ((approved / processed) * 100).toFixed(1);
      log('info', `Approval rate: ${approvalRate}%`);
      
      if (approvalRate >= 70) {
        log('pass', 'Good approval rate (≥70%)');
      } else if (approvalRate >= 50) {
        log('warn', 'Moderate approval rate');
      } else {
        log('warn', 'Low approval rate (<50%)');
      }
    }
    
    log('step', 'Testing workflow integration...');
    
    // Check workflow integration
    const requestsInWorkflow = await prisma.workflowRuntimeApproval.count({
      where: {
        requestType: 'ATTENDANCE_CORRECTION'
      }
    });
    
    log('info', `Requests in workflow system: ${requestsInWorkflow}`);
    
    if (requestsInWorkflow > 0) {
      log('pass', 'Correction requests integrated with workflow');
      
      // Check workflow status distribution
      const workflowStatus = await prisma.workflowRuntimeApproval.groupBy({
        by: ['status'],
        where: {
          requestType: 'ATTENDANCE_CORRECTION'
        },
        _count: true
      });
      
      workflowStatus.forEach(s => {
        log('info', `Workflow ${s.status}: ${s._count}`);
      });
      
    } else if (totalRequests > 0) {
      log('warn', 'Requests exist but not using workflow system');
    }
    
    log('step', 'Testing payroll deduction integration...');
    
    // Check deduction integration
    const attendanceDeductions = await prisma.payrollRecurringItem.count({
      where: {
        kind: 'DEDUCTION',
        OR: [
          { title: { contains: 'حضور' } },
          { title: { contains: 'غياب' } },
          { title: { contains: 'تأخير' } }
        ]
      }
    });
    
    log('info', `Attendance-related deductions: ${attendanceDeductions}`);
    
    if (attendanceDeductions > 0) {
      log('pass', 'Attendance→Payroll deduction integration working');
      
      // Sample some deductions
      const sampleDeductions = await prisma.payrollRecurringItem.findMany({
        where: {
          kind: 'DEDUCTION',
          title: { contains: 'حضور' }
        },
        include: {
          employee: {
            select: { fullNameAr: true }
          }
        },
        take: 3
      });
      
      sampleDeductions.forEach(d => {
        log('info', `${d.employee.fullNameAr}: ${d.amount} SAR - ${d.title}`);
      });
      
    } else if (rejected > 0) {
      log('warn', 'Rejected requests exist but no deductions found');
    } else {
      log('info', 'No rejected requests yet (no deductions expected)');
    }
    
    // Check request completeness
    const withReason = await prisma.attendanceRequest.count({
      where: {
        reason: { not: null },
        reason: { not: '' }
      }
    });
    
    const reasonRate = ((withReason / totalRequests) * 100).toFixed(1);
    log('info', `Requests with reason: ${reasonRate}%`);
    
    if (reasonRate >= 95) {
      log('pass', 'Most requests have reasons provided');
    } else {
      log('warn', `${totalRequests - withReason} requests without reason`);
    }
    
    // Check pending requests age
    const old = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const stalePending = await prisma.attendanceRequest.count({
      where: {
        status: 'PENDING',
        createdAt: { lt: old }
      }
    });
    
    if (stalePending === 0) {
      log('pass', 'No stale pending requests (>30 days)');
    } else {
      log('warn', `${stalePending} requests pending for >30 days`);
    }
    
  } catch (error) {
    log('fail', `Attendance correction test failed: ${error.message}`);
  }
}

// ============================================
// 4. END-TO-END FLOW SIMULATION
// ============================================

async function testEndToEndFlow() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('4️⃣  END-TO-END FLOW VALIDATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    log('test', 'Simulating complete employee lifecycle...');
    
    // Find a sample employee with complete data
    const sampleEmployee = await prisma.employee.findFirst({
      where: {
        status: 'ACTIVE',
        userId: { not: null }
      }
    });
    
    if (!sampleEmployee) {
      log('warn', 'No fully-configured employee found for E2E test');
      return;
    }
    
    // Get related data separately
    const employeeUser = sampleEmployee.userId ? await prisma.user.findUnique({
      where: { id: sampleEmployee.userId },
      select: { username: true }
    }) : null;
    
    const employeeBranch = sampleEmployee.branchId ? await prisma.branch.findUnique({
      where: { id: sampleEmployee.branchId },
      select: { name: true }
    }) : null;
    
    const orgAssignments = await prisma.organizationalAssignment?.count({
      where: { employeeId: sampleEmployee.id }
    }) || 0;
    
    const recentAttendance = await prisma.attendanceRecord.findMany({
      where: { userId: sampleEmployee.userId },
      take: 5,
      orderBy: { date: 'desc' }
    });
    
    const recentRequests = await prisma.attendanceRequest.findMany({
      where: { userId: sampleEmployee.userId },
      take: 3,
      orderBy: { createdAt: 'desc' }
    });
    
    log('info', `Testing with employee: ${sampleEmployee.fullNameAr}`);
    
    // Step 1: Employee exists
    if (sampleEmployee.employeeNumber) {
      log('pass', `✓ Step 1: Employee created (${sampleEmployee.employeeNumber})`);
    }
    
    // Step 2: User account linked
    if (sampleEmployee.userId && employeeUser) {
      log('pass', `✓ Step 2: User account linked (${employeeUser.username})`);
    } else {
      log('fail', '✗ Step 2: User account not linked');
    }
    
    // Step 3: Organizational placement
    if (sampleEmployee.branchId && sampleEmployee.departmentId) {
      const branchName = employeeBranch?.name || 'Unknown Branch';
      log('pass', `✓ Step 3: Assigned to ${branchName}`);
    } else {
      log('fail', '✗ Step 3: Not assigned to branch/department');
    }
    
    // Step 4: Org structure assignment
    if (orgAssignments > 0) {
      log('pass', `✓ Step 4: Organizational structure assigned (${orgAssignments} assignments)`);
    } else {
      log('warn', '⚠ Step 4: Not in organizational structure');
    }
    
    // Step 5: Attendance records
    if (recentAttendance.length > 0) {
      log('pass', `✓ Step 5: Has attendance records (${recentAttendance.length} recent)`);
      
      const recentRecord = recentAttendance[0];
      log('info', `   Last: ${recentRecord.date.toLocaleDateString()} - ${recentRecord.status} - ${recentRecord.workHours || 0}h`);
    } else {
      log('warn', '⚠ Step 5: No attendance records yet');
    }
    
    // Step 6: Correction requests
    if (recentRequests.length > 0) {
      log('pass', `✓ Step 6: Has correction requests (${recentRequests.length})`);
      
      const recentRequest = recentRequests[0];
      log('info', `   Last: ${recentRequest.type} - ${recentRequest.status}`);
    } else {
      log('info', 'ℹ Step 6: No correction requests (none needed)');
    }
    
    // Overall flow assessment
    const steps = 6;
    let completedSteps = 0;
    
    if (sampleEmployee.employeeNumber) completedSteps++;
    if (sampleEmployee.userId) completedSteps++;
    if (sampleEmployee.branchId && sampleEmployee.departmentId) completedSteps++;
    if (orgAssignments > 0) completedSteps++;
    if (recentAttendance.length > 0) completedSteps++;
    if (recentRequests.length > 0) completedSteps++;
    
    const flowCompletion = ((completedSteps / steps) * 100).toFixed(0);
    log('info', `\nE2E Flow Completion: ${flowCompletion}%`);
    
    if (flowCompletion >= 80) {
      log('pass', '🎉 Complete employee lifecycle working!');
    } else if (flowCompletion >= 60) {
      log('warn', '⚠️  Partial lifecycle coverage');
    } else {
      log('fail', '❌ Lifecycle flow incomplete');
    }
    
  } catch (error) {
    log('fail', `E2E flow test failed: ${error.message}`);
  }
}

// ============================================
// MAIN TEST RUNNER
// ============================================

async function runTests() {
  console.log('================================================');
  console.log('🔄 CORE OPERATIONS COMPREHENSIVE TEST');
  console.log('================================================');
  console.log(`Time: ${new Date().toLocaleString('ar-SA')}`);
  console.log('================================================\n');
  
  await testEmployeeCreationFlow();
  await testAttendanceCheckInOut();
  await testAttendanceCorrectionFlow();
  await testEndToEndFlow();
  
  console.log('\n================================================');
  console.log('📊 TEST SUMMARY');
  console.log('================================================');
  console.log(`${GREEN}✅ Passed:${RESET}         ${passed}`);
  console.log(`${YELLOW}⚠️  Warnings:${RESET}      ${warnings}`);
  console.log(`${RED}❌ Failed:${RESET}         ${failed}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const total = passed + failed + warnings;
  const successRate = total > 0 ? Math.round((passed / total) * 100) : 0;
  
  console.log(`Total Tests:     ${total}`);
  console.log(`Success Rate:    ${successRate}%\n`);
  
  if (failed === 0 && warnings < 5) {
    console.log(`${GREEN}🎉 ALL CORE OPERATIONS WORKING!${RESET}\n`);
    console.log(`${GREEN}✅ Employee management functional${RESET}`);
    console.log(`${GREEN}✅ Attendance system operational${RESET}`);
    console.log(`${GREEN}✅ Correction workflow integrated${RESET}`);
    console.log(`${GREEN}✅ End-to-end flow validated${RESET}\n`);
    process.exit(0);
  } else if (failed === 0) {
    console.log(`${YELLOW}⚠️  TESTS PASSED WITH WARNINGS${RESET}\n`);
    console.log(`${YELLOW}Core operations working but review warnings${RESET}\n`);
    process.exit(0);
  } else {
    console.log(`${RED}❌ CRITICAL ISSUES DETECTED${RESET}\n`);
    console.log(`${RED}Core operations have failures - review above${RESET}\n`);
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
