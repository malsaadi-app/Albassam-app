'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Input, Select } from '@/components/ui/Input';

export default function BulkEditEmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [bulkAction, setBulkAction] = useState({
    field: '',
    value: ''
  });

  useEffect(() => {
    checkPermission();
    fetchEmployees();
  }, []);

  const checkPermission = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user.role !== 'ADMIN' && data.user.role !== 'HR_EMPLOYEE') {
          alert('غير مصرح لك بالتعديل الجماعي');
          router.push('/hr/employees');
        }
      }
    } catch (error) {
      console.error('Error checking permission:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/hr/employees');
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleEmployee = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const selectAll = () => {
    setSelectedIds(new Set(employees.map((e) => e.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedIds.size === 0) {
      alert('الرجاء اختيار موظف واحد على الأقل');
      return;
    }

    if (!bulkAction.field || !bulkAction.value) {
      alert('الرجاء تعبئة الحقول المطلوبة');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/hr/employees/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeIds: Array.from(selectedIds),
          field: bulkAction.field,
          value: bulkAction.value
        })
      });

      if (res.ok) {
        alert(`تم تحديث ${selectedIds.size} موظف بنجاح`);
        router.push('/hr/employees');
      } else {
        const data = await res.json();
        alert(data.error || 'حدث خطأ');
      }
    } catch (error) {
      console.error('Error bulk updating:', error);
      alert('حدث خطأ أثناء التحديث');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB' }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #E5E7EB',
          borderTop: '4px solid #3B82F6',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}></div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <PageHeader
          title="✏️ التعديل الجماعي للموظفين"
          breadcrumbs={['الرئيسية', 'شؤون الموظفين', 'الموظفين', 'تعديل جماعي']}
          actions={
            <Button variant="outline" onClick={() => router.push('/hr/employees')}>
              ← رجوع
            </Button>
          }
        />

        <Card variant="default" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111827' }}>
              المحدد: {selectedIds.size} من {employees.length}
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="outline" size="sm" onClick={selectAll}>
                اختيار الكل
              </Button>
              <Button variant="outline" size="sm" onClick={deselectAll}>
                إلغاء التحديد
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              <Select
                label="الحقل المراد تعديله *"
                value={bulkAction.field}
                onChange={(e) => setBulkAction({ ...bulkAction, field: e.target.value })}
                required
              >
                <option value="">اختر...</option>
                <option value="department">القسم</option>
                <option value="status">الحالة</option>
                <option value="systemRoleId">صلاحيات النظام</option>
              </Select>

              <Input
                label="القيمة الجديدة *"
                value={bulkAction.value}
                onChange={(e) => setBulkAction({ ...bulkAction, value: e.target.value })}
                required
              />
            </div>

            <Button type="submit" variant="success" loading={saving} disabled={selectedIds.size === 0}>
              💾 تطبيق التعديلات على {selectedIds.size} موظف
            </Button>
          </form>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {employees.map((emp) => (
            <Card
              key={emp.id}
              variant="default"
              hover
              onClick={() => toggleEmployee(emp.id)}
              style={{
                cursor: 'pointer',
                border: selectedIds.has(emp.id) ? '2px solid #3B82F6' : undefined,
                background: selectedIds.has(emp.id) ? '#EFF6FF' : undefined
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  type="checkbox"
                  checked={selectedIds.has(emp.id)}
                  onChange={() => toggleEmployee(emp.id)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  onClick={(e) => e.stopPropagation()}
                />
                <div>
                  <p style={{ fontSize: '16px', fontWeight: '800', color: '#111827', marginBottom: '4px' }}>
                    {emp.displayName}
                  </p>
                  <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600' }}>
                    {emp.position} • {emp.department}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
