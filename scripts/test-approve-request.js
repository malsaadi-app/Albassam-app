// Test approving a workflow step
async function testApproveRequest() {
  try {
    console.log('🧪 Test: Approve Workflow Step\n');
    
    // Login
    console.log('1. Login as mohammed...');
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'mohammed',
        password: 'Mohammed123'
      })
    });
    
    if (!loginRes.ok) {
      console.log('❌ Login failed');
      return;
    }
    
    const cookies = loginRes.headers.get('set-cookie');
    console.log('✅ Login successful\n');
    
    // Get pending approvals
    console.log('2. Fetching pending approvals...');
    const approvalsRes = await fetch('http://localhost:3000/api/dashboard/pending-approvals', {
      headers: { 'Cookie': cookies }
    });
    
    if (!approvalsRes.ok) {
      console.log('❌ Failed to fetch pending approvals');
      return;
    }
    
    const data = await approvalsRes.json();
    console.log(`   Found: ${data.total || 0} pending approval(s)`);
    
    if (!data.approvals || data.approvals.length === 0) {
      console.log('⚠️  No pending approvals to approve');
      console.log('   Create a request first using test-create-hr-request.js');
      return;
    }
    
    const approval = data.approvals[0];
    console.log(`   Approval ID: ${approval.id}`);
    console.log(`   Workflow: ${approval.workflowName}`);
    console.log(`   Step: ${approval.stepName}`);
    console.log('');
    
    // Approve it
    console.log('3. Approving...');
    const approveRes = await fetch(`http://localhost:3000/api/workflows/runtime/${approval.id}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify({
        comments: 'تمت الموافقة - اختبار النظام'
      })
    });
    
    if (!approveRes.ok) {
      const error = await approveRes.text();
      console.log('❌ Approval failed:', approveRes.status, error);
      return;
    }
    
    const result = await approveRes.json();
    console.log('✅ Approved successfully!');
    console.log(`   Message: ${result.message}`);
    console.log(`   Completed: ${result.completed ? 'Yes (workflow done!)' : 'No (moved to next step)'}`);
    
    if (result.nextApproval) {
      console.log(`   Next approver: ${result.nextApproval.approverId}`);
    }
    
    console.log('\n🎯 Test Result:');
    if (result.completed) {
      console.log('   ✅ Workflow completed! Request should be APPROVED');
    } else {
      console.log('   ✅ Moved to next step successfully');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testApproveRequest();
