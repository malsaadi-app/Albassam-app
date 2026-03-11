'use client';
import { PageHeader } from '@/components/ui/PageHeader';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  HiOutlineClock,
  HiOutlineClipboardList,
  HiOutlineUserGroup,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
} from 'react-icons/hi';

type ApprovalDetail = {
  id: string;
  requestType: string;
  requestId: string;
  workflowName: string;
  workflowModule: string;
  stepName: string;
  stepOrder: number;
  status: string;
  level: string | null;
  createdAt: string;
  request: any;
  metadata: any;
};

export default function ApprovalsPage() {
  const router = useRouter();
  const [approvals, setApprovals] = useState<ApprovalDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [selectedApproval, setSelectedApproval] = useState<ApprovalDetail | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [comments, setComments] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      const res = await fetch('/api/dashboard/pending-approvals');
      if (res.ok) {
        const data = await res.json();
        setApprovals(data.approvals || []);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching approvals:', error);
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedApproval) return;
    
    if (actionType === 'reject' && !comments.trim()) {
      alert('يرجى إدخال سبب الرفض');
      return;
    }

    setProcessing(true);

    try {
      const endpoint = actionType === 'approve' 
        ? `/api/workflows/runtime/${selectedApproval.id}/approve`
        : `/api/workflows/runtime/${selectedApproval.id}/reject`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments: comments.trim() || undefined })
      });

      if (res.ok) {
        const data = await res.json();
        alert(data.message || (actionType === 'approve' ? 'تمت الموافقة بنجاح' : 'تم الرفض بنجاح'));
        setShowModal(false);
        setComments('');
        fetchPendingApprovals(); // Refresh
      } else {
        const error = await res.json();
        alert(error.error || 'حدث خطأ');
      }
    } catch (error) {
      console.error('Error processing approval:', error);
      alert('حدث خطأ أثناء معالجة الطلب');
    } finally {
      setProcessing(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      HR_REQUEST: 'طلب موارد بشرية',
      PURCHASE_REQUEST: 'طلب شراء',
      MAINTENANCE_REQUEST: 'طلب صيانة',
      ATTENDANCE_CORRECTION: 'تصحيح حضور'
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      HR_REQUEST: '#10B981',
      PURCHASE_REQUEST: '#3B82F6',
      MAINTENANCE_REQUEST: '#F59E0B',
      ATTENDANCE_CORRECTION: '#8B5CF6'
    };
    return colors[type] || '#6B7280';
  };

  const getModuleArabic = (module: string) => {
    const modules: Record<string, string> = {
      HR: 'الموارد البشرية',
      PROCUREMENT: 'المشتريات',
      MAINTENANCE: 'الصيانة',
      ATTENDANCE: 'الحضور'
    };
    return modules[module] || module;
  };

  const filteredApprovals = filter === 'ALL'
    ? approvals
    : approvals.filter(a => a.requestType === filter);

  const stats = {
    total: approvals.length,
    hr: approvals.filter(a => a.requestType === 'HR_REQUEST').length,
    procurement: approvals.filter(a => a.requestType === 'PURCHASE_REQUEST').length,
    maintenance: approvals.filter(a => a.requestType === 'MAINTENANCE_REQUEST').length,
    attendance: approvals.filter(a => a.requestType === 'ATTENDANCE_CORRECTION').length
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{ fontSize: '14px', color: '#6B7280' }}>جاري التحميل...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <PageHeader
          title="الطلبات المعلقة"
          breadcrumbs={['الرئيسية', 'سير العمل', 'الطلبات المعلقة']}
        />

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #E5E7EB'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <HiOutlineClipboardList size={20} />
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                  {stats.total}
                </div>
                <div style={{ fontSize: '13px', color: '#6B7280' }}>إجمالي المعلقة</div>
              </div>
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #E5E7EB',
            cursor: 'pointer',
            transition: 'all 0.2s',
            ...(filter === 'HR_REQUEST' && { borderColor: '#10B981', borderWidth: '2px' })
          }}
          onClick={() => setFilter(filter === 'HR_REQUEST' ? 'ALL' : 'HR_REQUEST')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <HiOutlineUserGroup size={20} />
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                  {stats.hr}
                </div>
                <div style={{ fontSize: '13px', color: '#6B7280' }}>موارد بشرية</div>
              </div>
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #E5E7EB',
            cursor: 'pointer',
            transition: 'all 0.2s',
            ...(filter === 'PURCHASE_REQUEST' && { borderColor: '#3B82F6', borderWidth: '2px' })
          }}
          onClick={() => setFilter(filter === 'PURCHASE_REQUEST' ? 'ALL' : 'PURCHASE_REQUEST')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#3B82F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <HiOutlineClipboardList size={20} />
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                  {stats.procurement}
                </div>
                <div style={{ fontSize: '13px', color: '#6B7280' }}>المشتريات</div>
              </div>
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #E5E7EB',
            cursor: 'pointer',
            transition: 'all 0.2s',
            ...(filter === 'MAINTENANCE_REQUEST' && { borderColor: '#F59E0B', borderWidth: '2px' })
          }}
          onClick={() => setFilter(filter === 'MAINTENANCE_REQUEST' ? 'ALL' : 'MAINTENANCE_REQUEST')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#F59E0B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <HiOutlineClock size={20} />
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                  {stats.maintenance}
                </div>
                <div style={{ fontSize: '13px', color: '#6B7280' }}>الصيانة</div>
              </div>
            </div>
          </div>
        </div>

        {/* Approvals List */}
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #E5E7EB' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
              {filter === 'ALL' ? 'جميع الطلبات' : getTypeLabel(filter)}
              {' '}
              ({filteredApprovals.length})
            </h2>
          </div>

          {filteredApprovals.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
              <div style={{ fontSize: '16px', color: '#6B7280' }}>
                لا توجد طلبات معلقة
              </div>
            </div>
          ) : (
            <div>
              {filteredApprovals.map((approval) => (
                <div
                  key={approval.id}
                  style={{
                    padding: '20px',
                    borderBottom: '1px solid #E5E7EB',
                    transition: 'background 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                  onClick={() => {
                    setSelectedApproval(approval);
                    setShowModal(true);
                    setActionType('approve');
                    setComments('');
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <div style={{
                          padding: '4px 12px',
                          borderRadius: '6px',
                          background: getTypeColor(approval.requestType),
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {getTypeLabel(approval.requestType)}
                        </div>
                        <div style={{
                          padding: '4px 12px',
                          borderRadius: '6px',
                          background: '#F3F4F6',
                          color: '#374151',
                          fontSize: '12px'
                        }}>
                          {getModuleArabic(approval.workflowModule)}
                        </div>
                      </div>

                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                        {approval.workflowName}
                      </div>

                      <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>
                        المرحلة: {approval.stepName} ({approval.stepOrder}/{approval.metadata?.totalSteps || '?'})
                      </div>

                      <div style={{ fontSize: '13px', color: '#9CA3AF' }}>
                        <HiOutlineClock style={{ display: 'inline', marginLeft: '4px' }} />
                        {new Date(approval.createdAt).toLocaleString('ar-SA')}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        style={{
                          padding: '8px 16px',
                          background: '#10B981',
                          color: 'white',
                          borderRadius: '8px',
                          border: 'none',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedApproval(approval);
                          setActionType('approve');
                          setShowModal(true);
                        }}
                      >
                        <HiOutlineCheckCircle size={18} />
                        موافقة
                      </button>

                      <button
                        style={{
                          padding: '8px 16px',
                          background: '#EF4444',
                          color: 'white',
                          borderRadius: '8px',
                          border: 'none',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedApproval(approval);
                          setActionType('reject');
                          setShowModal(true);
                        }}
                      >
                        <HiOutlineXCircle size={18} />
                        رفض
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedApproval && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
        onClick={() => !processing && setShowModal(false)}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '24px', borderBottom: '1px solid #E5E7EB' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                {actionType === 'approve' ? 'تأكيد الموافقة' : 'تأكيد الرفض'}
              </h3>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '4px' }}>
                  سير العمل
                </div>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#111827' }}>
                  {selectedApproval.workflowName}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '4px' }}>
                  المرحلة الحالية
                </div>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#111827' }}>
                  {selectedApproval.stepName} ({selectedApproval.stepOrder}/{selectedApproval.metadata?.totalSteps || '?'})
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  {actionType === 'approve' ? 'ملاحظات (اختياري)' : 'سبب الرفض (مطلوب)'}
                  {actionType === 'reject' && <span style={{ color: '#EF4444' }}> *</span>}
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder={actionType === 'approve' ? 'أضف ملاحظات إن وجدت...' : 'أدخل سبب الرفض...'}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical',
                    minHeight: '100px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #E5E7EB', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => !processing && setShowModal(false)}
                disabled={processing}
                style={{
                  padding: '10px 20px',
                  background: '#F3F4F6',
                  color: '#374151',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: processing ? 'not-allowed' : 'pointer',
                  opacity: processing ? 0.5 : 1
                }}
              >
                إلغاء
              </button>

              <button
                onClick={handleAction}
                disabled={processing || (actionType === 'reject' && !comments.trim())}
                style={{
                  padding: '10px 20px',
                  background: actionType === 'approve' ? '#10B981' : '#EF4444',
                  color: 'white',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: (processing || (actionType === 'reject' && !comments.trim())) ? 'not-allowed' : 'pointer',
                  opacity: (processing || (actionType === 'reject' && !comments.trim())) ? 0.5 : 1
                }}
              >
                {processing ? 'جاري المعالجة...' : (actionType === 'approve' ? 'تأكيد الموافقة' : 'تأكيد الرفض')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
