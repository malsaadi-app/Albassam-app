'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Stats } from '@/components/ui/Stats';
import { Badge } from '@/components/ui/Badge';

export default function ApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/hr/applications');
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'PENDING').length,
    approved: applications.filter(a => a.status === 'APPROVED').length,
    rejected: applications.filter(a => a.status === 'REJECTED').length
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
          title="📋 طلبات التوظيف"
          breadcrumbs={['الرئيسية', 'الموارد البشرية', 'التوظيف']}
          actions={
            <Button variant="success" onClick={() => router.push('/hr/applications/new')}>
              ➕ طلب جديد
            </Button>
          }
        />

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          <Stats label="إجمالي الطلبات" value={stats.total} variant="blue" icon="📋" />
          <Stats label="معلقة" value={stats.pending} variant="yellow" icon="⏳" />
          <Stats label="مقبولة" value={stats.approved} variant="green" icon="✅" />
          <Stats label="مرفوضة" value={stats.rejected} variant="red" icon="❌" />
        </div>

        {applications.length === 0 ? (
          <Card variant="default">
            <div style={{ padding: '60px 40px', textAlign: 'center' }}>
              <div style={{ fontSize: '80px', marginBottom: '24px' }}>📋</div>
              <h3 style={{ fontSize: '24px', color: '#111827', fontWeight: '800', marginBottom: '12px' }}>
                لا توجد طلبات توظيف
              </h3>
              <Button variant="success" onClick={() => router.push('/hr/applications/new')}>
                ➕ طلب جديد
              </Button>
            </div>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {applications.map((app) => (
              <Card key={app.id} variant="default" hover onClick={() => router.push(`/hr/applications/${app.id}`)} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '20px' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', marginBottom: '8px' }}>
                      {app.name}
                    </h3>
                    <p style={{ fontSize: '14px', color: '#6B7280', fontWeight: '600' }}>
                      {app.position}
                    </p>
                    <p style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '8px' }}>
                      📅 {new Date(app.createdAt).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                  <Badge variant={app.status === 'PENDING' ? 'yellow' : app.status === 'APPROVED' ? 'green' : 'red'}>
                    {app.status === 'PENDING' ? 'معلق' : app.status === 'APPROVED' ? 'مقبول' : 'مرفوض'}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
