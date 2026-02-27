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

interface PurchaseRequest {
  id: string;
  requestNumber: string;
  department: string;
  category: string;
  priority: string;
  status: string;
  estimatedBudget: number | null;
  requiredDate: string | null;
  createdAt: string;
  requestedBy: {
    id: string;
    displayName: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    specifications?: string;
    estimatedPrice?: number;
  }>;
}

const getStatusVariant = (status: string): 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray' => {
  switch (status) {
    case 'PENDING_REVIEW': return 'yellow';
    case 'REVIEWED': return 'blue';
    case 'APPROVED': return 'green';
    case 'REJECTED': return 'red';
    case 'IN_PROGRESS': return 'purple';
    case 'COMPLETED': return 'gray';
    case 'CANCELLED': return 'gray';
    default: return 'gray';
  }
};

export default function ProcurementRequestsPage() {
  const router = useRouter();
  const { locale, dir, t } = useI18n();
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  
  const getStatusLabel = (status: string): string => {
    const map: Record<string, string> = {
      'PENDING_REVIEW': t('statusPendingReview'),
      'REVIEWED': t('statusReviewed'),
      'APPROVED': t('statusApproved'),
      'REJECTED': t('statusRejected'),
      'IN_PROGRESS': t('statusInProgress'),
      'COMPLETED': t('statusCompleted'),
      'CANCELLED': t('statusCancelled')
    };
    return map[status] || status;
  };
  
  const getCategoryLabel = (category: string): string => {
    const map: Record<string, string> = {
      'SUPPLIES': t('categorySupplies'),
      'EQUIPMENT': t('categoryEquipment'),
      'SERVICES': t('categoryServices'),
      'MAINTENANCE': t('categoryMaintenance'),
      'OTHER': t('categoryOther')
    };
    return map[category] || category;
  };
  
  const getPriorityLabel = (priority: string): string => {
    const map: Record<string, string> = {
      'LOW': t('priorityLow'),
      'MEDIUM': t('priorityMedium'),
      'HIGH': t('priorityHigh'),
      'URGENT': t('priorityUrgent')
    };
    return map[priority] || priority;
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/procurement/requests');
      if (res.status === 401) {
        router.push('/');
        return;
      }
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

  const filteredRequests = requests.filter(req => {
    if (statusFilter !== 'ALL' && req.status !== statusFilter) return false;
    if (categoryFilter !== 'ALL' && req.category !== categoryFilter) return false;
    if (priorityFilter !== 'ALL' && req.priority !== priorityFilter) return false;
    return true;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'PENDING_REVIEW').length,
    approved: requests.filter(r => r.status === 'APPROVED').length,
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
        {/* Page Header */}
        <PageHeader
          title={`🛒 ${t('procurementRequestsTitle')}`}
          breadcrumbs={[t('home'), t('procurement'), t('procurementRequestsTitle')]}
          actions={
            <Button variant="primary" onClick={() => router.push('/procurement/requests/new')}>
              + {t('newRequest')}
            </Button>
          }
        />

        {/* Statistics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          <Stats label={t('totalRequests')} value={stats.total} variant="blue" icon="📋" />
          <Stats label={t('statusPending')} value={stats.pending} variant="yellow" icon="⏳" />
          <Stats label={t('statusApproved')} value={stats.approved} variant="green" icon="✅" />
          <Stats label={t('statusInProgress')} value={stats.inProgress} variant="purple" icon="⚡" />
          <Stats label={t('statusCompleted')} value={stats.completed} variant="gray" icon="🏁" />
        </div>

        {/* Filters */}
        <Card variant="default" className="mb-6">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ flex: '1 1 200px' }}>
              <Select
                label={t('status')}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">{t('allStatuses')}</option>
                {['PENDING_REVIEW', 'REVIEWED', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((key) => (
                  <option key={key} value={key}>{getStatusLabel(key)}</option>
                ))}
              </Select>
            </div>

            <div style={{ flex: '1 1 200px' }}>
              <Select
                label={t('category')}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="ALL">{t('allCategories')}</option>
                {['SUPPLIES', 'EQUIPMENT', 'SERVICES', 'MAINTENANCE', 'OTHER'].map((key) => (
                  <option key={key} value={key}>{getCategoryLabel(key)}</option>
                ))}
              </Select>
            </div>

            <div style={{ flex: '1 1 200px' }}>
              <Select
                label={t('priority')}
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="ALL">{t('allPriorities')}</option>
                {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((key) => (
                  <option key={key} value={key}>{getPriorityLabel(key)}</option>
                ))}
              </Select>
            </div>
          </div>
        </Card>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <Card variant="default">
            <div style={{ padding: '60px 40px', textAlign: 'center' }}>
              <div style={{ fontSize: '80px', marginBottom: '24px' }}>📦</div>
              <h3 style={{ fontSize: '24px', color: '#111827', fontWeight: '800', marginBottom: '12px' }}>
                {t('noPurchaseRequests')}
              </h3>
              <p style={{ fontSize: '16px', color: '#6B7280', marginBottom: '24px' }}>
                {t('startByCreatingPurchaseRequest')}
              </p>
              <Button variant="primary" onClick={() => router.push('/procurement/requests/new')}>
                + {t('createRequest')}
              </Button>
            </div>
          </Card>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {filteredRequests.map((request) => (
              <Card 
                key={request.id} 
                variant="default" 
                hover
                onClick={() => router.push(`/procurement/requests/${request.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', gap: '20px', alignItems: 'start', flexWrap: 'wrap' }}>
                  {/* Left Section */}
                  <div style={{ flex: '1 1 300px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', margin: 0 }}>
                        {request.requestNumber}
                      </h3>
                      <Badge variant={getStatusVariant(request.status)}>
                        {getStatusLabel(request.status)}
                      </Badge>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                      <p style={{ fontSize: '14px', color: '#6B7280', fontWeight: '600', margin: 0 }}>
                        <span style={{ fontWeight: '700', color: '#374151' }}>{t('department')}:</span> {request.department}
                      </p>
                      <p style={{ fontSize: '14px', color: '#6B7280', fontWeight: '600', margin: 0 }}>
                        <span style={{ fontWeight: '700', color: '#374151' }}>{t('category')}:</span> {getCategoryLabel(request.category)}
                      </p>
                      <p style={{ fontSize: '14px', color: '#6B7280', fontWeight: '600', margin: 0 }}>
                        <span style={{ fontWeight: '700', color: '#374151' }}>{t('priority')}:</span> {getPriorityLabel(request.priority)}
                      </p>
                    </div>

                    <div style={{ fontSize: '13px', color: '#9CA3AF', fontWeight: '600' }}>
                      👤 {request.requestedBy.displayName} • 📅 {new Date(request.createdAt).toLocaleDateString('ar-SA')}
                    </div>
                  </div>

                  {/* Right Section */}
                  <div style={{ flex: '1 1 300px' }}>
                    {request.estimatedBudget && (
                      <div style={{
                        background: '#F9FAFB',
                        padding: '16px',
                        borderRadius: '12px',
                        marginBottom: '12px'
                      }}>
                        <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600', marginBottom: '4px' }}>
                          {t('estimatedBudget')}
                        </p>
                        <p style={{ fontSize: '20px', fontWeight: '800', color: '#059669', margin: 0 }}>
                          {request.estimatedBudget.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')} {locale === 'ar' ? 'ر.س' : 'SAR'}
                        </p>
                      </div>
                    )}

                    {request.items.length > 0 && (
                      <div>
                        <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: '700', marginBottom: '8px' }}>
                          {t('items')} ({request.items.length}):
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {request.items.slice(0, 3).map((item, idx) => (
                            <p key={idx} style={{ fontSize: '13px', color: '#374151', fontWeight: '600', margin: 0 }}>
                              • {item.name} ({item.quantity} {item.unit})
                            </p>
                          ))}
                          {request.items.length > 3 && (
                            <p style={{ fontSize: '13px', color: '#9CA3AF', fontWeight: '600', margin: 0 }}>
                              + {request.items.length - 3} {t('item')}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
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
