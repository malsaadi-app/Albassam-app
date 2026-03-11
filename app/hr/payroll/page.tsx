'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { CardEnhanced, CardBody, CardHeader } from '@/components/ui/CardEnhanced';
import { ResponsiveContainer, ResponsiveGrid } from '@/components/layout/ResponsiveContainer';
import { TableEnhanced, Column } from '@/components/ui/TableEnhanced';
import { SkeletonTable } from '@/components/ui/LoadingStates';
import { usePermissions } from '@/hooks/usePermissions';

interface PayrollRun {
  id: string;
  year: number;
  month: number;
  status: 'DRAFT' | 'LOCKED';
  linesCount: number;
  totalAmount: number;
  createdAt: string;
}

export default function PayrollPage() {
  const router = useRouter();
  const { hasPermission, loading: permLoading } = usePermissions();
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    if (!permLoading) {
      fetchRuns();
    }
  }, [permLoading]);

  const fetchRuns = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/hr/payroll/runs');
      if (res.ok) {
        const data = await res.json();
        setRuns(data.runs || []);
      }
    } catch (error) {
      console.error('Error fetching payroll runs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!confirm(`هل تريد إنشاء رواتب ${getMonthName(selectedMonth)} ${selectedYear}؟`)) {
      return;
    }

    try {
      setGenerating(true);
      const res = await fetch('/api/hr/payroll/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: selectedYear, month: selectedMonth })
      });

      if (res.ok) {
        const data = await res.json();
        alert(`✅ تم إنشاء ${data.linesCount} سطر راتب بنجاح`);
        fetchRuns();
      } else {
        const error = await res.json();
        alert(`❌ ${error.error || 'حدث خطأ'}`);
      }
    } catch (error) {
      console.error('Error generating payroll:', error);
      alert('❌ حدث خطأ أثناء إنشاء الرواتب');
    } finally {
      setGenerating(false);
    }
  };

  const handleLock = async (runId: string, year: number, month: number) => {
    if (!confirm(`هل تريد قفل رواتب ${getMonthName(month)} ${year}؟ لن تتمكن من التعديل بعد القفل.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/hr/payroll/runs/${runId}/lock`, {
        method: 'POST'
      });

      if (res.ok) {
        alert('✅ تم قفل الرواتب بنجاح');
        fetchRuns();
      } else {
        alert('❌ حدث خطأ');
      }
    } catch (error) {
      console.error('Error locking payroll:', error);
      alert('❌ حدث خطأ');
    }
  };

  const handleDelete = async (runId: string, year: number, month: number) => {
    if (!confirm(`هل تريد حذف رواتب ${getMonthName(month)} ${year}؟ هذا الإجراء لا يمكن التراجع عنه.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/hr/payroll/runs/${runId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        alert('✅ تم حذف الرواتب بنجاح');
        fetchRuns();
      } else {
        const error = await res.json();
        alert(`❌ ${error.error || 'حدث خطأ'}`);
      }
    } catch (error) {
      console.error('Error deleting payroll:', error);
      alert('❌ حدث خطأ');
    }
  };

  const getMonthName = (month: number): string => {
    const months = [
      'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return months[month - 1] || '';
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string; text: string; icon: string }> = {
      DRAFT: { bg: '#FEF3C7', color: '#92400E', text: 'مسودة', icon: '📝' },
      LOCKED: { bg: '#D1FAE5', color: '#065F46', text: 'مقفل', icon: '🔒' }
    };
    const config = map[status] || map.DRAFT;
    return (
      <span
        style={{
          background: config.bg,
          color: config.color,
          padding: '6px 12px',
          borderRadius: '12px',
          fontSize: '13px',
          fontWeight: '600',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        <span>{config.icon}</span>
        <span>{config.text}</span>
      </span>
    );
  };

  const columns: Column<PayrollRun>[] = [
    {
      key: 'year',
      label: 'السنة',
      sortable: true,
      render: (row) => <span style={{ fontWeight: '700', fontSize: '15px' }}>{row.year}</span>
    },
    {
      key: 'month',
      label: 'الشهر',
      sortable: true,
      render: (row) => (
        <span style={{ fontWeight: '600', color: '#667eea' }}>
          {getMonthName(row.month)}
        </span>
      )
    },
    {
      key: 'linesCount',
      label: 'عدد الموظفين',
      sortable: true,
      align: 'center',
      render: (row) => (
        <span style={{ fontWeight: '700', fontSize: '15px', color: '#111827' }}>
          {row.linesCount}
        </span>
      )
    },
    {
      key: 'totalAmount',
      label: 'إجمالي المبلغ',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span style={{ fontWeight: '800', fontSize: '16px', color: '#10B981' }}>
          {row.totalAmount.toLocaleString('ar-SA')} ر.س
        </span>
      )
    },
    {
      key: 'status',
      label: 'الحالة',
      sortable: true,
      align: 'center',
      render: (row) => getStatusBadge(row.status)
    },
    {
      key: 'createdAt',
      label: 'تاريخ الإنشاء',
      sortable: true,
      render: (row) => (
        <span style={{ fontSize: '13px', color: '#6B7280' }}>
          {new Date(row.createdAt).toLocaleDateString('ar-SA')}
        </span>
      )
    },
    {
      key: 'id',
      label: 'إجراءات',
      align: 'center',
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href={`/hr/payroll/${row.id}`}>
            <button
              style={{
                padding: '8px 12px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              عرض
            </button>
          </Link>

          {row.status === 'DRAFT' && (
            <>
              <button
                onClick={() => handleLock(row.id, row.year, row.month)}
                style={{
                  padding: '8px 12px',
                  background: '#10B981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                🔒 قفل
              </button>

              <button
                onClick={() => handleDelete(row.id, row.year, row.month)}
                style={{
                  padding: '8px 12px',
                  background: '#EF4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                🗑️ حذف
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  if (permLoading) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
        <ResponsiveContainer size="xl">
          <SkeletonTable rows={5} />
        </ResponsiveContainer>
      </div>
    );
  }

  if (!hasPermission('payroll.manage')) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
        <ResponsiveContainer size="xl">
          <CardEnhanced variant="danger">
            <CardBody>
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '80px', marginBottom: '24px' }}>🚫</div>
                <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#DC2626', marginBottom: '12px' }}>
                  ليس لديك صلاحية
                </h2>
                <p style={{ fontSize: '16px', color: '#6B7280', marginBottom: '32px' }}>
                  هذه الصفحة متاحة للمديرين فقط. يمكنك عرض كشوف رواتبك من قسم الخدمة الذاتية.
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link href="/profile/payslips">
                    <button
                      style={{
                        padding: '14px 28px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '16px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
                      }}
                    >
                      💰 كشوف رواتبي
                    </button>
                  </Link>
                  <Link href="/dashboard">
                    <button
                      style={{
                        padding: '14px 28px',
                        background: 'white',
                        color: '#667eea',
                        border: '2px solid #667eea',
                        borderRadius: '10px',
                        fontSize: '16px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      ← الرئيسية
                    </button>
                  </Link>
                </div>
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
          title="💰 إدارة الرواتب"
          breadcrumbs={['الرئيسية', 'الموارد البشرية', 'الرواتب']}
        />

        {/* Generate New Payroll */}
        <CardEnhanced variant="gradient" style={{ marginBottom: '24px' }}>
          <CardHeader title="➕ إنشاء رواتب شهر جديد" />
          <CardBody>
            <ResponsiveGrid columns={{ mobile: 1, tablet: 3, desktop: 4 }} gap="md">
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: '#111827', marginBottom: '8px', fontWeight: '600' }}>
                  السنة
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '15px',
                    background: 'white',
                    fontWeight: '600'
                  }}
                >
                  {[2024, 2025, 2026, 2027].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', color: '#111827', marginBottom: '8px', fontWeight: '600' }}>
                  الشهر
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '15px',
                    background: 'white',
                    fontWeight: '600'
                  }}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                    <option key={m} value={m}>{getMonthName(m)}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end', gridColumn: 'span 2' }}>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  style={{
                    width: '100%',
                    padding: '14px 24px',
                    background: generating
                      ? '#9CA3AF'
                      : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '700',
                    cursor: generating ? 'not-allowed' : 'pointer'
                  }}
                >
                  {generating ? '⏳ جاري الإنشاء...' : '✨ إنشاء رواتب الشهر'}
                </button>
              </div>
            </ResponsiveGrid>
          </CardBody>
        </CardEnhanced>

        {/* Payroll Runs Table */}
        {loading ? (
          <SkeletonTable rows={10} />
        ) : (
          <TableEnhanced
            data={runs}
            columns={columns}
            loading={false}
            searchable={true}
            exportable={true}
            pageSize={25}
            emptyMessage="لم يتم إنشاء أي رواتب بعد"
            rowKey="id"
          />
        )}
      </ResponsiveContainer>
    </div>
  );
}

