'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { COLORS } from '@/lib/colors';

interface Approval {
  id: string;
  requestType: string;
  requestId: string;
  status: string;
  createdAt: string;
  requestDetails?: any;
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      const response = await fetch('/api/workflows/my-approvals');
      const data = await response.json();
      
      if (response.ok) {
        setApprovals(data.approvals || []);
      } else {
        setError(data.error || 'فشل جلب البيانات');
      }
    } catch (err) {
      console.error('Error loading approvals:', err);
      setError('حدث خطأ أثناء التحميل');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (logId: string, action: 'approve' | 'reject') => {
    const comments = action === 'reject' ? prompt('سبب الرفض:') : undefined;
    if (action === 'reject' && !comments) return;

    setProcessing(logId);

    try {
      const response = await fetch('/api/workflows/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId, action, comments })
      });

      if (response.ok) {
        alert(action === 'approve' ? 'تم الاعتماد بنجاح ✅' : 'تم الرفض ❌');
        fetchApprovals();
      } else {
        const data = await response.json();
        alert(data.error || 'فشلت العملية');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('حدث خطأ');
    } finally {
      setProcessing(null);
    }
  };

  const cardStyle: CSSProperties = {
    background: COLORS.white,
    border: `1px solid ${COLORS.gray200}`,
    borderRadius: '16px',
    padding: '24px',
    transition: 'all 0.2s ease'
  };

  const buttonBase: CSSProperties = {
    padding: '10px 18px',
    borderRadius: '10px',
    border: 'none',
    fontWeight: '700',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: COLORS.background,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '24px'
      }}>
        <div style={{
          ...cardStyle,
          padding: '40px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '20px', color: COLORS.gray900, fontWeight: '600' }}>
            ⏳ جاري التحميل...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" style={{
      minHeight: '100vh',
      background: COLORS.background,
      padding: '24px 16px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            color: COLORS.gray600
          }}>
            <Link href="/dashboard" style={{ color: COLORS.primary, textDecoration: 'none' }}>
              الرئيسية
            </Link>
            <span>/</span>
            <span style={{ color: COLORS.gray900, fontWeight: '600' }}>الموافقات المطلوبة</span>
          </div>
        </div>

        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <h1 style={{
            color: COLORS.gray900,
            fontSize: '32px',
            fontWeight: '800',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span>✅</span>
            <span>الموافقات المطلوبة</span>
            {approvals.length > 0 && (
              <span style={{
                background: COLORS.danger,
                color: COLORS.white,
                fontSize: '18px',
                fontWeight: '800',
                padding: '4px 14px',
                borderRadius: '999px'
              }}>
                {approvals.length}
              </span>
            )}
          </h1>
          <Link
            href="/dashboard"
            style={{
              ...buttonBase,
              background: COLORS.white,
              color: COLORS.gray900,
              border: `1px solid ${COLORS.gray200}`
            } as CSSProperties}
          >
            ← العودة
          </Link>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '24px'
        }}>
          <div style={{
            ...cardStyle,
            borderLeft: `4px solid ${COLORS.warning}`
          }}>
            <div style={{ fontSize: '14px', color: COLORS.gray600, marginBottom: '8px', fontWeight: '600' }}>
              الموافقات المعلقة
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: COLORS.warning }}>
              {approvals.length}
            </div>
          </div>

          <div style={{
            ...cardStyle,
            borderLeft: `4px solid ${COLORS.primary}`
          }}>
            <div style={{ fontSize: '14px', color: COLORS.gray600, marginBottom: '8px', fontWeight: '600' }}>
              طلبات موارد بشرية
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: COLORS.primary }}>
              {approvals.filter(a => a.requestType === 'HR_REQUEST').length}
            </div>
          </div>

          <div style={{
            ...cardStyle,
            borderLeft: `4px solid ${COLORS.success}`
          }}>
            <div style={{ fontSize: '14px', color: COLORS.gray600, marginBottom: '8px', fontWeight: '600' }}>
              طلبات شراء
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: COLORS.success }}>
              {approvals.filter(a => a.requestType === 'PURCHASE_REQUEST').length}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            ...cardStyle,
            marginBottom: '20px',
            background: COLORS.dangerLighter,
            borderColor: COLORS.danger,
            color: COLORS.dangerText
          }}>
            <div style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>❌</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Approvals List */}
        {approvals.length === 0 ? (
          <div style={{
            ...cardStyle,
            padding: '60px 40px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
            <div style={{ fontSize: '20px', color: COLORS.gray900, fontWeight: '700', marginBottom: '8px' }}>
              لا توجد موافقات معلقة
            </div>
            <div style={{ fontSize: '16px', color: COLORS.gray600 }}>
              جميع الطلبات تمت معالجتها
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {approvals.map(approval => (
              <div 
                key={approval.id}
                style={{
                  ...cardStyle,
                  borderLeft: `4px solid ${approval.requestType === 'HR_REQUEST' ? COLORS.primary : COLORS.success}`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 8px 20px ${COLORS.shadowMd}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '20px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '250px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '12px'
                    }}>
                      <span style={{ fontSize: '28px' }}>
                        {approval.requestType === 'HR_REQUEST' ? '🧑' : '🛒'}
                      </span>
                      <h3 style={{
                        fontWeight: '800',
                        fontSize: '18px',
                        color: COLORS.gray900,
                        margin: 0
                      }}>
                        {approval.requestType === 'HR_REQUEST' ? 'طلب موارد بشرية' : 'طلب شراء'}
                      </h3>
                    </div>
                    
                    {approval.requestDetails && (
                      <div style={{
                        fontSize: '15px',
                        color: COLORS.gray600,
                        lineHeight: '1.8',
                        fontWeight: '500'
                      }}>
                        {approval.requestType === 'HR_REQUEST' && (
                          <>
                            <div><strong>النوع:</strong> {approval.requestDetails.type}</div>
                            <div><strong>مقدم الطلب:</strong> {approval.requestDetails.employee?.displayName}</div>
                          </>
                        )}
                        {approval.requestType === 'PURCHASE_REQUEST' && (
                          <>
                            <div><strong>التصنيف:</strong> {approval.requestDetails.category}</div>
                            <div><strong>المبلغ:</strong> {approval.requestDetails.estimatedBudget?.toLocaleString('ar-SA')} ريال</div>
                            <div><strong>مقدم الطلب:</strong> {approval.requestDetails.requestedBy?.displayName}</div>
                          </>
                        )}
                        <div style={{ marginTop: '8px', color: COLORS.gray500, fontSize: '13px', fontWeight: '600' }}>
                          📅 {new Date(approval.createdAt).toLocaleDateString('ar-SA', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '10px',
                    flexWrap: 'wrap',
                    justifyContent: 'flex-end'
                  }}>
                    <Link
                      href={
                        approval.requestType === 'HR_REQUEST'
                          ? `/hr/requests/${approval.requestId}`
                          : `/procurement/requests/${approval.requestId}`
                      }
                      style={{
                        ...buttonBase,
                        background: COLORS.primaryLighter,
                        color: COLORS.primaryText,
                        border: `1px solid ${COLORS.primaryLight}`,
                        textDecoration: 'none'
                      } as CSSProperties}
                    >
                      👁️ عرض
                    </Link>
                    <button
                      onClick={() => handleAction(approval.id, 'approve')}
                      disabled={processing === approval.id}
                      style={{
                        ...buttonBase,
                        background: processing === approval.id ? COLORS.gray300 : COLORS.success,
                        color: COLORS.white,
                        cursor: processing === approval.id ? 'not-allowed' : 'pointer',
                        opacity: processing === approval.id ? 0.6 : 1
                      }}
                    >
                      ✅ اعتماد
                    </button>
                    <button
                      onClick={() => handleAction(approval.id, 'reject')}
                      disabled={processing === approval.id}
                      style={{
                        ...buttonBase,
                        background: processing === approval.id ? COLORS.gray300 : COLORS.danger,
                        color: COLORS.white,
                        cursor: processing === approval.id ? 'not-allowed' : 'pointer',
                        opacity: processing === approval.id ? 0.6 : 1
                      }}
                    >
                      ❌ رفض
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
