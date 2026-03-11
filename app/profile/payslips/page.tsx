'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { CardEnhanced, CardBody, CardHeader } from '@/components/ui/CardEnhanced';
import { ResponsiveContainer, ResponsiveGrid } from '@/components/layout/ResponsiveContainer';
import { SkeletonCard } from '@/components/ui/LoadingStates';

interface Payslip {
  id: string;
  year: number;
  month: number;
  totalSalary: number;
  status: string;
  createdAt: string;
}

export default function PayslipsPage() {
  const router = useRouter();
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPayslips();
  }, []);

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/profile/payslips');
      
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/');
          return;
        }
        throw new Error('فشل جلب البيانات');
      }

      const data = await res.json();
      setPayslips(data.payslips || []);
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

  const getStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string; text: string }> = {
      DRAFT: { bg: '#FEF3C7', color: '#92400E', text: 'مسودة' },
      LOCKED: { bg: '#D1FAE5', color: '#065F46', text: 'نهائي' }
    };
    const config = map[status] || map.LOCKED;
    return (
      <span
        style={{
          background: config.bg,
          color: config.color,
          padding: '4px 10px',
          borderRadius: '10px',
          fontSize: '12px',
          fontWeight: '600'
        }}
      >
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
        <ResponsiveContainer size="xl">
          <PageHeader title="كشوف الرواتب" breadcrumbs={['الرئيسية', 'الملف الشخصي', 'كشوف الرواتب']} />
          <ResponsiveGrid columns={{ mobile: 1, tablet: 2, desktop: 3 }} gap="lg">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </ResponsiveGrid>
        </ResponsiveContainer>
      </div>
    );
  }

  if (error) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
        <ResponsiveContainer size="xl">
          <PageHeader title="كشوف الرواتب" breadcrumbs={['الرئيسية', 'الملف الشخصي', 'كشوف الرواتب']} />
          <CardEnhanced variant="danger">
            <CardBody>
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>⚠️</div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#DC2626', marginBottom: '8px' }}>
                  خطأ في تحميل البيانات
                </h3>
                <p style={{ color: '#6B7280', marginBottom: '24px' }}>{error}</p>
                <button
                  onClick={fetchPayslips}
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

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <ResponsiveContainer size="xl">
        <PageHeader
          title="💰 كشوف الرواتب"
          breadcrumbs={['الرئيسية', 'الملف الشخصي', 'كشوف الرواتب']}
        />

        {/* Info Banner */}
        <div style={{
          padding: '16px',
          background: 'linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%)',
          borderRadius: '12px',
          marginBottom: '24px',
          border: '1px solid #A5B4FC'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ fontSize: '28px' }}>ℹ️</div>
            <div>
              <div style={{ fontWeight: '700', color: '#3730A3', marginBottom: '4px' }}>
                معلومات مهمة
              </div>
              <div style={{ fontSize: '14px', color: '#4338CA', lineHeight: '1.6' }}>
                يمكنك الاطلاع على كشوف رواتبك الشهرية هنا. الكشوف النهائية فقط متاحة للتحميل.
                للحصول على شهادة راتب رسمية، يرجى تقديم طلب من قسم الموارد البشرية.
              </div>
            </div>
          </div>
        </div>

        {/* Payslips Grid */}
        {payslips.length === 0 ? (
          <CardEnhanced variant="outlined">
            <CardBody>
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '80px', marginBottom: '24px' }}>💰</div>
                <h3 style={{ fontSize: '22px', fontWeight: '600', color: '#6B7280', marginBottom: '12px' }}>
                  لا توجد كشوف رواتب
                </h3>
                <p style={{ fontSize: '15px', color: '#9CA3AF' }}>
                  لم يتم إنشاء أي كشوف رواتب لحسابك حتى الآن
                </p>
              </div>
            </CardBody>
          </CardEnhanced>
        ) : (
          <ResponsiveGrid columns={{ mobile: 1, tablet: 2, desktop: 3 }} gap="lg">
            {payslips.map((payslip) => (
              <CardEnhanced key={payslip.id} variant="elevated">
                <CardBody>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>
                          {getMonthName(payslip.month)} {payslip.year}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6B7280' }}>
                          {new Date(payslip.createdAt).toLocaleDateString('ar-SA')}
                        </div>
                      </div>
                      {getStatusBadge(payslip.status)}
                    </div>

                    <div style={{
                      background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
                      borderRadius: '12px',
                      padding: '20px',
                      marginBottom: '16px',
                      border: '1px solid #E0E7FF'
                    }}>
                      <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '6px' }}>
                        صافي الراتب
                      </div>
                      <div style={{ fontSize: '28px', fontWeight: '800', color: '#667eea' }}>
                        {payslip.totalSalary.toLocaleString('ar-SA')} <span style={{ fontSize: '18px' }}>ر.س</span>
                      </div>
                    </div>

                    <Link href={`/profile/payslips/${payslip.id}`}>
                      <button
                        style={{
                          width: '100%',
                          padding: '12px',
                          background: payslip.status === 'LOCKED' 
                            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                            : 'linear-gradient(135deg, #D1D5DB 0%, #9CA3AF 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: '600',
                          cursor: payslip.status === 'LOCKED' ? 'pointer' : 'not-allowed',
                          fontSize: '14px',
                          opacity: payslip.status === 'LOCKED' ? 1 : 0.6
                        }}
                        disabled={payslip.status !== 'LOCKED'}
                      >
                        {payslip.status === 'LOCKED' ? '📄 عرض الكشف' : '🔒 غير متاح بعد'}
                      </button>
                    </Link>
                  </div>
                </CardBody>
              </CardEnhanced>
            ))}
          </ResponsiveGrid>
        )}

        {/* Help Section */}
        {payslips.length > 0 && (
          <CardEnhanced variant="outlined" style={{ marginTop: '32px' }}>
            <CardHeader title="❓ أسئلة شائعة" />
            <CardBody>
              <div style={{ display: 'grid', gap: '16px', fontSize: '14px', lineHeight: '1.8' }}>
                <div>
                  <strong style={{ color: '#111827' }}>متى يتم إصدار كشوف الرواتب؟</strong>
                  <p style={{ margin: '4px 0 0 0', color: '#6B7280' }}>
                    عادة يتم إصدار كشوف الرواتب في نهاية كل شهر أو بداية الشهر التالي.
                  </p>
                </div>

                <div>
                  <strong style={{ color: '#111827' }}>هل يمكنني طباعة الكشف؟</strong>
                  <p style={{ margin: '4px 0 0 0', color: '#6B7280' }}>
                    نعم، يمكنك عرض الكشف وطباعته مباشرة من متصفحك.
                  </p>
                </div>

                <div>
                  <strong style={{ color: '#111827' }}>كيف أحصل على شهادة راتب رسمية؟</strong>
                  <p style={{ margin: '4px 0 0 0', color: '#6B7280' }}>
                    يمكنك تقديم طلب شهادة راتب من خلال قسم الطلبات في النظام، وسيتم اعتمادها من قبل الموارد البشرية.
                  </p>
                </div>
              </div>
            </CardBody>
          </CardEnhanced>
        )}
      </ResponsiveContainer>
    </div>
  );
}
