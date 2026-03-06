import React, { useEffect, useState } from 'react';
import CoverageScopeSelector from './CoverageScopeSelector';

type Branch = { id: string; name: string };

type Props = { assignmentId: string; branches: Branch[] };

export default function EmployeeCoverageEditor({ assignmentId, branches }: Props){
  const [value, setValue] = useState<string | { mode: string; branches?: string[] }>('BRANCH');
  useEffect(()=>{
    // TODO: load existing assignment via API
  },[assignmentId]);

  const save = async (val: any) => {
    // if we have an assignmentId, update via settings endpoint; otherwise create under employee
    if (assignmentId) {
      const payload = typeof val === 'string' ? { assignmentId, coverageScope: val } : { assignmentId, coverageScope: val.mode, coverageBranchIds: val.branches };
      const res = await fetch('/api/settings/org-structure/assignments', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      return res.json();
    } else {
      // need employeeId from window location
      const parts = window.location.pathname.split('/');
      const empId = parts.includes('employees') ? parts[parts.indexOf('employees') + 1] : '';
      const payload = typeof val === 'string' ? { coverageScope: val } : { coverageScope: val.mode, coverageBranchIds: val.branches };
      // require user to pick an orgUnit first — for now, try to pick first orgUnit from branches prop
      const orgUnitId = props?.defaultOrgUnitId || (branches && branches[0] && branches[0].id) || null;
      if (!orgUnitId) return { error: 'No org unit selected' };
      const res = await fetch(`/api/hr/employees/${empId}/org-assignments/create`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ orgUnitId, ...payload }) });
      return res.json();
    }
  }

  return (
    <div>
      <CoverageScopeSelector value={value} onChange={(v)=>{ setValue(v); save(v); }} branches={branches} />
    </div>
  );
}
