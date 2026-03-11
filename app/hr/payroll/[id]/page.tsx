'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { CardEnhanced, CardBody, CardHeader } from '@/components/ui/CardEnhanced';
import { ResponsiveContainer, ResponsiveGrid } from '@/components/layout/ResponsiveContainer';
import { TableEnhanced, Column } from '@/components/ui/TableEnhanced';
import { SkeletonTable } from '@/components/ui/LoadingStates';

interface PayrollLine {
  id: string;
  employeeId: string;
  employeeName: string;
  nationalId: string;
  employeeNumber: string;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
  additions: number;
  deductions: number;
  totalSalary: number;
  bankName: string | null;
  iban: string | null;
}

interface PayrollRun {
  id: string;
  year: number;
  month: number;
  status: 'DRAFT' | 'LOCKED';
  createdAt: string;
  lines: PayrollLine[];
}

export default function PayrollDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [run, setRun] = useState<PayrollRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (params.id) {
      fetchRun();
    }
  }, [params.id]);

  const fetchRun = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/hr/payroll/runs/${params.id}`);
      
      if (!res.ok) {
        if (res.status === 403) {
          setError('ليس لديك صلاحية');
          return;
        }
        throw new Error('فشل جلب البيانات');
      }

      const data = await res.json();
      setRun(data.run);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (month: number): string => {
    const months = [
      'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return months[month - 1] || '';
  };

  const exportToCSV = () => {
    if (!run) return;

    const headers = [
      'رقم الموظف',
      'الاسم',
      'رقم الهوية',
      'الراتب الأساسي',
      'بدل سكن',
      'بدل نقل',
      'بدلات أخرى',
      'إضافات',
      'خصومات',
      'صافي الراتب',
      'البنك',
      'IBAN'
    ];

    const rows = run.lines.map(line => [
      line.employeeNumber || '',
      line.employeeName,
      line.nationalId,
      line.basicSalary,
      line.housingAllowance,
      line.transportAllowance,
      line.otherAllowances,
      line.additions,
      line.deductions,
      line.totalSalary,
      line.bankName || '',
      line.iban || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `payroll-${run.year}-${run.month}.csv`;
    link.click();
  };

  const columns: Column<PayrollLine>[] = [
    {
      key: 'employeeNumber',
      label: 'رقم الموظف',
      sortable: true,
      render: (row) => (
        <span style={{ fontWeight: '600', fontSize: '14px' }}>
          {row.employeeNumber || '-'}
        </span>
      )
    },
    {
      key: 'employeeName',
      label: 'الاسم',
      sortable: true,
      render: (row) => (
        <div>
          <div style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>
            {row.employeeName}
          </div>
          <div style={{ fontSize: '12px', color: '#6B7280' }}>
            {row.nationalId}
          </div>
        </div>
      )
    },
    {
      key: 'basicSalary',
      label: 'الراتب الأساسي',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span style={{ fontWeight: '600', color: '#667eea' }}>
          {row.basicSalary.toLocaleString('ar-SA')}
        </span>
      )
    },
    {
      key: 'housingAllowance',
      label: 'بدل سكن',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span style={{ fontSize: '14px' }}>
          {row.housingAllowance.toLocaleString('ar-SA')}
        </span>
      )
    },
    {
      key: 'transportAllowance',
      label: 'بدل نقل',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span style={{ fontSize: '14px' }}>
          {row.transportAllowance.toLocaleString('ar-SA')}
        </span>
      )
    },
    {
      key: 'additions',
      label: 'إضافات',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span style={{ fontWeight: '600', color: '#10B981' }}>
          {row.additions > 0 ? `+${row.additions.toLocaleString('ar-SA')}` : '-'}
        </span>
      )
    },
    {
      key: 'deductions',
      label: 'خصومات',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span style={{ fontWeight: '600', color: '#EF4444' }}>
          {row.deductions > 0 ? `-${row.deductions.toLocaleString('ar-SA')}` : '-'}
        </span>
      )
    },
    {
      key: 'totalSalary',
      label: 'صافي الراتب',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span style={{ fontWeight: '800', fontSize: '15px', color: '#111827' }}>
          {row.totalSalary.toLocaleString('ar-SA')} ر.س
        </span>
      )
    }
  ];

  if (loading) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
        <ResponsiveContainer size="xl">
          <SkeletonTable rows={10} />
        </ResponsiveContainer>
      </div>
    );
  }

  if (error || !run) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
        <ResponsiveContainer size="xl">
          <CardEnhanced variant="danger">
            <CardBody>
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>⚠️</div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#DC2626', marginBottom: '8px' }}>
                  {error || 'لم يتم العثور على البيانات'}
                </h3>
                <Link href="/hr/payroll">
                  <button
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
                    ← العودة
                  </button>
                </Link>
              </div>
            </CardBody>
          </CardEnhanced>
        </ResponsiveContainer>
      </div>
    );
  }

  const totalEmployees = run.lines.length;
  const totalAmount = run.lines.reduce((sum, line) => sum + line.totalSalary, 0);
  const totalAdditions = run.lines.reduce((sum, line) => sum + line.additions, 0);
  const totalDeductions = run.lines.reduce((sum, line) => sum + line.deductions, 0);

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <ResponsiveContainer size="xl">
        <PageHeader
          title={`💰 رواتب ${getMonthName(run.month)} ${run.year}`}
          breadcrumbs={['الرئيسية', 'الموارد البشرية', 'الرواتب', 'التفاصيل']}
          actions={
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={exportToCSV}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '15px'
                }}
              >
                📥 تصدير CSV
              </button>

              <Link href="/hr/payroll">
                <button
                  style={{
                    padding: '12px 24px',
                    background: 'white',
                    color: '#667eea',
                    border: '2px solid #667eea',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '15px'
                  }}
                >
                  ← رجوع
                </button>
              </Link>
            </div>
          }
        />

        {/* Stats Cards */}
        <ResponsiveGrid columns={{ mobile: 2, tablet: 4, desktop: 4 }} gap="lg" style={{ marginBottom: '24px' }}>
          <CardEnhanced variant="gradient">
            <CardBody compact>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>👥</div>
                <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '6px' }}>عدد الموظفين</div>
                <div style={{ fontSize: '28px', fontWeight: '800', color: '#111827' }}>
                  {totalEmployees}
                </div>
              </div>
            </CardBody>
          </CardEnhanced>

          <CardEnhanced variant="success">
            <CardBody compact>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>💵</div>
                <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '6px' }}>إجمالي المبلغ</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#10B981' }}>
                  {totalAmount.toLocaleString('ar-SA')} ر.س
                </div>
              </div>
            </CardBody>
          </CardEnhanced>

          <CardEnhanced variant="outlined">
            <CardBody compact>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>➕</div>
                <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '6px' }}>إجمالي الإضافات</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#10B981' }}>
                  {totalAdditions.toLocaleString('ar-SA')} ر.س
                </div>
              </div>
            </CardBody>
          </CardEnhanced>

          <CardEnhanced variant="outlined">
            <CardBody compact>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>➖</div>
                <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '6px' }}>إجمالي الخصومات</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#EF4444' }}>
                  {totalDeductions.toLocaleString('ar-SA')} ر.س
                </div>
              </div>
            </CardBody>
          </CardEnhanced>
        </ResponsiveGrid>

        {/* Status Badge */}
        {run.status === 'LOCKED' && (
          <div style={{
            padding: '16px',
            background: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
            borderRadius: '12px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            border: '1px solid #10B981'
          }}>
            <div style={{ fontSize: '32px' }}>🔒</div>
            <div>
              <div style={{ fontWeight: '700', color: '#065F46', marginBottom: '4px' }}>
                الرواتب مقفلة
              </div>
              <div style={{ fontSize: '13px', color: '#065F46' }}>
                تم قفل هذه الرواتب ولا يمكن التعديل عليها
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <TableEnhanced
          data={run.lines}
          columns={columns}
          loading={false}
          searchable={true}
          exportable={false}
          pageSize={50}
          emptyMessage="لا توجد بيانات رواتب"
          rowKey="id"
        />
      </ResponsiveContainer>
    </div>
  );
}
