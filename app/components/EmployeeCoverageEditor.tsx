import React, { useEffect, useState } from 'react';
import CoverageScopeSelector from './CoverageScopeSelector';

export default function EmployeeCoverageEditor({ assignmentId, branches }){
  const [value, setValue] = useState('BRANCH');
  useEffect(()=>{
    // TODO: load existing assignment via API
  },[assignmentId]);

  const save = async (val) => {
    const payload = typeof val === 'string' ? { assignmentId, coverageScope: val } : { assignmentId, coverageScope: val.mode, coverageBranchIds: val.branches };
    const res = await fetch('/api/settings/org-structure/assignments', { method: 'PATCH', headers: {'content-type':'application/json'}, body: JSON.stringify(payload) });
    return res.json();
  }

  return (
    <div>
      <CoverageScopeSelector value={value} onChange={(v)=>{ setValue(v); save(v); }} branches={branches} />
    </div>
  );
}
