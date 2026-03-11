'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { CardEnhanced, CardBody, CardHeader } from '@/components/ui/CardEnhanced';
import { ResponsiveContainer, ResponsiveGrid } from '@/components/layout/ResponsiveContainer';
import { SkeletonCard } from '@/components/ui/LoadingStates';

interface PayslipItem {
  id: string;
  kind: 'ADDITION' | 'DEDUCTION';
  title: string;
  amount: number;
  notes: string | null;
}

interface Payslip {
  id: string;
  employeeName: string;
  nationalId: string;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
  additions: number;
  deductions: number;
  totalSalary: number;
  bankName: string | null;
  iban: string | null;
  payrollRun: {
    year: number;
    month: number;
    status: string;
  };
  employee: {
    branch: { name: string } | null;
    stage: { name: string } | null;
  };
  items: PayslipItem[];
}

export default function PayslipDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [payslip, setPayslip] = useState<Payslip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (params.id) {
      fetchPayslip();
    }
  }, [params.id]);

  const fetchPayslip = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/profile/payslips/${params.id}`);
      
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/');
          return;
        }
        if (res.status === 404) {
          setError('لم يتم العثور على كشف الراتب');
          return;
        }
        throw new Error('فشل جلب البيانات');
      }

      const data = await res.json();
      setPayslip(data.payslip);
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

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
        <ResponsiveContainer size="lg">
          <SkeletonCard />
        </ResponsiveContainer>
      </div>
    );
  }

  if (error || !payslip) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
        <ResponsiveContainer size="lg">
          <CardEnhanced variant="danger">
            <CardBody>
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>⚠️</div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#DC2626' }}>
                  {error || 'لم يتم العثور على البيانات'}
                </h3>
                <Link href="/profile/payslips">
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

  const additions = payslip.items.filter(item => item.kind === 'ADDITION');
  const deductions = payslip.items.filter(item => item.kind === 'DEDUCTION');

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div className="no-print">
        <ResponsiveContainer size="lg">
          <PageHeader
            title={`كشف راتب ${getMonthName(payslip.payrollRun.month)} ${payslip.payrollRun.year}`}
            breadcrumbs={['الرئيسية', 'الملف الشخصي', 'كشوف الرواتب', 'التفاصيل']}
            actions={
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handlePrint}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  🖨️ طباعة
                </button>

                <Link href="/profile/payslips">
                  <button
                    style={{
                      padding: '12px 24px',
                      background: 'white',
                      color: '#667eea',
                      border: '2px solid #667eea',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    ← رجوع
                  </button>
                </Link>
              </div>
            }
          />
        </ResponsiveContainer>
      </div>

      <ResponsiveContainer size="lg">
        {/* Print-friendly Payslip */}
        <CardEnhanced variant="outlined" style={{ background: 'white' }}>
          <CardBody>
            {/* Header */}
            <div style={{
              padding: '32px',
              background: 'linear-gradient(135deg, #1D0B3E 0%, #2D1B4E 100%)',
              color: 'white',
              borderRadius: '12px 12px 0 0',
              marginBottom: '32px'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>
                  كشف الراتب
                </h1>
                <div style={{ fontSize: '18px', opacity: 0.9 }}>
                  مدارس البسام العالمية
                </div>
              </div>

              <ResponsiveGrid columns={{ mobile: 1, tablet: 2 }} gap="md">
                <div>
                  <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '4px' }}>الموظف</div>
                  <div style={{ fontSize: '18px', fontWeight: '700' }}>{payslip.employeeName}</div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '4px' }}>رقم الهوية</div>
                  <div style={{ fontSize: '18px', fontWeight: '700' }}>{payslip.nationalId}</div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '4px' }}>الفترة</div>
                  <div style={{ fontSize: '18px', fontWeight: '700' }}>
                    {getMonthName(payslip.payrollRun.month)} {payslip.payrollRun.year}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '4px' }}>التاريخ</div>
                  <div style={{ fontSize: '18px', fontWeight: '700' }}>
                    {new Date().toLocaleDateString('ar-SA')}
                  </div>
                </div>
              </ResponsiveGrid>
            </div>

            {/* Salary Breakdown */}
            <div style={{ padding: '0 32px 32px' }}>
              {/* Basic Components */}
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#111827' }}>
                  مكونات الراتب الأساسية
                </h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#F9FAFB', borderRadius: '8px' }}>
                    <span style={{ fontWeight: '600' }}>الراتب الأساسي</span>
                    <span style={{ fontWeight: '700', color: '#667eea' }}>{payslip.basicSalary.toLocaleString('ar-SA')} ر.س</span>
                  </div>
                  {payslip.housingAllowance > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#F9FAFB', borderRadius: '8px' }}>
                      <span style={{ fontWeight: '600' }}>بدل السكن</span>
                      <span style={{ fontWeight: '700', color: '#667eea' }}>{payslip.housingAllowance.toLocaleString('ar-SA')} ر.س</span>
                    </div>
                  )}
                  {payslip.transportAllowance > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#F9FAFB', borderRadius: '8px' }}>
                      <span style={{ fontWeight: '600' }}>بدل النقل</span>
                      <span style={{ fontWeight: '700', color: '#667eea' }}>{payslip.transportAllowance.toLocaleString('ar-SA')} ر.س</span>
                    </div>
                  )}
                  {payslip.otherAllowances > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#F9FAFB', borderRadius: '8px' }}>
                      <span style={{ fontWeight: '600' }}>بدلات أخرى</span>
                      <span style={{ fontWeight: '700', color: '#667eea' }}>{payslip.otherAllowances.toLocaleString('ar-SA')} ر.س</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Additions */}
              {additions.length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#111827' }}>
                    ➕ الإضافات
                  </h3>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {additions.map(item => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#D1FAE5', borderRadius: '8px' }}>
                        <div>
                          <div style={{ fontWeight: '600', color: '#065F46' }}>{item.title}</div>
                          {item.notes && <div style={{ fontSize: '12px', color: '#10B981', marginTop: '4px' }}>{item.notes}</div>}
                        </div>
                        <span style={{ fontWeight: '700', color: '#065F46' }}>+{item.amount.toLocaleString('ar-SA')} ر.س</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Deductions */}
              {deductions.length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#111827' }}>
                    ➖ الخصومات
                  </h3>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {deductions.map(item => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#FEE2E2', borderRadius: '8px' }}>
                        <div>
                          <div style={{ fontWeight: '600', color: '#991B1B' }}>{item.title}</div>
                          {item.notes && <div style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px' }}>{item.notes}</div>}
                        </div>
                        <span style={{ fontWeight: '700', color: '#991B1B' }}>-{item.amount.toLocaleString('ar-SA')} ر.س</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Total */}
              <div style={{
                padding: '24px',
                background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
                borderRadius: '12px',
                border: '2px solid #667eea'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '20px', fontWeight: '700', color: '#111827' }}>صافي الراتب</span>
                  <span style={{ fontSize: '32px', fontWeight: '800', color: '#667eea' }}>
                    {payslip.totalSalary.toLocaleString('ar-SA')} ر.س
                  </span>
                </div>
              </div>

              {/* Bank Info */}
              {payslip.bankName && (
                <div style={{ marginTop: '32px', padding: '20px', background: '#F9FAFB', borderRadius: '12px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: '#111827' }}>
                    معلومات التحويل البنكي
                  </h4>
                  <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
                    <div><strong>البنك:</strong> {payslip.bankName}</div>
                    {payslip.iban && <div><strong>IBAN:</strong> <code style={{ background: 'white', padding: '4px 8px', borderRadius: '4px' }}>{payslip.iban}</code></div>}
                  </div>
                </div>
              )}
            </div>
          </CardBody>
        </CardEnhanced>
      </ResponsiveContainer>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          * { background: transparent !important; box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}
