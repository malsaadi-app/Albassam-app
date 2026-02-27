'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Input';
import AttachmentsViewer from '@/components/AttachmentsViewer';

interface PurchaseRequest {
  id: string;
  requestNumber: string;
  department: string;
  category: string;
  priority: string;
  status: string;
  estimatedBudget: number | null;
  requiredDate: string | null;
  justification: string | null;
  reviewNotes: string | null;
  approvalNotes: string | null;
  rejectedReason: string | null;
  attachments: string | null;
  createdAt: string;
  requestedBy: {
    id: string;
    displayName: string;
  };
  reviewedBy?: {
    id: string;
    displayName: string;
  };
  reviewedAt?: string;
  approvedBy?: {
    id: string;
    displayName: string;
  };
  approvedAt?: string;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    specifications?: string;
    estimatedPrice?: number;
  }>;
}

const statusLabels: Record<string, string> = {
  PENDING_REVIEW: 'معلق',
  REVIEWED: 'تمت المراجعة',
  APPROVED: 'تمت الموافقة',
  REJECTED: 'مرفوض',
  IN_PROGRESS: 'قيد التنفيذ',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغي'
};

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

const categoryLabels: Record<string, string> = {
  STATIONERY: 'قرطاسية',
  CLEANING: 'نظافة',
  MAINTENANCE: 'صيانة',
  FOOD: 'مواد غذائية',
  EQUIPMENT: 'معدات',
  TECHNOLOGY: 'تقنية',
  FURNITURE: 'أثاث',
  TEXTBOOKS: 'كتب دراسية',
  UNIFORMS: 'زي مدرسي',
  OTHER: 'أخرى'
};

const priorityLabels: Record<string, string> = {
  LOW: 'منخفضة',
  NORMAL: 'عادية',
  HIGH: 'عالية',
  URGENT: 'عاجلة'
};

const getPriorityVariant = (priority: string): 'blue' | 'green' | 'yellow' | 'red' => {
  switch (priority) {
    case 'LOW': return 'gray' as any;
    case 'NORMAL': return 'blue';
    case 'HIGH': return 'yellow';
    case 'URGENT': return 'red';
    default: return 'gray' as any;
  }
};

export default function PurchaseRequestDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [request, setRequest] = useState<PurchaseRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  
  const [reviewNotes, setReviewNotes] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const fetchRequest = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/procurement/requests/${id}`);
      const data = await response.json();

      if (response.ok) {
        setRequest(data.request);
      } else {
        setError(data.error || 'حدث خطأ');
      }
    } catch (error) {
      console.error('Error fetching request:', error);
      setError('حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/procurement/requests/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: reviewNotes })
      });

      const data = await response.json();

      if (response.ok) {
        setRequest(data.request);
        setShowReviewModal(false);
        setReviewNotes('');
      } else {
        alert(data.error || 'حدث خطأ');
      }
    } catch (error) {
      console.error('Error reviewing request:', error);
      alert('حدث خطأ أثناء المراجعة');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/procurement/requests/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: approvalNotes })
      });

      const data = await response.json();

      if (response.ok) {
        setRequest(data.request);
        setShowApproveModal(false);
        setApprovalNotes('');
      } else {
        alert(data.error || 'حدث خطأ');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert('حدث خطأ أثناء الموافقة');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('يرجى إدخال سبب الرفض');
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`/api/procurement/requests/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason })
      });

      const data = await response.json();

      if (response.ok) {
        setRequest(data.request);
        setShowRejectModal(false);
        setRejectReason('');
      } else {
        alert(data.error || 'حدث خطأ');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('حدث خطأ أثناء الرفض');
    } finally {
      setActionLoading(false);
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

  if (error || !request) {
    return (
      <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
        <Card variant="default" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ padding: '60px 40px', textAlign: 'center' }}>
            <div style={{ fontSize: '80px', marginBottom: '24px' }}>❌</div>
            <h3 style={{ fontSize: '24px', color: '#111827', fontWeight: '800', marginBottom: '12px' }}>
              {error || 'الطلب غير موجود'}
            </h3>
            <Button variant="primary" onClick={() => router.push('/procurement/requests')}>
              العودة للقائمة
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const totalEstimatedCost = request.items.reduce(
    (sum, item) => sum + (item.estimatedPrice || 0) * item.quantity,
    0
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Page Header */}
        <PageHeader
          title={`📦 ${request.requestNumber}`}
          breadcrumbs={['الرئيسية', 'المشتريات', 'طلبات الشراء', request.requestNumber]}
          actions={
            <>
              <Button variant="outline" onClick={() => router.push('/procurement/requests')}>
                ← رجوع
              </Button>
              
              {(request.status === 'APPROVED' || request.status === 'IN_PROGRESS') && (
                <Button variant="warning" onClick={() => router.push(`/procurement/requests/${id}/quotations`)}>
                  💰 عروض الأسعار
                </Button>
              )}
              
              {request.status === 'PENDING_REVIEW' && (
                <>
                  <Button variant="primary" onClick={() => setShowReviewModal(true)}>
                    📋 مراجعة
                  </Button>
                  <Button variant="success" onClick={() => setShowApproveModal(true)}>
                    ✓ موافقة
                  </Button>
                  <Button variant="danger" onClick={() => setShowRejectModal(true)}>
                    ✗ رفض
                  </Button>
                </>
              )}

              {request.status === 'REVIEWED' && (
                <>
                  <Button variant="success" onClick={() => setShowApproveModal(true)}>
                    ✓ موافقة
                  </Button>
                  <Button variant="danger" onClick={() => setShowRejectModal(true)}>
                    ✗ رفض
                  </Button>
                </>
              )}
            </>
          }
        />

        {/* Status & Priority Badges */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <Badge variant={getStatusVariant(request.status)}>
            {statusLabels[request.status]}
          </Badge>
          <Badge variant={getPriorityVariant(request.priority)}>
            الأولوية: {priorityLabels[request.priority]}
          </Badge>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
          {/* Request Info */}
          <Card variant="default">
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#111827', marginBottom: '20px' }}>
              📋 معلومات الطلب
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600', marginBottom: '4px' }}>
                  القسم
                </p>
                <p style={{ fontSize: '16px', color: '#111827', fontWeight: '700', margin: 0 }}>
                  {request.department}
                </p>
              </div>

              <div>
                <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600', marginBottom: '4px' }}>
                  الفئة
                </p>
                <p style={{ fontSize: '16px', color: '#111827', fontWeight: '700', margin: 0 }}>
                  {categoryLabels[request.category] || request.category}
                </p>
              </div>

              <div>
                <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600', marginBottom: '4px' }}>
                  طالب الشراء
                </p>
                <p style={{ fontSize: '16px', color: '#111827', fontWeight: '700', margin: 0 }}>
                  👤 {request.requestedBy.displayName}
                </p>
              </div>

              <div>
                <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600', marginBottom: '4px' }}>
                  تاريخ الإنشاء
                </p>
                <p style={{ fontSize: '16px', color: '#111827', fontWeight: '700', margin: 0 }}>
                  📅 {new Date(request.createdAt).toLocaleDateString('ar-SA')}
                </p>
              </div>

              {request.requiredDate && (
                <div>
                  <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600', marginBottom: '4px' }}>
                    التاريخ المطلوب
                  </p>
                  <p style={{ fontSize: '16px', color: '#111827', fontWeight: '700', margin: 0 }}>
                    📅 {new Date(request.requiredDate).toLocaleDateString('ar-SA')}
                  </p>
                </div>
              )}

              {request.estimatedBudget && (
                <div>
                  <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600', marginBottom: '4px' }}>
                    الميزانية المقدرة
                  </p>
                  <p style={{ fontSize: '16px', color: '#059669', fontWeight: '800', margin: 0 }}>
                    {request.estimatedBudget.toLocaleString('ar-SA')} ر.س
                  </p>
                </div>
              )}
            </div>

            {request.justification && (
              <div style={{ marginTop: '20px', padding: '16px', background: '#F9FAFB', borderRadius: '12px' }}>
                <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: '700', marginBottom: '8px' }}>
                  المبرر
                </p>
                <p style={{ fontSize: '14px', color: '#374151', fontWeight: '600', margin: 0, lineHeight: '1.6' }}>
                  {request.justification}
                </p>
              </div>
            )}
          </Card>

          {/* Items */}
          <Card variant="default">
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#111827', marginBottom: '20px' }}>
              📦 الأصناف ({request.items.length})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {request.items.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '16px',
                    background: '#F9FAFB',
                    borderRadius: '12px',
                    border: '1px solid #E5E7EB'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#111827', margin: 0 }}>
                      {item.name}
                    </h4>
                    {item.estimatedPrice && (
                      <Badge variant="green">
                        {(item.estimatedPrice * item.quantity).toLocaleString('ar-SA')} ر.س
                      </Badge>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#6B7280', fontWeight: '600' }}>
                    <span>الكمية: {item.quantity} {item.unit}</span>
                    {item.estimatedPrice && (
                      <span>سعر الوحدة: {item.estimatedPrice.toLocaleString('ar-SA')} ر.س</span>
                    )}
                  </div>

                  {item.specifications && (
                    <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600', marginTop: '8px', margin: 0 }}>
                      المواصفات: {item.specifications}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {totalEstimatedCost > 0 && (
              <div style={{
                marginTop: '20px',
                padding: '20px',
                background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)', fontWeight: '600', marginBottom: '8px' }}>
                  التكلفة الإجمالية المقدرة
                </p>
                <p style={{ fontSize: '32px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                  {totalEstimatedCost.toLocaleString('ar-SA')} ر.س
                </p>
              </div>
            )}
          </Card>

          {/* Attachments */}
          {request.attachments && (
            <Card variant="default">
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#111827', marginBottom: '20px' }}>
                📎 المرفقات
              </h3>
              <AttachmentsViewer attachments={request.attachments} />
            </Card>
          )}

          {/* Review Notes */}
          {request.reviewNotes && (
            <Card variant="default" style={{ borderLeft: '4px solid #3B82F6' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#3B82F6', marginBottom: '12px' }}>
                📝 ملاحظات المراجعة
              </h3>
              <p style={{ fontSize: '14px', color: '#374151', fontWeight: '600', marginBottom: '12px', lineHeight: '1.6' }}>
                {request.reviewNotes}
              </p>
              {request.reviewedBy && (
                <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600' }}>
                  👤 {request.reviewedBy.displayName} • 
                  📅 {request.reviewedAt && new Date(request.reviewedAt).toLocaleDateString('ar-SA')}
                </p>
              )}
            </Card>
          )}

          {/* Approval Notes */}
          {request.approvalNotes && (
            <Card variant="default" style={{ borderLeft: '4px solid #10B981' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#10B981', marginBottom: '12px' }}>
                ✅ ملاحظات الموافقة
              </h3>
              <p style={{ fontSize: '14px', color: '#374151', fontWeight: '600', marginBottom: '12px', lineHeight: '1.6' }}>
                {request.approvalNotes}
              </p>
              {request.approvedBy && (
                <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600' }}>
                  👤 {request.approvedBy.displayName} • 
                  📅 {request.approvedAt && new Date(request.approvedAt).toLocaleDateString('ar-SA')}
                </p>
              )}
            </Card>
          )}

          {/* Rejection Reason */}
          {request.rejectedReason && (
            <Card variant="default" style={{ borderLeft: '4px solid #EF4444' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#EF4444', marginBottom: '12px' }}>
                ❌ سبب الرفض
              </h3>
              <p style={{ fontSize: '14px', color: '#374151', fontWeight: '600', lineHeight: '1.6' }}>
                {request.rejectedReason}
              </p>
            </Card>
          )}
        </div>

        {/* Modals */}
        {showReviewModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }} onClick={() => setShowReviewModal(false)}>
            <div style={{ 
              maxWidth: '500px', 
              width: '100%',
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#111827', marginBottom: '20px' }}>
                📋 مراجعة الطلب
              </h3>
              <Textarea
                label="ملاحظات المراجعة (اختياري)"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="أضف أي ملاحظات أو تعليقات..."
                rows={4}
              />
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <Button variant="outline" onClick={() => setShowReviewModal(false)}>
                  إلغاء
                </Button>
                <Button variant="primary" onClick={handleReview} loading={actionLoading}>
                  تأكيد المراجعة
                </Button>
              </div>
            </div>
          </div>
        )}

        {showApproveModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }} onClick={() => setShowApproveModal(false)}>
            <div style={{ maxWidth: '500px', width: '100%', background: '#FFFFFF', borderRadius: '16px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#10B981', marginBottom: '20px' }}>
                ✅ الموافقة على الطلب
              </h3>
              <Textarea
                label="ملاحظات الموافقة (اختياري)"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="أضف أي ملاحظات أو شروط..."
                rows={4}
              />
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <Button variant="outline" onClick={() => setShowApproveModal(false)}>
                  إلغاء
                </Button>
                <Button variant="success" onClick={handleApprove} loading={actionLoading}>
                  تأكيد الموافقة
                </Button>
              </div>
            </div>
          </div>
        )}

        {showRejectModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }} onClick={() => setShowRejectModal(false)}>
            <div style={{ maxWidth: '500px', width: '100%', background: '#FFFFFF', borderRadius: '16px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#EF4444', marginBottom: '20px' }}>
                ❌ رفض الطلب
              </h3>
              <Textarea
                label="سبب الرفض *"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="يرجى توضيح سبب رفض الطلب..."
                rows={4}
                helperText={!rejectReason.trim() ? 'سبب الرفض مطلوب' : undefined}
              />
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <Button variant="outline" onClick={() => setShowRejectModal(false)}>
                  إلغاء
                </Button>
                <Button variant="danger" onClick={handleReject} loading={actionLoading}>
                  تأكيد الرفض
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
