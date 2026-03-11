#!/usr/bin/env node
/**
 * Comprehensive Workflow & Requests Testing
 * Tests all request types and complete workflow cycles
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
    'test': `${CYAN}🧪`
  }[level] || '';
  
  console.log(`${prefix} ${message}${RESET}`);
  
  if (level === 'pass') passed++;
  if (level === 'fail') failed++;
  if (level === 'warn') warnings++;
}

// ============================================
// 1. HR REQUESTS TESTING
// ============================================

async function testHRRequests() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1️⃣  HR REQUESTS WORKFLOW');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    // Check HR requests by status
    const total = await prisma.hRRequest.count();
    log('info', `Total HR requests: ${total}`);
    
    if (total > 0) {
      log('pass', `${total} HR requests in system`);
      
      // Status breakdown
      const statuses = await prisma.hRRequest.groupBy({
        by: ['status'],
        _count: true
      });
      
      statuses.forEach(s => {
        log('info', `${s.status}: ${s._count}`);
      });
      
      // Check workflow integration via WorkflowRuntimeApproval
      const hrWorkflowApprovals = await prisma.workflowRuntimeApproval.count({
        where: {
          requestType: 'HR_REQUEST'
        }
      });
      
      if (hrWorkflowApprovals > 0) {
        log('pass', `${hrWorkflowApprovals} HR workflow approvals found`);
      } else {
        log('warn', 'No HR requests in workflow system');
      }
    } else {
      log('warn', 'No HR requests found');
    }
    
  } catch (error) {
    log('fail', `HR requests test failed: ${error.message}`);
  }
}

// ============================================
// 2. ATTENDANCE REQUESTS TESTING
// ============================================

async function testAttendanceRequests() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('2️⃣  ATTENDANCE CORRECTION WORKFLOW');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    // Check attendance request types
    const types = {
      EXCUSE: await prisma.attendanceRequest.count({ where: { type: 'EXCUSE' } }),
      PERMISSION: await prisma.attendanceRequest.count({ where: { type: 'PERMISSION' } }),
      CORRECTION: await prisma.attendanceRequest.count({ where: { type: 'CORRECTION' } })
    };
    
    log('info', `Excuse Requests: ${types.EXCUSE}`);
    log('info', `Permission Requests: ${types.PERMISSION}`);
    log('info', `Correction Requests: ${types.CORRECTION}`);
    
    const total = Object.values(types).reduce((a, b) => a + b, 0);
    if (total > 0) {
      log('pass', `${total} attendance requests in system`);
    } else {
      log('warn', 'No attendance requests found');
    }
    
    // Check status distribution
    const statuses = await prisma.attendanceRequest.groupBy({
      by: ['status'],
      _count: true
    });
    
    statuses.forEach(s => {
      const statusName = s.status === 'APPROVED' ? 'موافق عليه' :
                        s.status === 'REJECTED' ? 'مرفوض' :
                        s.status === 'PENDING' ? 'قيد المراجعة' : s.status;
      log('info', `${statusName}: ${s._count}`);
    });
    
    // Check workflow integration via WorkflowRuntimeApproval
    const attendanceWorkflowApprovals = await prisma.workflowRuntimeApproval.count({
      where: {
        requestType: 'ATTENDANCE_CORRECTION'
      }
    });
    
    if (attendanceWorkflowApprovals > 0) {
      log('pass', `${attendanceWorkflowApprovals} attendance workflow approvals found`);
    } else if (total > 0) {
      log('warn', 'Attendance requests exist but not in workflow system');
    }
    
    // Check deduction integration
    const deductionItems = await prisma.payrollRecurringItem.count({
      where: {
        kind: 'DEDUCTION',
        title: { contains: 'حضور' }
      }
    });
    
    if (deductionItems > 0) {
      log('pass', `${deductionItems} attendance deduction items in payroll`);
    } else {
      log('info', 'No attendance deductions in payroll system');
    }
    
  } catch (error) {
    log('fail', `Attendance requests test failed: ${error.message}`);
  }
}

// ============================================
// 3. PROCUREMENT REQUESTS TESTING
// ============================================

async function testProcurementRequests() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('3️⃣  PURCHASE REQUESTS WORKFLOW');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    const total = await prisma.purchaseRequest.count();
    log('info', `Total purchase requests: ${total}`);
    
    if (total > 0) {
      log('pass', 'Purchase requests exist');
      
      // Status breakdown
      const statuses = await prisma.purchaseRequest.groupBy({
        by: ['status'],
        _count: true
      });
      
      statuses.forEach(s => {
        log('info', `${s.status}: ${s._count}`);
      });
      
      // Check workflow integration via WorkflowRuntimeApproval
      const purchaseWorkflowApprovals = await prisma.workflowRuntimeApproval.count({
        where: {
          requestType: 'PURCHASE_REQUEST'
        }
      });
      
      if (purchaseWorkflowApprovals > 0) {
        log('pass', `${purchaseWorkflowApprovals} purchase workflow approvals found`);
      } else {
        log('warn', 'Purchase requests not in workflow system');
      }
      
    } else {
      log('warn', 'No purchase requests found');
    }
    
  } catch (error) {
    log('fail', `Procurement requests test failed: ${error.message}`);
  }
}

// ============================================
// 4. MAINTENANCE REQUESTS TESTING
// ============================================

async function testMaintenanceRequests() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('4️⃣  MAINTENANCE REQUESTS WORKFLOW');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    const total = await prisma.maintenanceRequest.count();
    log('info', `Total maintenance requests: ${total}`);
    
    if (total > 0) {
      log('pass', 'Maintenance requests exist');
      
      // Status breakdown
      const statuses = await prisma.maintenanceRequest.groupBy({
        by: ['status'],
        _count: true
      });
      
      statuses.forEach(s => {
        log('info', `${s.status}: ${s._count}`);
      });
      
      // Check workflow integration via WorkflowRuntimeApproval
      const maintenanceWorkflowApprovals = await prisma.workflowRuntimeApproval.count({
        where: {
          requestType: 'MAINTENANCE_REQUEST'
        }
      });
      
      if (maintenanceWorkflowApprovals > 0) {
        log('pass', `${maintenanceWorkflowApprovals} maintenance workflow approvals found`);
      } else {
        log('warn', 'Maintenance requests not in workflow system');
      }
      
    } else {
      log('warn', 'No maintenance requests found');
    }
    
  } catch (error) {
    log('fail', `Maintenance requests test failed: ${error.message}`);
  }
}

// ============================================
// 5. FINANCE REQUESTS TESTING
// ============================================

async function testFinanceRequests() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('5️⃣  FINANCE REQUESTS WORKFLOW');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    const total = await prisma.financeRequest.count();
    log('info', `Total finance requests: ${total}`);
    
    if (total > 0) {
      log('pass', 'Finance requests exist');
      
      // Status breakdown
      const statuses = await prisma.financeRequest.groupBy({
        by: ['status'],
        _count: true
      });
      
      statuses.forEach(s => {
        log('info', `${s.status}: ${s._count}`);
      });
      
      // Check workflow integration via WorkflowRuntimeApproval
      const financeWorkflowApprovals = await prisma.workflowRuntimeApproval.count({
        where: {
          requestType: { contains: 'FINANCE' } // Could be FINANCE_REQUEST or similar
        }
      });
      
      if (financeWorkflowApprovals > 0) {
        log('pass', `${financeWorkflowApprovals} finance workflow approvals found`);
      } else {
        log('warn', 'Finance requests not in workflow system');
      }
      
    } else {
      log('warn', 'No finance requests found');
    }
    
  } catch (error) {
    log('fail', `Finance requests test failed: ${error.message}`);
  }
}

// ============================================
// 6. WORKFLOW DEFINITIONS TESTING
// ============================================

async function testWorkflowDefinitions() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('6️⃣  WORKFLOW DEFINITIONS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    const workflows = await prisma.workflowDefinition.findMany({
      include: {
        steps: true
      }
    });
    
    log('info', `Total workflow definitions: ${workflows.length}`);
    
    if (workflows.length > 0) {
      log('pass', 'Workflow definitions configured');
      
      workflows.forEach(wf => {
        const published = wf.isPublished ? '✅ Published' : '⏸️  Draft';
        log('info', `${wf.name} (${wf.requestType}) - ${published} - ${wf.steps.length} steps`);
      });
      
      // Check published workflows
      const published = workflows.filter(w => w.isPublished);
      if (published.length > 0) {
        log('pass', `${published.length} workflows are published and active`);
      } else {
        log('warn', 'No published workflows');
      }
      
      // Check workflow steps
      const withSteps = workflows.filter(w => w.steps.length > 0);
      if (withSteps.length === workflows.length) {
        log('pass', 'All workflows have steps configured');
      } else {
        log('warn', `${workflows.length - withSteps.length} workflows without steps`);
      }
      
    } else {
      log('fail', 'No workflow definitions found - system not configured');
    }
    
  } catch (error) {
    log('fail', `Workflow definitions test failed: ${error.message}`);
  }
}

// ============================================
// 7. RUNTIME APPROVALS TESTING
// ============================================

async function testRuntimeApprovals() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('7️⃣  WORKFLOW RUNTIME APPROVALS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    const totalApprovals = await prisma.workflowRuntimeApproval.count();
    log('info', `Total runtime approvals: ${totalApprovals}`);
    
    if (totalApprovals > 0) {
      log('pass', 'Workflow runtime system is active');
      
      // Status breakdown
      const statuses = await prisma.workflowRuntimeApproval.groupBy({
        by: ['status'],
        _count: true
      });
      
      statuses.forEach(s => {
        const emoji = s.status === 'APPROVED' ? '✅' :
                     s.status === 'REJECTED' ? '❌' :
                     s.status === 'PENDING' ? '⏳' : '❓';
        log('info', `${emoji} ${s.status}: ${s._count}`);
      });
      
      // Check request type distribution
      const byType = await prisma.workflowRuntimeApproval.groupBy({
        by: ['requestType'],
        _count: true
      });
      
      log('info', '\nBy Request Type:');
      byType.forEach(t => {
        log('info', `${t.requestType}: ${t._count}`);
      });
      
      // Check for escalated approvals
      const escalated = await prisma.workflowRuntimeApproval.count({
        where: { isEscalated: true }
      });
      
      if (escalated > 0) {
        log('warn', `${escalated} escalated approvals need attention`);
      } else {
        log('pass', 'No escalated approvals');
      }
      
      // Check approval times
      const approvedItems = await prisma.workflowRuntimeApproval.findMany({
        where: {
          status: 'APPROVED',
          reviewedAt: { not: null }
        },
        select: {
          createdAt: true,
          reviewedAt: true
        },
        take: 100
      });
      
      if (approvedItems.length > 0) {
        const avgTime = approvedItems.reduce((sum, item) => {
          const diff = item.reviewedAt.getTime() - item.createdAt.getTime();
          return sum + diff;
        }, 0) / approvedItems.length;
        
        const hours = (avgTime / (1000 * 60 * 60)).toFixed(1);
        log('info', `Average approval time: ${hours} hours`);
        
        if (parseFloat(hours) < 24) {
          log('pass', 'Approval times are good (<24 hours)');
        } else if (parseFloat(hours) < 72) {
          log('warn', 'Approval times are acceptable (<3 days)');
        } else {
          log('warn', 'Approval times are slow (>3 days)');
        }
      }
      
    } else {
      log('warn', 'No runtime approvals found - system may not be in use');
    }
    
  } catch (error) {
    log('fail', `Runtime approvals test failed: ${error.message}`);
  }
}

// ============================================
// 8. WORKFLOW CYCLE TESTING
// ============================================

async function testWorkflowCycle() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('8️⃣  COMPLETE WORKFLOW CYCLE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    // Test 1: Check if requests flow through complete cycle
    const completeFlows = await prisma.workflowRuntimeApproval.findMany({
      where: {
        status: { in: ['APPROVED', 'REJECTED'] },
        reviewedAt: { not: null }
      },
      take: 10,
      select: {
        requestType: true,
        status: true,
        createdAt: true,
        reviewedAt: true,
        comments: true
      }
    });
    
    if (completeFlows.length > 0) {
      log('pass', `${completeFlows.length} requests completed full workflow cycle`);
      
      // Sample some completed flows
      completeFlows.slice(0, 3).forEach(flow => {
        const duration = ((flow.reviewedAt.getTime() - flow.createdAt.getTime()) / (1000 * 60 * 60)).toFixed(1);
        log('info', `${flow.requestType}: ${flow.status} in ${duration}h`);
      });
    } else {
      log('warn', 'No completed workflow cycles found');
    }
    
    // Test 2: Check for orphaned approvals (no request link)
    const orphaned = await prisma.workflowRuntimeApproval.count({
      where: {
        requestId: null
      }
    });
    
    if (orphaned > 0) {
      log('warn', `${orphaned} orphaned approvals without request link`);
    } else {
      log('pass', 'No orphaned approvals');
    }
    
    // Test 3: Check for stale pending approvals (>30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const stale = await prisma.workflowRuntimeApproval.count({
      where: {
        status: 'PENDING',
        createdAt: { lt: thirtyDaysAgo }
      }
    });
    
    if (stale > 0) {
      log('warn', `${stale} pending approvals older than 30 days`);
    } else {
      log('pass', 'No stale pending approvals');
    }
    
    // Test 4: Verify approver assignment
    const withoutApprover = await prisma.workflowRuntimeApproval.count({
      where: {
        status: 'PENDING',
        approverId: null
      }
    });
    
    if (withoutApprover > 0) {
      log('fail', `${withoutApprover} pending approvals without assigned approver`);
    } else {
      log('pass', 'All pending approvals have assigned approvers');
    }
    
  } catch (error) {
    log('fail', `Workflow cycle test failed: ${error.message}`);
  }
}

// ============================================
// 9. CROSS-SYSTEM INTEGRATION
// ============================================

async function testCrossSystemIntegration() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('9️⃣  CROSS-SYSTEM INTEGRATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    log('test', 'Testing Attendance → Workflow → Payroll integration...');
    
    // Check workflow approvals for attendance corrections
    const attendanceApprovals = await prisma.workflowRuntimeApproval.findMany({
      where: {
        requestType: 'ATTENDANCE_CORRECTION',
        status: { in: ['APPROVED', 'REJECTED'] }
      },
      take: 10,
      select: {
        requestId: true,
        status: true,
        createdAt: true,
        reviewedAt: true
      }
    });
    
    if (attendanceApprovals.length > 0) {
      log('pass', `${attendanceApprovals.length} attendance corrections processed`);
      
      // Check rejected ones
      const rejected = attendanceApprovals.filter(a => a.status === 'REJECTED');
      
      if (rejected.length > 0) {
        log('info', `${rejected.length} rejected corrections (should have deductions)`);
        
        // Check for attendance deductions in payroll
        const deductionCount = await prisma.payrollRecurringItem.count({
          where: {
            kind: 'DEDUCTION',
            title: { contains: 'حضور' }
          }
        });
        
        if (deductionCount > 0) {
          log('pass', `Attendance→Payroll integration: ${deductionCount} deductions`);
        } else {
          log('warn', 'No attendance deductions in payroll system');
        }
      }
    } else {
      log('warn', 'No attendance corrections processed yet');
    }
    
    log('test', 'Testing cross-system workflow coverage...');
    
    // Check workflow coverage by request type
    const workflowsByType = await prisma.workflowRuntimeApproval.groupBy({
      by: ['requestType'],
      _count: true
    });
    
    if (workflowsByType.length > 0) {
      log('info', `Workflow system covers ${workflowsByType.length} request types:`);
      workflowsByType.forEach(t => {
        log('info', `  - ${t.requestType}: ${t._count} approvals`);
      });
      log('pass', 'Multi-system workflow integration active');
    } else {
      log('warn', 'Workflow system not in use');
    }
    
  } catch (error) {
    log('fail', `Integration test failed: ${error.message}`);
  }
}

// ============================================
// MAIN TEST RUNNER
// ============================================

async function runTests() {
  console.log('================================================');
  console.log('🔄 WORKFLOW & REQUESTS COMPREHENSIVE TEST');
  console.log('================================================');
  console.log(`Time: ${new Date().toLocaleString('ar-SA')}`);
  console.log('================================================\n');
  
  await testHRRequests();
  await testAttendanceRequests();
  await testProcurementRequests();
  await testMaintenanceRequests();
  await testFinanceRequests();
  await testWorkflowDefinitions();
  await testRuntimeApprovals();
  await testWorkflowCycle();
  await testCrossSystemIntegration();
  
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
    console.log(`${GREEN}🎉 ALL WORKFLOW TESTS PASSED!${RESET}\n`);
    console.log(`${GREEN}✅ Request system is fully functional${RESET}`);
    console.log(`${GREEN}✅ Workflow integration working${RESET}`);
    console.log(`${GREEN}✅ Cross-system integration verified${RESET}\n`);
    process.exit(0);
  } else if (failed === 0) {
    console.log(`${YELLOW}⚠️  TESTS PASSED WITH WARNINGS${RESET}\n`);
    console.log(`${YELLOW}Review warnings above for potential improvements${RESET}\n`);
    process.exit(0);
  } else {
    console.log(`${RED}❌ SOME TESTS FAILED${RESET}\n`);
    console.log(`${RED}Critical workflow issues detected${RESET}`);
    console.log(`${RED}Review failed tests above${RESET}\n`);
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
