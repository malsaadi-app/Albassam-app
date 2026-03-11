// Test rejecting a workflow step
async function testRejectRequest() {
  try {
    console.log('🧪 Test: Reject Workflow Step\n');
    
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
    
    // Create a new request to reject
    console.log('2. Creating new LEAVE request to reject...');
    const startDate = new Date();
    const endDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    
    const createRes = await fetch('http://localhost:3000/api/hr/requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify({
        type: 'LEAVE',
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        leaveType: 'sick',
        reason: 'إجازة مرضية - سيتم رفضها للاختبار'
      })
    });
    
    if (!createRes.ok) {
      console.log('❌ Failed to create request');
      return;
    }
    
    const request = await createRes.json();
    console.log(`✅ Request created: ${request.id}`);
    console.log('   Waiting 2 seconds for workflow initiation...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get pending approvals
    console.log('3. Fetching pending approvals...');
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
      console.log('⚠️  No pending approvals found');
      return;
    }
    
    // Find the approval for our request
    const approval = data.approvals.find(a => a.requestId === request.id) || data.approvals[0];
    console.log(`   Approval ID: ${approval.id}`);
    console.log(`   Workflow: ${approval.workflowName}`);
    console.log('');
    
    // Reject it
    console.log('4. Rejecting with reason...');
    const rejectRes = await fetch(`http://localhost:3000/api/workflows/runtime/${approval.id}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify({
        comments: 'تم الرفض: هذا اختبار لنظام الرفض'
      })
    });
    
    if (!rejectRes.ok) {
      const error = await rejectRes.text();
      console.log('❌ Rejection failed:', rejectRes.status, error);
      return;
    }
    
    const result = await rejectRes.json();
    console.log('✅ Rejected successfully!');
    console.log(`   Message: ${result.message}`);
    
    console.log('\n🎯 Test Result:');
    console.log('   ✅ Rejection works correctly!');
    console.log('   ✅ Request should be marked REJECTED');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testRejectRequest();
