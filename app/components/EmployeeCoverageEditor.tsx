import React, { useEffect, useState } from 'react';
import CoverageScopeSelector from './CoverageScopeSelector';

type Branch = { id: string; name: string };

type Props = { assignmentId: string; branches: Branch[] };

export default function EmployeeCoverageEditor({ assignmentId, branches }: Props){
  const [value, setValue] = useState<string | { mode: string; branches?: string[] }>('BRANCH');
  useEffect(()=>{
    // TODO: load existing assignment via API
  },[assignmentId]);

  const [selectedOrgUnit, setSelectedOrgUnit] = useState<string | null>(branches && branches[0] ? branches[0].id : null);

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
      const orgUnitId = (branches && branches[0] && branches[0].id) || null;
      if (!orgUnitId) return { error: 'No org unit selected' };
      const res = await fetch(`/api/hr/employees/${empId}/org-assignments/create`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ orgUnitId, ...payload }) });
      return res.json();
    }
  }

  return (
    <div>
      {!assignmentId && (
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>اختر وحدة (قسم/مرحلة) للتغطية</label>
          <select value={selectedOrgUnit || ''} onChange={(e)=>setSelectedOrgUnit(e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #E5E7EB' }}>
            <option value="">— اختر وحدة —</option>
            {branches.map(b => (<option key={b.id} value={b.id}>{b.name}</option>))}
          </select>
        </div>
      )}

      <CoverageScopeSelector value={value} onChange={(v)=>{ setValue(v); save(v); }} branches={branches} />
    </div>
  );
}
