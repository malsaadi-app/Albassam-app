'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { CardEnhanced, CardBody } from '@/components/ui/CardEnhanced';
import { ResponsiveContainer, ResponsiveGrid } from '@/components/layout/ResponsiveContainer';
import { SkeletonCard } from '@/components/ui/LoadingStates';

interface LeaveBalanceData {
  balance: {
    total: number;
    used: number;
    pending: number;
    available: number;
    availableAfterPending: number;
  };
  leaveTypes: Array<{
    type: string;
    total: number;
    used: number;
    available: number;
  }>;
  recentLeaves: Array<{
    id: string;
    startDate: string;
    endDate: string;
    days: number;
    status: string;
    leaveType: string;
  }>;
}

export default function LeaveBalancePage() {
  const router = useRouter();
  const [data, setData] = useState<LeaveBalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLeaveBalance();
  }, []);

  const fetchLeaveBalance = async () => {
    try {
      const res = await fetch('/api/hr/leave-balance');
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/');
          return;
        }
        throw new Error('فشل جلب البيانات');
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
        <ResponsiveContainer size="xl">
          <PageHeader title="رصيد الإجازات" breadcrumbs={['الرئيسية', 'الملف الشخصي', 'رصيد الإجازات']} />
          <ResponsiveGrid columns={{ mobile: 1, tablet: 2, desktop: 3 }} gap="lg">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </ResponsiveGrid>
        </ResponsiveContainer>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
        <ResponsiveContainer size="xl">
          <PageHeader title="رصيد الإجازات" breadcrumbs={['الرئيسية', 'الملف الشخصي', 'رصيد الإجازات']} />
          <CardEnhanced variant="danger">
            <CardBody>
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>⚠️</div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px', color: '#DC2626' }}>
                  خطأ في تحميل البيانات
                </h3>
                <p style={{ color: '#6B7280', marginBottom: '24px' }}>{error}</p>
                <button
                  onClick={fetchLeaveBalance}
                  style={{
                    background: '#DC2626',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  إعادة المحاولة
                </button>
              </div>
            </CardBody>
          </CardEnhanced>
        </ResponsiveContainer>
      </div>
    );
  }

  const { balance, leaveTypes, recentLeaves } = data;

  const getStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string; text: string }> = {
      APPROVED: { bg: '#D1FAE5', color: '#065F46', text: 'موافق' },
      PENDING: { bg: '#FEF3C7', color: '#92400E', text: 'قيد المراجعة' },
      REJECTED: { bg: '#FEE2E2', color: '#991B1B', text: 'مرفوض' }
    };
    const config = map[status] || { bg: '#F3F4F6', color: '#1F2937', text: status };
    return (
      <span
        style={{
          background: config.bg,
          color: config.color,
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '13px',
          fontWeight: '600'
        }}
      >
        {config.text}
      </span>
    );
  };

  const percentage = balance.total > 0 ? Math.round((balance.available / balance.total) * 100) : 0;

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <ResponsiveContainer size="xl">
        <PageHeader
          title="📅 رصيد الإجازات"
          breadcrumbs={['الرئيسية', 'الملف الشخصي', 'رصيد الإجازات']}
          actions={
            <Link href="/hr/requests/new">
              <button
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '15px'
                }}
              >
                ➕ طلب إجازة جديدة
              </button>
            </Link>
          }
        />

        {/* Main Balance Cards */}
        <ResponsiveGrid columns={{ mobile: 1, tablet: 2, desktop: 4 }} gap="lg" style={{ marginBottom: '24px' }}>
          {/* Total */}
          <CardEnhanced variant="gradient">
            <CardBody>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '8px' }}>📊</div>
                <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>إجمالي الرصيد</div>
                <div style={{ fontSize: '36px', fontWeight: '800', color: '#111827' }}>{balance.total}</div>
                <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>يوم</div>
              </div>
            </CardBody>
          </CardEnhanced>

          {/* Used */}
          <CardEnhanced variant="elevated">
            <CardBody>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '8px' }}>✅</div>
                <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>المستخدم</div>
                <div style={{ fontSize: '36px', fontWeight: '800', color: '#EF4444' }}>{balance.used}</div>
                <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>يوم</div>
              </div>
            </CardBody>
          </CardEnhanced>

          {/* Pending */}
          <CardEnhanced variant="elevated">
            <CardBody>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '8px' }}>⏳</div>
                <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>قيد المراجعة</div>
                <div style={{ fontSize: '36px', fontWeight: '800', color: '#F59E0B' }}>{balance.pending}</div>
                <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>يوم</div>
              </div>
            </CardBody>
          </CardEnhanced>

          {/* Available */}
          <CardEnhanced variant="success">
            <CardBody>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎯</div>
                <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>المتاح</div>
                <div style={{ fontSize: '36px', fontWeight: '800', color: '#10B981' }}>{balance.availableAfterPending}</div>
                <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>يوم</div>
              </div>
            </CardBody>
          </CardEnhanced>
        </ResponsiveGrid>

        {/* Progress Bar */}
        <CardEnhanced variant="outlined" style={{ marginBottom: '24px' }}>
          <CardBody>
            <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>نسبة الاستخدام</span>
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#667eea' }}>{100 - percentage}%</span>
            </div>
            <div style={{ background: '#E5E7EB', borderRadius: '12px', height: '24px', overflow: 'hidden', position: 'relative' }}>
              <div
                style={{
                  background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)',
                  height: '100%',
                  width: `${percentage}%`,
                  transition: 'width 0.5s ease',
                  borderRadius: '12px'
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: percentage > 50 ? 'white' : '#111827'
                }}
              >
                متبقي {percentage}%
              </span>
            </div>
          </CardBody>
        </CardEnhanced>

        {/* Leave Types Breakdown */}
        {leaveTypes && leaveTypes.length > 0 && (
          <CardEnhanced variant="default" style={{ marginBottom: '24px' }}>
            <CardBody>
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: '#111827' }}>
                📋 تفصيل حسب نوع الإجازة
              </h3>
              <div style={{ display: 'grid', gap: '16px' }}>
                {leaveTypes.map((lt, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px',
                      background: '#F9FAFB',
                      borderRadius: '12px',
                      border: '1px solid #E5E7EB'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                        {lt.type}
                      </div>
                      <div style={{ fontSize: '13px', color: '#6B7280' }}>
                        المستخدم: {lt.used} من {lt.total}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: '800', color: '#667eea' }}>{lt.available}</div>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>متبقي</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </CardEnhanced>
        )}

        {/* Recent Leaves */}
        {recentLeaves && recentLeaves.length > 0 && (
          <CardEnhanced variant="default">
            <CardBody>
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: '#111827' }}>
                🕐 آخر الإجازات
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
                      <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#6B7280' }}>
                        النوع
                      </th>
                      <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#6B7280' }}>
                        من
                      </th>
                      <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#6B7280' }}>
                        إلى
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: '#6B7280' }}>
                        الأيام
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: '#6B7280' }}>
                        الحالة
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLeaves.map((leave) => (
                      <tr key={leave.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#111827' }}>{leave.leaveType}</td>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#6B7280' }}>
                          {new Date(leave.startDate).toLocaleDateString('ar-SA')}
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#6B7280' }}>
                          {new Date(leave.endDate).toLocaleDateString('ar-SA')}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', fontSize: '15px', fontWeight: '700', color: '#667eea' }}>
                          {leave.days}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>{getStatusBadge(leave.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </CardEnhanced>
        )}

        {/* Empty State */}
        {(!recentLeaves || recentLeaves.length === 0) && (
          <CardEnhanced variant="outlined">
            <CardBody>
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>📅</div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#6B7280', marginBottom: '8px' }}>
                  لا توجد إجازات سابقة
                </h3>
                <p style={{ fontSize: '14px', color: '#9CA3AF', marginBottom: '24px' }}>
                  لم تقم بتقديم أي طلب إجازة حتى الآن
                </p>
                <Link href="/hr/requests/new">
                  <button
                    style={{
                      background: '#667eea',
                      color: 'white',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    تقديم طلب إجازة
                  </button>
                </Link>
              </div>
            </CardBody>
          </CardEnhanced>
        )}
      </ResponsiveContainer>
    </div>
  );
}
