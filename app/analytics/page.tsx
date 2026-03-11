'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { CardEnhanced, CardBody, CardHeader } from '@/components/ui/CardEnhanced';
import { ResponsiveContainer, ResponsiveGrid } from '@/components/layout/ResponsiveContainer';
import { SkeletonCard } from '@/components/ui/LoadingStates';
import { exportAnalyticsToExcel } from '@/lib/excel-generator';

interface AnalyticsData {
  employees: {
    total: number;
    active: number;
    onLeave: number;
    resigned: number;
    terminated: number;
    byBranch: Array<{ branch: string; count: number }>;
    byDepartment: Array<{ department: string; count: number }>;
  };
  attendance: {
    present: number;
    late: number;
    absent: number;
    excused: number;
    attendanceRate: number;
  };
  hr: {
    pendingRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
    totalRequests: number;
  };
  workflows: {
    activeApprovals: number;
    escalatedApprovals: number;
    averageApprovalTime: number;
  };
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/analytics/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (!data) return;
    try {
      exportAnalyticsToExcel(data);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('حدث خطأ أثناء التصدير');
    }
  };

  if (loading) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
        <ResponsiveContainer size="xl">
          <PageHeader title="لوحة التحليلات" breadcrumbs={['الرئيسية', 'التحليلات']} />
          <ResponsiveGrid columns={{ mobile: 1, tablet: 2, desktop: 4 }} gap="lg">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </ResponsiveGrid>
        </ResponsiveContainer>
      </div>
    );
  }

  if (!data) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
        <ResponsiveContainer size="xl">
          <PageHeader title="لوحة التحليلات" breadcrumbs={['الرئيسية', 'التحليلات']} />
          <CardEnhanced variant="danger">
            <CardBody>
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>⚠️</div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#DC2626' }}>
                  حدث خطأ أثناء تحميل البيانات
                </h3>
                <button
                  onClick={fetchAnalytics}
                  style={{
                    marginTop: '24px',
                    padding: '12px 24px',
                    background: '#DC2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
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

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <ResponsiveContainer size="xl">
        <PageHeader
          title="📊 لوحة التحليلات"
          breadcrumbs={['الرئيسية', 'التحليلات']}
          actions={
            <button
              onClick={handleExportExcel}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              📊 تصدير Excel
            </button>
          }
        />

        {/* Employees Section */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '16px', color: '#111827' }}>
            👥 الموظفون
          </h2>

          <ResponsiveGrid columns={{ mobile: 2, tablet: 2, desktop: 5 }} gap="lg" style={{ marginBottom: '24px' }}>
            <CardEnhanced variant="gradient">
              <CardBody compact>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📊</div>
                  <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '6px' }}>إجمالي الموظفين</div>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: '#111827' }}>
                    {data.employees.total}
                  </div>
                </div>
              </CardBody>
            </CardEnhanced>

            <CardEnhanced variant="success">
              <CardBody compact>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
                  <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '6px' }}>نشط</div>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: '#10B981' }}>
                    {data.employees.active}
                  </div>
                </div>
              </CardBody>
            </CardEnhanced>

            <CardEnhanced variant="warning">
              <CardBody compact>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📅</div>
                  <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '6px' }}>إجازة</div>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: '#F59E0B' }}>
                    {data.employees.onLeave}
                  </div>
                </div>
              </CardBody>
            </CardEnhanced>

            <CardEnhanced variant="outlined">
              <CardBody compact>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>👋</div>
                  <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '6px' }}>مستقيل</div>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: '#6B7280' }}>
                    {data.employees.resigned}
                  </div>
                </div>
              </CardBody>
            </CardEnhanced>

            <CardEnhanced variant="danger">
              <CardBody compact>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>❌</div>
                  <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '6px' }}>منتهي</div>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: '#EF4444' }}>
                    {data.employees.terminated}
                  </div>
                </div>
              </CardBody>
            </CardEnhanced>
          </ResponsiveGrid>

          <ResponsiveGrid columns={{ mobile: 1, tablet: 2 }} gap="lg">
            {/* By Branch */}
            <CardEnhanced variant="elevated">
              <CardHeader title="📍 التوزيع حسب الفرع" />
              <CardBody>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {data.employees.byBranch.slice(0, 5).map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                        {item.branch || 'غير محدد'}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '100px',
                            height: '8px',
                            background: '#E5E7EB',
                            borderRadius: '4px',
                            overflow: 'hidden'
                          }}
                        >
                          <div
                            style={{
                              width: `${(item.count / data.employees.total) * 100}%`,
                              height: '100%',
                              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                              borderRadius: '4px'
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '15px', fontWeight: '700', color: '#667eea', minWidth: '40px', textAlign: 'left' }}>
                          {item.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </CardEnhanced>

            {/* By Department */}
            <CardEnhanced variant="elevated">
              <CardHeader title="🏢 التوزيع حسب القسم" />
              <CardBody>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {data.employees.byDepartment.slice(0, 5).map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                        {item.department || 'غير محدد'}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '100px',
                            height: '8px',
                            background: '#E5E7EB',
                            borderRadius: '4px',
                            overflow: 'hidden'
                          }}
                        >
                          <div
                            style={{
                              width: `${(item.count / data.employees.total) * 100}%`,
                              height: '100%',
                              background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)',
                              borderRadius: '4px'
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '15px', fontWeight: '700', color: '#10B981', minWidth: '40px', textAlign: 'left' }}>
                          {item.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </CardEnhanced>
          </ResponsiveGrid>
        </div>

        {/* Attendance Section */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '16px', color: '#111827' }}>
            📅 الحضور (اليوم)
          </h2>

          <ResponsiveGrid columns={{ mobile: 2, tablet: 2, desktop: 5 }} gap="lg">
            <CardEnhanced variant="success">
              <CardBody compact>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
                  <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '6px' }}>حاضر</div>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: '#10B981' }}>
                    {data.attendance.present}
                  </div>
                </div>
              </CardBody>
            </CardEnhanced>

            <CardEnhanced variant="warning">
              <CardBody compact>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏰</div>
                  <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '6px' }}>متأخر</div>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: '#F59E0B' }}>
                    {data.attendance.late}
                  </div>
                </div>
              </CardBody>
            </CardEnhanced>

            <CardEnhanced variant="danger">
              <CardBody compact>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>❌</div>
                  <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '6px' }}>غائب</div>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: '#EF4444' }}>
                    {data.attendance.absent}
                  </div>
                </div>
              </CardBody>
            </CardEnhanced>

            <CardEnhanced variant="outlined">
              <CardBody compact>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
                  <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '6px' }}>معذور</div>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: '#667eea' }}>
                    {data.attendance.excused}
                  </div>
                </div>
              </CardBody>
            </CardEnhanced>

            <CardEnhanced variant="gradient">
              <CardBody compact>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📈</div>
                  <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '6px' }}>نسبة الحضور</div>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: '#111827' }}>
                    {Math.round(data.attendance.attendanceRate)}%
                  </div>
                </div>
              </CardBody>
            </CardEnhanced>
          </ResponsiveGrid>
        </div>

        {/* HR & Workflows */}
        <ResponsiveGrid columns={{ mobile: 1, tablet: 2 }} gap="lg">
          {/* HR Requests */}
          <CardEnhanced variant="elevated">
            <CardHeader title="📋 طلبات الموارد البشرية" />
            <CardBody>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: '#FEF3C7', borderRadius: '12px' }}>
                  <span style={{ fontWeight: '600', color: '#92400E' }}>⏳ قيد المراجعة</span>
                  <span style={{ fontSize: '20px', fontWeight: '800', color: '#92400E' }}>{data.hr.pendingRequests}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: '#D1FAE5', borderRadius: '12px' }}>
                  <span style={{ fontWeight: '600', color: '#065F46' }}>✅ تمت الموافقة</span>
                  <span style={{ fontSize: '20px', fontWeight: '800', color: '#065F46' }}>{data.hr.approvedRequests}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: '#FEE2E2', borderRadius: '12px' }}>
                  <span style={{ fontWeight: '600', color: '#991B1B' }}>❌ مرفوضة</span>
                  <span style={{ fontSize: '20px', fontWeight: '800', color: '#991B1B' }}>{data.hr.rejectedRequests}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: '#F3F4F6', borderRadius: '12px' }}>
                  <span style={{ fontWeight: '600', color: '#374151' }}>📊 الإجمالي</span>
                  <span style={{ fontSize: '20px', fontWeight: '800', color: '#374151' }}>{data.hr.totalRequests}</span>
                </div>
              </div>
            </CardBody>
          </CardEnhanced>

          {/* Workflows */}
          <CardEnhanced variant="elevated">
            <CardHeader title="🔄 سير العمل" />
            <CardBody>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)', borderRadius: '12px', border: '1px solid #E0E7FF' }}>
                  <span style={{ fontWeight: '600', color: '#4338CA' }}>⏳ موافقات نشطة</span>
                  <span style={{ fontSize: '20px', fontWeight: '800', color: '#4338CA' }}>{data.workflows.activeApprovals}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: 'linear-gradient(135deg, #FEF3C715 0%, #FCD34D15 100%)', borderRadius: '12px', border: '1px solid #FEF3C7' }}>
                  <span style={{ fontWeight: '600', color: '#92400E' }}>⚠️ تم تصعيدها</span>
                  <span style={{ fontSize: '20px', fontWeight: '800', color: '#92400E' }}>{data.workflows.escalatedApprovals}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: 'linear-gradient(135deg, #D1FAE515 0%, #A7F3D015 100%)', borderRadius: '12px', border: '1px solid #D1FAE5' }}>
                  <span style={{ fontWeight: '600', color: '#065F46' }}>⏱️ متوسط وقت الموافقة</span>
                  <span style={{ fontSize: '20px', fontWeight: '800', color: '#065F46' }}>
                    {data.workflows.averageApprovalTime.toFixed(1)} ساعة
                  </span>
                </div>

                <Link href="/workflows/approvals">
                  <button
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '15px'
                    }}
                  >
                    عرض جميع الموافقات →
                  </button>
                </Link>
              </div>
            </CardBody>
          </CardEnhanced>
        </ResponsiveGrid>
      </ResponsiveContainer>
    </div>
  );
}
