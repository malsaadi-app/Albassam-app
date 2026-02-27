'use client';
import { PageHeader } from '@/components/ui/PageHeader';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineClock,
  HiOutlineClipboardList,
  HiOutlineUserGroup,
  HiOutlineCheckCircle
} from 'react-icons/hi';

interface PendingApproval {
  id: string;
  requestType: string;
  requestId: string;
  requestTitle: string;
  requesterName: string;
  stepName: string;
  workflowName: string;
  stepOrder: number;
  totalSteps: number;
  createdAt: string;
  daysWaiting: number;
}

export default function WorkflowApprovalsPage() {
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      const res = await fetch('/api/workflows/my-approvals');
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

  const handleApprove = async (approvalId: string) => {
    if (!confirm('هل أنت متأكد من الموافقة على هذا الطلب؟')) return;

    setProcessingId(approvalId);
    try {
      const res = await fetch('/api/workflows/approvals/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvalId,
          approverId: 'CURRENT_USER_ID', // TODO: Get from session
          comments: 'موافق'
        })
      });

      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        fetchPendingApprovals(); // Refresh list
      } else {
        const error = await res.json();
        alert(`خطأ: ${error.error}`);
      }
    } catch (error) {
      console.error('Error approving:', error);
      alert('حدث خطأ أثناء الموافقة');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (approvalId: string) => {
    const reason = prompt('يرجى إدخال سبب الرفض:');
    if (!reason) return;

    setProcessingId(approvalId);
    try {
      const res = await fetch('/api/workflows/approvals/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvalId,
          approverId: 'CURRENT_USER_ID', // TODO: Get from session
          comments: reason
        })
      });

      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        fetchPendingApprovals(); // Refresh list
      } else {
        const error = await res.json();
        alert(`خطأ: ${error.error}`);
      }
    } catch (error) {
      console.error('Error rejecting:', error);
      alert('حدث خطأ أثناء الرفض');
    } finally {
      setProcessingId(null);
    }
  };

  const getRequestTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      HR_REQUEST: 'طلب موارد بشرية',
      PURCHASE_REQUEST: 'طلب شراء',
      MAINTENANCE_REQUEST: 'طلب صيانة',
      TASK: 'مهمة'
    };
    return labels[type] || type;
  };

  const getRequestTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      HR_REQUEST: '#10B981',
      PURCHASE_REQUEST: '#3B82F6',
      MAINTENANCE_REQUEST: '#F59E0B',
      TASK: '#6366F1'
    };
    return colors[type] || '#6B7280';
  };

  const filteredApprovals = filter === 'ALL' 
    ? approvals 
    : approvals.filter(a => a.requestType === filter);

  const stats = {
    total: approvals.length,
    hr: approvals.filter(a => a.requestType === 'HR_REQUEST').length,
    procurement: approvals.filter(a => a.requestType === 'PURCHASE_REQUEST').length,
    maintenance: approvals.filter(a => a.requestType === 'MAINTENANCE_REQUEST').length,
    urgent: approvals.filter(a => a.daysWaiting > 3).length
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
            border: '1px solid #E5E7EB'
          }}>
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
            border: '1px solid #E5E7EB'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#3B82F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '20px'
              }}>
                🛒
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                  {stats.procurement}
                </div>
                <div style={{ fontSize: '13px', color: '#6B7280' }}>مشتريات</div>
              </div>
            </div>
          </div>

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
                background: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <HiOutlineClock size={20} />
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                  {stats.urgent}
                </div>
                <div style={{ fontSize: '13px', color: '#6B7280' }}>عاجلة (+3 أيام)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '24px',
          border: '1px solid #E5E7EB',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
            التصنيف:
          </span>
          {[
            { value: 'ALL', label: 'الكل' },
            { value: 'HR_REQUEST', label: 'موارد بشرية' },
            { value: 'PURCHASE_REQUEST', label: 'مشتريات' },
            { value: 'MAINTENANCE_REQUEST', label: 'صيانة' }
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: filter === f.value ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                background: filter === f.value ? '#EFF6FF' : 'white',
                color: filter === f.value ? '#3B82F6' : '#6B7280',
                fontSize: '13px',
                fontWeight: filter === f.value ? '600' : '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (filter !== f.value) {
                  e.currentTarget.style.borderColor = '#D1D5DB';
                }
              }}
              onMouseLeave={(e) => {
                if (filter !== f.value) {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                }
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Approvals List */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          overflow: 'hidden'
        }}>
          {filteredApprovals.length === 0 ? (
            <div style={{ padding: '60px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                لا توجد طلبات معلقة
              </h3>
              <p style={{ fontSize: '14px', color: '#6B7280' }}>
                جميع الطلبات تمت معالجتها
              </p>
            </div>
          ) : (
            <div>
              {filteredApprovals.map((approval, index) => (
                <div
                  key={approval.id}
                  style={{
                    padding: '24px',
                    borderBottom: index < filteredApprovals.length - 1 ? '1px solid #E5E7EB' : 'none',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                >
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                    {/* Left: Info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <span style={{
                          background: getRequestTypeColor(approval.requestType),
                          color: 'white',
                          fontSize: '11px',
                          fontWeight: '600',
                          padding: '4px 10px',
                          borderRadius: '12px'
                        }}>
                          {getRequestTypeLabel(approval.requestType)}
                        </span>
                        {approval.daysWaiting > 3 && (
                          <span style={{
                            background: '#FEE2E2',
                            color: '#DC2626',
                            fontSize: '11px',
                            fontWeight: '600',
                            padding: '4px 10px',
                            borderRadius: '12px'
                          }}>
                            عاجل
                          </span>
                        )}
                      </div>

                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#111827',
                        marginBottom: '8px'
                      }}>
                        {approval.requestTitle}
                      </h3>

                      <div style={{
                        display: 'flex',
                        gap: '16px',
                        fontSize: '13px',
                        color: '#6B7280',
                        marginBottom: '12px'
                      }}>
                        <span>👤 {approval.requesterName}</span>
                        <span>•</span>
                        <span>📋 {approval.workflowName}</span>
                        <span>•</span>
                        <span>⏱️ {approval.daysWaiting} يوم</span>
                      </div>

                      {/* Progress */}
                      <div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '12px',
                          color: '#6B7280',
                          marginBottom: '6px'
                        }}>
                          <span>{approval.stepName}</span>
                          <span>المرحلة {approval.stepOrder} من {approval.totalSteps}</span>
                        </div>
                        <div style={{
                          width: '100%',
                          height: '6px',
                          background: '#E5E7EB',
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${(approval.stepOrder / approval.totalSteps) * 100}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                            transition: 'width 0.3s'
                          }} />
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      flexShrink: 0
                    }}>
                      <button
                        onClick={() => handleApprove(approval.id)}
                        disabled={processingId === approval.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 20px',
                          background: processingId === approval.id ? '#9CA3AF' : '#10B981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: processingId === approval.id ? 'not-allowed' : 'pointer',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (processingId !== approval.id) {
                            e.currentTarget.style.background = '#059669';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (processingId !== approval.id) {
                            e.currentTarget.style.background = '#10B981';
                          }
                        }}
                      >
                        <HiOutlineCheck size={18} />
                        موافق
                      </button>
                      <button
                        onClick={() => handleReject(approval.id)}
                        disabled={processingId === approval.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 20px',
                          background: processingId === approval.id ? '#9CA3AF' : '#EF4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: processingId === approval.id ? 'not-allowed' : 'pointer',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (processingId !== approval.id) {
                            e.currentTarget.style.background = '#DC2626';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (processingId !== approval.id) {
                            e.currentTarget.style.background = '#EF4444';
                          }
                        }}
                      >
                        <HiOutlineX size={18} />
                        رفض
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Note */}
        <div style={{
          background: '#DBEAFE',
          borderRadius: '12px',
          padding: '16px 20px',
          marginTop: '24px',
          fontSize: '13px',
          color: '#1E40AF'
        }}>
          💡 <strong>ملاحظة:</strong> هذه الصفحة تعرض الطلبات التي تحتاج موافقتك فقط. يمكنك الموافقة أو الرفض مباشرة من هنا.
        </div>
      </div>
    </div>
  );
}
