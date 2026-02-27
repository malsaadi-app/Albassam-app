'use client';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch('/api/admin/audit-log').then(r => r.ok ? r.json() : []).then(d => { setLogs(Array.isArray(d) ? d : d.logs || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);
  if (loading) return (<div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}><div style={{ maxWidth: '1200px', margin: '0 auto' }}><PageHeader title="📜 سجل التدقيق" breadcrumbs={['الرئيسية', 'الإدارة', 'التدقيق']} /><div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '12px' }}><div style={{ fontSize: '24px' }}>⏳</div><div style={{ marginTop: '12px', color: '#6B7280' }}>جاري التحميل...</div></div></div></div>);
  return (<div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}><div style={{ maxWidth: '1200px', margin: '0 auto' }}><PageHeader title="📜 سجل التدقيق" breadcrumbs={['الرئيسية', 'الإدارة', 'التدقيق']} /><div style={{ background: 'white', borderRadius: '12px', padding: '20px' }}>{logs.length === 0 ? (<div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}><div style={{ fontSize: '48px' }}>📋</div><div>لا توجد سجلات</div></div>) : (<div style={{ display: 'grid', gap: '8px' }}>{logs.map((log: any, i: number) => (<div key={i} style={{ border: '1px solid #E5E7EB', borderRadius: '6px', padding: '12px', fontSize: '14px' }}><strong>{log.action || log.type}</strong> - {log.user || log.userId} - {new Date(log.createdAt || log.timestamp).toLocaleString('ar-SA')}</div>))}</div>)}</div></div></div>);
}
