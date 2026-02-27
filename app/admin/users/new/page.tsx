'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
export default function NewUserPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', displayName: '', role: 'USER' });
  const handleSubmit = async () => {
    if (!form.username) { alert('اسم المستخدم مطلوب'); return; }
    const res = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) { alert('تم إنشاء المستخدم'); router.push('/admin/users'); } else { alert('حدث خطأ'); }
  };
  return (<div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}><div style={{ maxWidth: '800px', margin: '0 auto' }}><PageHeader title="➕ إضافة مستخدم" breadcrumbs={['الرئيسية', 'المستخدمين', 'جديد']} /><div style={{ background: 'white', borderRadius: '12px', padding: '24px' }}><div style={{ display: 'grid', gap: '16px' }}><div><label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>اسم المستخدم *</label><input type="text" value={form.username} onChange={(e) => setForm({...form, username: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px' }} /></div><div><label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>الاسم المعروض *</label><input type="text" value={form.displayName} onChange={(e) => setForm({...form, displayName: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px' }} /></div><div><label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>الدور</label><select value={form.role} onChange={(e) => setForm({...form, role: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px' }}><option value="USER">مستخدم</option><option value="ADMIN">مدير</option><option value="HR_EMPLOYEE">موارد بشرية</option></select></div></div><div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}><button onClick={handleSubmit} style={{ padding: '10px 24px', background: '#10B981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>إنشاء</button><button onClick={() => router.back()} style={{ padding: '10px 24px', background: '#6B7280', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>إلغاء</button></div></div></div></div>);
}
