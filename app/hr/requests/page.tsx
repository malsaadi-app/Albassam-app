'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Stats } from '@/components/ui/Stats';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Input';
import { useI18n } from '@/lib/useI18n';

export default function HRRequestsPage() {
  const router = useRouter();
  const { locale, dir, t } = useI18n();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/hr/requests?${params}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'PENDING_REVIEW').length,
    approved: requests.filter(r => r.status === 'APPROVED').length,
    rejected: requests.filter(r => r.status === 'REJECTED').length
  };

  const getRequestTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'LEAVE': t('requestTypeLeave'),
      'TRANSFER': t('requestTypeTransfer'),
      'PROMOTION': t('requestTypePromotion'),
      'SALARY_REVIEW': t('requestTypeSalaryReview'),
      'TRAINING': t('requestTypeTraining'),
      'RESIGNATION': t('requestTypeResignation'),
      'COMPLAINT': t('requestTypeComplaint'),
      'CERTIFICATE': t('requestTypeCertificate'),
      'DOCUMENT': t('requestTypeDocument'),
      'OTHER': t('requestTypeOther')
    };
    return typeMap[type] || type;
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
          title={`📋 ${t('hrRequestsTitle')}`}
          breadcrumbs={[t('home'), t('hr'), t('hrRequestsTitle')]}
          actions={
            <Button variant="success" onClick={() => router.push('/hr/requests/new')}>
              ➕ {t('newRequest')}
            </Button>
          }
        />

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          <Stats label={t('totalRequests')} value={stats.total} variant="blue" icon="📋" />
          <Stats label={t('pendingReview')} value={stats.pending} variant="yellow" icon="⏳" />
          <Stats label={t('approved')} value={stats.approved} variant="green" icon="✅" />
          <Stats label={t('rejected')} value={stats.rejected} variant="red" icon="❌" />
        </div>

        <Card variant="default" style={{ marginBottom: '24px' }}>
          <Select
            label={t('filterByStatus')}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">{t('all')}</option>
            <option value="PENDING_REVIEW">{t('pendingReview')}</option>
            <option value="APPROVED">{t('approved')}</option>
            <option value="REJECTED">{t('rejected')}</option>
          </Select>
        </Card>

        {requests.length === 0 ? (
          <Card variant="default">
            <div style={{ padding: '60px 40px', textAlign: 'center' }}>
              <div style={{ fontSize: '80px', marginBottom: '24px' }}>📋</div>
              <h3 style={{ fontSize: '24px', color: '#111827', fontWeight: '800', marginBottom: '12px' }}>
                {t('noRequests')}
              </h3>
              <p style={{ fontSize: '16px', color: '#6B7280', marginBottom: '24px' }}>
                {t('startByCreatingRequest')}
              </p>
              <Button variant="success" onClick={() => router.push('/hr/requests/new')}>
                ➕ {t('newRequest')}
              </Button>
            </div>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {requests.map((request) => (
              <Card
                key={request.id}
                variant="default"
                hover
                onClick={() => router.push(`/hr/requests/${request.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '20px', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 300px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111827' }}>
                        {getRequestTypeLabel(request.requestType)}
                      </h3>
                      {request.requestNumber && (
                        <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600' }}>
                          #{request.requestNumber}
                        </span>
                      )}
                    </div>
                    
                    <p style={{ fontSize: '14px', color: '#6B7280', fontWeight: '600', marginBottom: '8px' }}>
                      👤 {request.employee?.displayName || 'موظف'}
                    </p>
                    
                    {request.description && (
                      <p style={{ fontSize: '13px', color: '#9CA3AF', fontWeight: '600', marginTop: '8px' }}>
                        {request.description.substring(0, 100)}{request.description.length > 100 ? '...' : ''}
                      </p>
                    )}
                    
                    <p style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: '600', marginTop: '8px' }}>
                      📅 {new Date(request.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                    <Badge variant={
                      request.status === 'PENDING_REVIEW' ? 'yellow' : 
                      request.status === 'APPROVED' ? 'green' : 
                      'red'
                    }>
                      {request.status === 'PENDING_REVIEW' ? 'قيد المراجعة' : 
                       request.status === 'APPROVED' ? 'موافق' : 
                       'مرفوض'}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
