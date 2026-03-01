'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';

type EmployeeOption = { id: string; fullNameAr: string; employeeNumber: string };

type Stage = {
  id: string;
  name: string;
  status: string;
  managerId: string | null;
  deputyId: string | null;
};

export default function StageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const branchId = params.id as string;
  const stageId = params.stageId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stage, setStage] = useState<Stage | null>(null);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [stageEmployees, setStageEmployees] = useState<EmployeeOption[]>([]);
  const [managerId, setManagerId] = useState<string>('');
  const [deputyId, setDeputyId] = useState<string>('');

  const employeeOptions = useMemo(() => {
    return [{ id: '', fullNameAr: '— بدون —', employeeNumber: '' }, ...employees];
  }, [employees]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const [stRes, empRes, stageEmpRes] = await Promise.all([
          fetch(`/api/stages?branchId=${branchId}`),
          fetch(`/api/branches/${branchId}/employees`),
          fetch(`/api/stages/${stageId}/employees`),
        ]);

        if (stRes.ok) {
          const data = await stRes.json();
          const found = (data.stages || []).find((s: any) => s.id === stageId);
          if (found) {
            setStage({
              id: found.id,
              name: found.name,
              status: found.status,
              managerId: found.managerId || null,
              deputyId: found.deputyId || null,
            });
            setManagerId(found.managerId || '');
            setDeputyId(found.deputyId || '');
          }
        }

        if (empRes.ok) {
          const data = await empRes.json();
          setEmployees(data.employees || []);
        }

        if (stageEmpRes.ok) {
          const data = await stageEmpRes.json();
          setStageEmployees(data.employees || []);
        }
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [branchId, stageId]);

  const handleSave = async () => {
    if (!stage) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/stages/${stage.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          managerId: managerId || null,
          deputyId: deputyId || null,
        }),
      });

      if (res.ok) {
        alert('✅ تم حفظ إعدادات المرحلة');
        router.push(`/branches/${branchId}/stages`);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'حدث خطأ أثناء الحفظ');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB' }}>
        <div style={{ textAlign: 'center' }}>جاري التحميل...</div>
      </div>
    );
  }

  if (!stage) {
    return (
      <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
        <Card variant="default" style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ padding: '28px' }}>
            <h3 style={{ margin: 0 }}>المرحلة غير موجودة</h3>
            <div style={{ marginTop: '16px' }}>
              <Button variant="outline" onClick={() => router.push(`/branches/${branchId}/stages`)}>
                رجوع
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <PageHeader
          title={`🎓 إعدادات المرحلة: ${stage.name}`}
          breadcrumbs={['الرئيسية', 'الفروع', 'المراحل', stage.name]}
          actions={
            <>
              <Button variant="outline" onClick={() => router.push(`/branches/${branchId}/stages`)}>
                ← رجوع
              </Button>
            </>
          }
        />

        <Card variant="default">
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Select label="مدير المرحلة" value={managerId} onChange={(e) => setManagerId(e.target.value)}>
              {employeeOptions.map((e) => (
                <option key={e.id || 'none'} value={e.id}>
                  {e.fullNameAr} {e.employeeNumber ? `(${e.employeeNumber})` : ''}
                </option>
              ))}
            </Select>

              <Select label="نائب مدير المرحلة" value={deputyId} onChange={(e) => setDeputyId(e.target.value)}>
                {employeeOptions.map((e) => (
                  <option key={e.id || 'none'} value={e.id}>
                    {e.fullNameAr} {e.employeeNumber ? `(${e.employeeNumber})` : ''}
                  </option>
                ))}
              </Select>
            </div>

            {/* Stage employees */}
            <div style={{ marginTop: '18px', gridColumn: '1 / -1' }}>
              <div style={{ fontWeight: 800, marginBottom: '10px' }}>👥 موظفين المرحلة ({stageEmployees.length})</div>
              {stageEmployees.length === 0 ? (
                <div style={{ color: '#6B7280', fontSize: '14px' }}>ما فيه موظفين مربوطين على هالمرحلة حالياً.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                  {stageEmployees.slice(0, 30).map((e) => (
                    <div key={e.id} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '10px 12px' }}>
                      <div style={{ fontWeight: 800 }}>{e.fullNameAr}</div>
                      <div style={{ color: '#6B7280', fontSize: '13px' }}>{e.employeeNumber}</div>
                    </div>
                  ))}
                </div>
              )}
              {stageEmployees.length > 30 && (
                <div style={{ marginTop: '8px', color: '#6B7280', fontSize: '13px' }}>
                  عرضنا أول 30 فقط.
                </div>
              )}
            </div>

            <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end', gridColumn: '1 / -1' }}>
              <Button variant="secondary" onClick={() => router.push(`/branches/${branchId}/stages`)}>
                إلغاء
              </Button>
              <Button variant="primary" onClick={handleSave} loading={saving}>
                ✅ حفظ
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
