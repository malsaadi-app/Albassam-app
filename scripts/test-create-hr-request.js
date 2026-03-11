// Node.js v22 has global fetch
async function testCreateHRRequest() {
  try {
    console.log('🧪 Test: Create HR Request\n');
    
    // Login first to get session
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
      console.log('❌ Login failed:', loginRes.status);
      return;
    }
    
    const cookies = loginRes.headers.get('set-cookie');
    if (!cookies) {
      console.log('❌ No session cookie received');
      return;
    }
    
    console.log('✅ Login successful\n');
    
    // Create test HR request (LEAVE)
    console.log('2. Creating LEAVE request...');
    const startDate = new Date();
    const endDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days later
    
    const requestData = {
      type: 'LEAVE',
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      leaveType: 'annual',
      reason: 'إجازة سنوية - اختبار النظام'
    };
    
    const createRes = await fetch('http://localhost:3000/api/hr/requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify(requestData)
    });
    
    if (!createRes.ok) {
      const error = await createRes.text();
      console.log('❌ Create request failed:', createRes.status, error);
      return;
    }
    
    const request = await createRes.json();
    console.log('✅ Request created successfully!');
    console.log(`   ID: ${request.id}`);
    console.log(`   Type: ${request.type}`);
    console.log(`   Status: ${request.status}`);
    console.log('');
    
    // Wait a moment for workflow initiation
    console.log('3. Waiting for workflow initiation (2 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check pending approvals
    console.log('4. Checking pending approvals...');
    const approvalsRes = await fetch('http://localhost:3000/api/dashboard/pending-approvals', {
      headers: { 'Cookie': cookies }
    });
    
    if (!approvalsRes.ok) {
      console.log('⚠️  Could not fetch pending approvals');
    } else {
      const data = await approvalsRes.json();
      console.log(`   Total pending approvals: ${data.total || 0}`);
      
      if (data.approvals && data.approvals.length > 0) {
        console.log('   ✅ Workflow initiated successfully!');
        console.log(`   Workflow: ${data.approvals[0].workflowName}`);
        console.log(`   Step: ${data.approvals[0].stepName}`);
      } else {
        console.log('   ⚠️  No pending approvals found (workflow may not have initiated)');
      }
    }
    
    console.log('\n🎯 Test Result:');
    console.log(`   Request ID: ${request.id}`);
    console.log('   Next step: Check /workflows/approvals page or approve via API');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testCreateHRRequest();
