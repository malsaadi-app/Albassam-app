'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { getInitialLocale } from '@/lib/i18n';

// Dynamic import for heavy modal (578 lines - only load when needed)
const AddQuotationModal = dynamic(() => import('./AddQuotationModal'), {
  loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6">
      <div className="text-center text-gray-700">جاري التحميل...</div>
    </div>
  </div>,
  ssr: false,
});

interface Quotation {
  id: string;
  quotationNumber: string;
  supplier: {
    id: string;
    name: string;
    contactPerson: string | null;
    email: string | null;
    phone: string | null;
    rating: number;
  };
  quotedItems: string;
  totalAmount: number;
  validUntil: string | null;
  paymentTerms: string | null;
  deliveryTime: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
}

const statusLabels: Record<string, string> = {
  PENDING: 'معلق',
  ACCEPTED: 'مقبول',
  REJECTED: 'مرفوض',
  EXPIRED: 'منتهي'
};

const getStatusVariant = (status: string): 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray' => {
  switch (status) {
    case 'PENDING': return 'yellow';
    case 'ACCEPTED': return 'green';
    case 'REJECTED': return 'red';
    case 'EXPIRED': return 'gray';
    default: return 'gray';
  }
};

export default function QuotationsComparisonPage() {
  const router = useRouter();
  const params = useParams();
  const requestId = params.id as string;
  
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [requestItems, setRequestItems] = useState<any[]>([]);

  useEffect(() => {
    if (requestId) {
      fetchData();
    }
  }, [requestId]);

  const fetchData = async () => {
    await Promise.all([
      fetchQuotations(),
      fetchRequest()
    ]);
  };

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/procurement/quotations?purchaseRequestId=${requestId}`);
      if (res.ok) {
        const data = await res.json();
        setQuotations(data.quotations);
      }
    } catch (error) {
      console.error('Error fetching quotations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequest = async () => {
    try {
      const res = await fetch(`/api/procurement/requests/${requestId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.request && data.request.items) {
          setRequestItems(data.request.items);
        }
      }
    } catch (error) {
      console.error('Error fetching request:', error);
    }
  };

  const handleAcceptQuotation = async (quotationId: string) => {
    if (!confirm('هل أنت متأكد من قبول هذا العرض؟')) {
      return;
    }

    try {
      setActionLoading(true);

      const res = await fetch(`/api/procurement/quotations/${quotationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACCEPTED' })
      });

      if (res.ok) {
        const otherQuotations = quotations.filter(q => q.id !== quotationId);
        await Promise.all(
          otherQuotations.map(q =>
            fetch(`/api/procurement/quotations/${q.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'REJECTED' })
            })
          )
        );

        alert('✅ تم قبول العرض بنجاح');
        fetchQuotations();
      } else {
        alert('❌ حدث خطأ أثناء قبول العرض');
      }
    } catch (error) {
      console.error('Error accepting quotation:', error);
      alert('❌ حدث خطأ أثناء قبول العرض');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectQuotation = async (quotationId: string) => {
    if (!confirm('هل أنت متأكد من رفض هذا العرض؟')) {
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetch(`/api/procurement/quotations/${quotationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED' })
      });

      if (res.ok) {
        alert('✅ تم رفض العرض');
        fetchQuotations();
      } else {
        alert('❌ حدث خطأ أثناء رفض العرض');
      }
    } catch (error) {
      console.error('Error rejecting quotation:', error);
      alert('❌ حدث خطأ أثناء رفض العرض');
    } finally {
      setActionLoading(false);
    }
  };

  const getRatingStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(i < fullStars ? '⭐' : '☆');
    }
    return stars.join('');
  };

  const bestPrice = quotations.length > 0 
    ? Math.min(...quotations.filter(q => q.status === 'PENDING').map(q => q.totalAmount))
    : 0;

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
        {/* Page Header */}
        <PageHeader
          title="💰 مقارنة عروض الأسعار"
          breadcrumbs={['الرئيسية', 'المشتريات', 'الطلبات', 'عروض الأسعار']}
          actions={
            <>
              <Button variant="outline" onClick={() => router.push(`/procurement/requests/${requestId}`)}>
                ← رجوع للطلب
              </Button>
              <Button variant="success" onClick={() => setShowAddModal(true)}>
                + إضافة عرض سعر
              </Button>
            </>
          }
        />

        {/* Summary Stats */}
        {quotations.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '32px'
          }}>
            <Card variant="elevated" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }}>
              <div style={{ textAlign: 'center', padding: '20px', color: '#FFFFFF' }}>
                <p style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>إجمالي العروض</p>
                <p style={{ fontSize: '36px', fontWeight: '800', margin: 0 }}>{quotations.length}</p>
              </div>
            </Card>

            {bestPrice > 0 && (
              <Card variant="elevated" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}>
                <div style={{ textAlign: 'center', padding: '20px', color: '#FFFFFF' }}>
                  <p style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>أفضل سعر</p>
                  <p style={{ fontSize: '28px', fontWeight: '800', margin: 0 }}>
                    {bestPrice.toLocaleString('ar-SA')} ر.س
                  </p>
                </div>
              </Card>
            )}

            <Card variant="elevated" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}>
              <div style={{ textAlign: 'center', padding: '20px', color: '#FFFFFF' }}>
                <p style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>معلقة</p>
                <p style={{ fontSize: '36px', fontWeight: '800', margin: 0 }}>
                  {quotations.filter(q => q.status === 'PENDING').length}
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* Quotations List */}
        {quotations.length === 0 ? (
          <Card variant="default">
            <div style={{ padding: '60px 40px', textAlign: 'center' }}>
              <div style={{ fontSize: '80px', marginBottom: '24px' }}>💰</div>
              <h3 style={{ fontSize: '24px', color: '#111827', fontWeight: '800', marginBottom: '12px' }}>
                لا توجد عروض أسعار
              </h3>
              <p style={{ fontSize: '16px', color: '#6B7280', marginBottom: '24px' }}>
                لم يتم إضافة عروض أسعار لهذا الطلب بعد
              </p>
              <Button variant="primary" onClick={() => setShowAddModal(true)}>
                + إضافة عرض سعر
              </Button>
            </div>
          </Card>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', 
            gap: '20px' 
          }}>
            {quotations.map((quotation) => {
              const items = JSON.parse(quotation.quotedItems);
              const isBestPrice = quotation.totalAmount === bestPrice && quotation.status === 'PENDING';

              return (
                <Card
                  key={quotation.id}
                  variant={isBestPrice ? 'elevated' : 'default'}
                  style={{
                    position: 'relative',
                    border: isBestPrice ? '2px solid #10B981' : undefined
                  }}
                >
                  {/* Best Price Badge */}
                  {isBestPrice && (
                    <div style={{
                      position: 'absolute',
                      top: '-12px',
                      right: '20px',
                      padding: '6px 16px',
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#FFFFFF',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                    }}>
                      🏆 أفضل سعر
                    </div>
                  )}

                  {/* Header */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'start',
                    marginBottom: '16px',
                    paddingTop: isBestPrice ? '12px' : '0'
                  }}>
                    <div>
                      <h3 style={{ 
                        fontSize: '16px', 
                        fontWeight: '800', 
                        color: '#111827',
                        marginBottom: '4px'
                      }}>
                        {quotation.quotationNumber}
                      </h3>
                      <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600' }}>
                        📅 {new Date(quotation.createdAt).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                    <Badge variant={getStatusVariant(quotation.status)}>
                      {statusLabels[quotation.status]}
                    </Badge>
                  </div>

                  {/* Supplier Info */}
                  <div style={{
                    background: '#F9FAFB',
                    padding: '16px',
                    borderRadius: '12px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ 
                      fontSize: '16px', 
                      fontWeight: '800', 
                      color: '#111827',
                      marginBottom: '8px'
                    }}>
                      🏪 {quotation.supplier.name}
                    </div>
                    <div style={{ fontSize: '14px', color: '#F59E0B', marginBottom: '8px' }}>
                      {getRatingStars(quotation.supplier.rating)} ({quotation.supplier.rating.toFixed(1)})
                    </div>
                    {quotation.supplier.contactPerson && (
                      <div style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600' }}>
                        👤 {quotation.supplier.contactPerson}
                      </div>
                    )}
                    {quotation.supplier.phone && (
                      <div style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600' }}>
                        📞 {quotation.supplier.phone}
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  <div style={{
                    background: isBestPrice ? '#D1FAE5' : '#F9FAFB',
                    padding: '16px',
                    borderRadius: '12px',
                    marginBottom: '16px',
                    border: isBestPrice ? '1px solid #6EE7B7' : undefined
                  }}>
                    <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600', marginBottom: '4px' }}>
                      السعر الإجمالي
                    </p>
                    <p style={{ 
                      fontSize: '28px', 
                      fontWeight: '800', 
                      color: isBestPrice ? '#059669' : '#111827',
                      margin: 0
                    }}>
                      {quotation.totalAmount.toLocaleString('ar-SA')} ر.س
                    </p>
                  </div>

                  {/* Items */}
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ 
                      fontSize: '14px', 
                      fontWeight: '700', 
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      الأصناف ({items.length}):
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {items.slice(0, 3).map((item: any, idx: number) => (
                        <p key={idx} style={{ 
                          fontSize: '13px', 
                          color: '#6B7280',
                          fontWeight: '600',
                          margin: 0
                        }}>
                          • {item.name} ({item.quantity} × {item.unitPrice?.toLocaleString('ar-SA')} ر.س)
                        </p>
                      ))}
                      {items.length > 3 && (
                        <p style={{ fontSize: '13px', color: '#9CA3AF', fontWeight: '600', margin: 0 }}>
                          + {items.length - 3} أصناف أخرى
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div style={{ 
                    fontSize: '13px', 
                    color: '#6B7280',
                    fontWeight: '600',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    marginBottom: '16px'
                  }}>
                    {quotation.validUntil && (
                      <div>⏰ صالح حتى: {new Date(quotation.validUntil).toLocaleDateString('ar-SA')}</div>
                    )}
                    {quotation.deliveryTime && (
                      <div>🚚 مدة التوصيل: {quotation.deliveryTime}</div>
                    )}
                    {quotation.paymentTerms && (
                      <div>💳 شروط الدفع: {quotation.paymentTerms}</div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '12px', marginBottom: quotation.status === 'PENDING' ? '12px' : '0' }}>
                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => {
                        const locale = getInitialLocale();
                        window.open(`/print/procurement/quotations/${quotation.id}?locale=${locale}`, '_blank');
                      }}
                      style={{ flex: 1 }}
                    >
                      🖨️ طباعة
                    </Button>
                  </div>

                  {quotation.status === 'PENDING' && (
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <Button
                        variant="success"
                        size="md"
                        onClick={() => handleAcceptQuotation(quotation.id)}
                        disabled={actionLoading}
                        style={{ flex: 1 }}
                      >
                        ✓ قبول
                      </Button>
                      <Button
                        variant="danger"
                        size="md"
                        onClick={() => handleRejectQuotation(quotation.id)}
                        disabled={actionLoading}
                        style={{ flex: 1 }}
                      >
                        ✗ رفض
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* Add Modal */}
        <AddQuotationModal
          isOpen={showAddModal}
          purchaseRequestId={requestId}
          requestItems={requestItems}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchQuotations();
          }}
        />
      </div>
    </div>
  );
}
