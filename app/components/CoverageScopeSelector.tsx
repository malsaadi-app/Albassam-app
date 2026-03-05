import React from 'react';

export default function CoverageScopeSelector({ value, onChange, branches }) {
  return (
    <div className="coverage-scope-selector">
      <label>نطاق التغطية</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="BRANCH">فرع (BRANCH)</option>
        <option value="MULTI_BRANCH">عدة فروع (MULTI_BRANCH)</option>
        <option value="ALL">كل الفروع (ALL)</option>
      </select>
      {value === 'MULTI_BRANCH' && (
        <div className="branch-picker">
          <label>اختر الفروع</label>
          <select multiple onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions).map(o=>o.value);
            onChange({ mode: 'MULTI_BRANCH', branches: selected });
          }}>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}
