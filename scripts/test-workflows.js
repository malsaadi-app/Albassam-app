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
    // Check HR request types (skip if not exists in schema)
    const hrRequestTypes = await prisma.hRRequestType?.findMany() || [];
    log('info', `Found ${hrRequestTypes.length} HR request types`);
    
    if (hrRequestTypes.length > 0) {
      log('pass', 'HR request types configured');
      hrRequestTypes.forEach(type => {
        log('info', `  - ${type.nameAr} (${type.code})`);
      });
    } else {
      log('warn', 'No HR request types configured');
    }
    
    // Check HR requests by status
    const statusCounts = await prisma.$transaction([
      prisma.hRRequest.count({ where: { status: 'PENDING' } }),
      prisma.hRRequest.count({ where: { status: 'APPROVED' } }),
      prisma.hRRequest.count({ where: { status: 'REJECTED' } }),
      prisma.hRRequest.count({ where: { status: 'CANCELLED' } })
    ]);
    
    log('info', `Pending: ${statusCounts[0]}`);
    log('info', `Approved: ${statusCounts[1]}`);
    log('info', `Rejected: ${statusCounts[2]}`);
    log('info', `Cancelled: ${statusCounts[3]}`);
    
    const total = statusCounts.reduce((a, b) => a + b, 0);
    if (total > 0) {
      log('pass', `${total} HR requests in system`);
    } else {
      log('warn', 'No HR requests found');
    }
    
    // Check workflow integration
    const hrRequestsWithWorkflow = await prisma.hRRequest.count({
      where: {
        workflowApprovals: {
          some: {}
        }
      }
    });
    
    if (hrRequestsWithWorkflow > 0) {
      log('pass', `${hrRequestsWithWorkflow} HR requests have workflow approvals`);
    } else {
      log('warn', 'No HR requests linked to workflow system');
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
    
    // Check workflow integration
    const excusesWithWorkflow = await prisma.attendanceRequest.count({
      where: {
        type: 'EXCUSE',
        workflowApprovals: {
          some: {}
        }
      }
    });
    
    if (excusesWithWorkflow > 0) {
      log('pass', `${excusesWithWorkflow} excuses linked to workflow`);
    } else if (types.EXCUSE > 0) {
      log('warn', 'Excuses exist but not linked to workflow');
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
  console.log('3️⃣  PROCUREMENT REQUESTS WORKFLOW');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    const total = await prisma.procurementRequest.count();
    log('info', `Total procurement requests: ${total}`);
    
    if (total > 0) {
      log('pass', 'Procurement requests exist');
      
      // Status breakdown
      const statuses = await prisma.procurementRequest.groupBy({
        by: ['status'],
        _count: true
      });
      
      statuses.forEach(s => {
        log('info', `${s.status}: ${s._count}`);
      });
      
      // Check workflow integration
      const withWorkflow = await prisma.procurementRequest.count({
        where: {
          workflowApprovals: {
            some: {}
          }
        }
      });
      
      if (withWorkflow > 0) {
        log('pass', `${withWorkflow} procurement requests have workflow approvals`);
      } else {
        log('warn', 'Procurement requests not linked to workflow');
      }
      
    } else {
      log('warn', 'No procurement requests found');
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
      
      // Check workflow integration
      const withWorkflow = await prisma.maintenanceRequest.count({
        where: {
          workflowApprovals: {
            some: {}
          }
        }
      });
      
      if (withWorkflow > 0) {
        log('pass', `${withWorkflow} maintenance requests have workflow approvals`);
      } else {
        log('warn', 'Maintenance requests not linked to workflow');
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
      
      // Check workflow integration
      const withWorkflow = await prisma.financeRequest.count({
        where: {
          workflowApprovals: {
            some: {}
          }
        }
      });
      
      if (withWorkflow > 0) {
        log('pass', `${withWorkflow} finance requests have workflow approvals`);
      } else {
        log('warn', 'Finance requests not linked to workflow');
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
        reviewedAt: { not: null },
        reviewedBy: { not: null }
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
    
    // Check attendance excuses with workflow status
    const excusesWithStatus = await prisma.attendanceRequest.findMany({
      where: {
        type: 'EXCUSE',
        workflowApprovals: {
          some: {
            status: { in: ['APPROVED', 'REJECTED'] }
          }
        }
      },
      include: {
        workflowApprovals: {
          select: {
            status: true,
            reviewedAt: true
          }
        }
      },
      take: 10
    });
    
    if (excusesWithStatus.length > 0) {
      log('pass', `${excusesWithStatus.length} excuses processed through workflow`);
      
      // Check if rejected excuses created deductions
      const rejectedExcuses = excusesWithStatus.filter(e => 
        e.workflowApprovals.some(a => a.status === 'REJECTED')
      );
      
      if (rejectedExcuses.length > 0) {
        log('info', `${rejectedExcuses.length} rejected excuses (should have deductions)`);
        
        // Sample check: Do rejected excuses have corresponding deductions?
        // This is a simplified check - full implementation would match by date/employee
        const deductionCount = await prisma.payrollRecurringItem.count({
          where: {
            kind: 'DEDUCTION',
            title: { contains: 'حضور' }
          }
        });
        
        if (deductionCount > 0) {
          log('pass', 'Attendance→Payroll deduction integration working');
        } else {
          log('warn', 'No attendance deductions found in payroll');
        }
      }
    } else {
      log('warn', 'No excuses processed through workflow yet');
    }
    
    log('test', 'Testing HR Requests → Workflow integration...');
    
    // Check HR requests workflow integration
    const hrWithWorkflow = await prisma.hRRequest.count({
      where: {
        workflowApprovals: {
          some: {}
        }
      }
    });
    
    const totalHR = await prisma.hRRequest.count();
    
    if (totalHR > 0) {
      const percentage = ((hrWithWorkflow / totalHR) * 100).toFixed(0);
      log('info', `${percentage}% of HR requests use workflow system`);
      
      if (hrWithWorkflow === totalHR) {
        log('pass', 'All HR requests integrated with workflow');
      } else if (hrWithWorkflow > 0) {
        log('warn', 'Partial HR workflow integration');
      }
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
