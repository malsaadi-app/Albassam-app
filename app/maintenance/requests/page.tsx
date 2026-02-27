'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Stats } from '@/components/ui/Stats';
import { Badge } from '@/components/ui/Badge';
import { useI18n } from '@/lib/useI18n';

export default function MaintenanceRequestsPage() {
  const router = useRouter();
  const { locale, dir, t } = useI18n();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/maintenance/requests');
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'PENDING').length,
    inProgress: requests.filter(r => r.status === 'IN_PROGRESS').length,
    completed: requests.filter(r => r.status === 'COMPLETED').length
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
    <div dir={dir} style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <PageHeader
          title={`🔧 ${t('maintenanceRequestsPageTitle')}`}
          breadcrumbs={[t('home'), t('maintenance'), t('maintenanceRequestsPageBreadcrumb')]}
          actions={
            <Button variant="success" onClick={() => router.push('/maintenance/requests/new')}>
              ➕ {t('newMaintenanceRequest')}
            </Button>
          }
        />

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          <Stats label={t('totalMaintenanceRequests')} value={stats.total} variant="blue" icon="🔧" />
          <Stats label={t('pendingMaintenance')} value={stats.pending} variant="yellow" icon="⏳" />
          <Stats label={t('inProgressMaintenance')} value={stats.inProgress} variant="purple" icon="⚙️" />
          <Stats label={t('completedMaintenance')} value={stats.completed} variant="green" icon="✅" />
        </div>

        {requests.length === 0 ? (
          <Card variant="default">
            <div style={{ padding: '60px 40px', textAlign: 'center' }}>
              <div style={{ fontSize: '80px', marginBottom: '24px' }}>🔧</div>
              <h3 style={{ fontSize: '24px', color: '#111827', fontWeight: '800', marginBottom: '12px' }}>
                {t('noMaintenanceRequests')}
              </h3>
              <Button variant="success" onClick={() => router.push('/maintenance/requests/new')}>
                ➕ {t('newMaintenanceRequest')}
              </Button>
            </div>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {requests.map((req) => (
              <Card key={req.id} variant="default" hover onClick={() => router.push(`/maintenance/requests/${req.id}`)} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '20px' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', marginBottom: '8px' }}>
                      {req.title || 'طلب صيانة'}
                    </h3>
                    {req.asset && (
                      <p style={{ fontSize: '14px', color: '#6B7280', fontWeight: '600' }}>
                        🏢 {req.asset.name}
                      </p>
                    )}
                    <p style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '8px' }}>
                      📅 {new Date(req.createdAt).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                  <Badge variant={req.status === 'PENDING' ? 'yellow' : req.status === 'IN_PROGRESS' ? 'purple' : 'green'}>
                    {req.status === 'PENDING' ? 'معلقة' : req.status === 'IN_PROGRESS' ? 'قيد التنفيذ' : 'مكتملة'}
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
