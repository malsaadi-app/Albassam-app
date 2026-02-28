'use client';
import { PageHeader } from '@/components/ui/PageHeader';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  HiOutlineClock,
  HiOutlineClipboardList,
  HiOutlineUserGroup,
} from 'react-icons/hi';

type PendingApproval = {
  id: string;
  type: string;
  title: string;
  submittedBy: string;
  submittedAt: string;
  status: string;
  action: string;
  url: string;
};

export default function WorkflowApprovalsPage() {
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');

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

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      hr_request: 'طلب موارد بشرية',
      purchase_request: 'طلب شراء',
      purchase_order: 'أمر شراء',
      supplier_request: 'طلب مورد',
      maintenance_request: 'طلب صيانة',
      finance_request: 'طلب مالي',
      petty_cash_settlement: 'تسوية عهدة',
      petty_cash_topup: 'زيادة عهدة'
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      hr_request: '#10B981',
      purchase_request: '#3B82F6',
      purchase_order: '#2563EB',
      supplier_request: '#0EA5E9',
      maintenance_request: '#F59E0B',
      finance_request: '#111827',
      petty_cash_settlement: '#7C3AED',
      petty_cash_topup: '#DB2777'
    };
    return colors[type] || '#6B7280';
  };

  const filteredApprovals = filter === 'ALL'
    ? approvals
    : approvals.filter(a => a.type === filter);

  const stats = {
    total: approvals.length,
    hr: approvals.filter(a => a.type === 'hr_request').length,
    procurement: approvals.filter(a => a.type === 'purchase_request' || a.type === 'purchase_order' || a.type === 'supplier_request').length,
    maintenance: approvals.filter(a => a.type === 'maintenance_request').length,
    urgent: 0
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
            { value: 'hr_request', label: 'موارد بشرية' },
            { value: 'purchase_request', label: 'مشتريات' },
            { value: 'maintenance_request', label: 'صيانة' },
            { value: 'finance_request', label: 'مالية' }
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
                          background: getTypeColor(approval.type),
                          color: 'white',
                          fontSize: '11px',
                          fontWeight: '600',
                          padding: '4px 10px',
                          borderRadius: '12px'
                        }}>
                          {getTypeLabel(approval.type)}
                        </span>
                        {false && (
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
                        <Link href={approval.url} style={{ color: '#111827', textDecoration: 'none' }}>
                          {approval.title}
                        </Link>
                      </h3>

                      <div style={{
                        display: 'flex',
                        gap: '16px',
                        fontSize: '13px',
                        color: '#6B7280',
                        marginBottom: '12px'
                      }}>
                        <span>👤 {approval.submittedBy}</span>
                        <span>•</span>
                        <span>📋 {approval.action}</span>
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
                          <span>{approval.action}</span>
                          <span>{new Date(approval.submittedAt).toLocaleDateString('ar-SA')}</span>
                        </div>
                        <div style={{
                          width: '100%',
                          height: '6px',
                          background: '#E5E7EB',
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `70%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                            transition: 'width 0.3s'
                          }} />
                        </div>
                      </div>
                    </div>

                    {/* Right: Open */}
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <Link
                        href={approval.url}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 16px',
                          background: '#111827',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          textDecoration: 'none'
                        }}
                      >
                        فتح
                      </Link>
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
