import React from 'react';

type Branch = { id: string; name: string };

type Props = {
  value: string | { mode: string; branches?: string[] };
  onChange: (v: any) => void;
  branches: Branch[];
};

export default function CoverageScopeSelector({ value, onChange, branches }: Props) {
  return (
    <div className="coverage-scope-selector">
      <label>نطاق التغطية</label>
      <select value={typeof value === 'string' ? value : value?.mode} onChange={(e) => onChange(e.target.value)}>
        <option value="BRANCH">فرع (BRANCH)</option>
        <option value="MULTI_BRANCH">عدة فروع (MULTI_BRANCH)</option>
        <option value="ALL">كل الفروع (ALL)</option>
      </select>
      { (typeof value === 'string' ? value === 'MULTI_BRANCH' : value?.mode === 'MULTI_BRANCH') && (
        <div className="branch-picker">
          <label>اختر الفروع</label>
          <select multiple onChange={(e) => {
            const selected = Array.from((e.target as HTMLSelectElement).selectedOptions).map(o=>o.value);
            onChange({ mode: 'MULTI_BRANCH', branches: selected });
          }}>
            {branches.map((b: Branch) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}
