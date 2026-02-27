'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { COLORS } from '@/lib/colors';

type ReplacementStats = {
  total: number;
  success: number;
  failed: number;
  cancelled: number;
  byStatus: Array<{ status: string; count: number }>;
};

export default function ReplacementReportsPage() {
  const [stats, setStats] = useState<ReplacementStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/hr/replacements/stats');
      const data = await res.json();
      
      if (res.ok) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: `4px solid ${COLORS.gray200}`,
          borderTop: `4px solid ${COLORS.primary}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      {/* Header */}
      <div style={{
        background: 'white',
        borderBottom: `1px solid ${COLORS.gray200}`,
        position: 'sticky',
        top: 0,
        zIndex: 40
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: COLORS.gray900, marginBottom: '0.25rem' }}>
                تقارير الإحلال (ملخص)
              </h1>
              <p style={{ fontSize: '0.875rem', color: COLORS.gray600 }}>
                صفحة مبسطة — يمكن تطويرها لاحقاً (رسوم/تصدير).
              </p>
            </div>
            <Link
              href="/hr/replacements"
              style={{
                background: 'white',
                color: COLORS.gray900,
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: `1px solid ${COLORS.gray200}`,
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '0.875rem'
              }}
            >
              ← الرجوع
            </Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Statistics Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          {[
            { label: 'الإجمالي', value: stats?.total || 0, color: COLORS.primary },
            { label: 'نجاح', value: stats?.success || 0, color: COLORS.success },
            { label: 'فشل', value: stats?.failed || 0, color: COLORS.danger },
            { label: 'ملغي', value: stats?.cancelled || 0, color: COLORS.gray600 }
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: 'white',
                border: `1px solid ${COLORS.gray200}`,
                borderRadius: '0.75rem',
                padding: '1.5rem',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '0.875rem', color: COLORS.gray600, marginBottom: '0.5rem', fontWeight: '600' }}>
                {stat.label}
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: stat.color }}>
                {new Intl.NumberFormat('ar-SA').format(stat.value)}
              </div>
            </div>
          ))}
        </div>

        {/* Status Breakdown */}
        {stats && stats.byStatus && stats.byStatus.length > 0 && (
          <div style={{
            background: 'white',
            border: `1px solid ${COLORS.gray200}`,
            borderRadius: '0.75rem',
            padding: '1.5rem'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: COLORS.gray900, marginBottom: '1rem' }}>
              توزيع حسب الحالة
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              {stats.byStatus.map((item) => (
                <div
                  key={item.status}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: COLORS.gray50,
                    border: `1px solid ${COLORS.gray200}`,
                    borderRadius: '9999px',
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}
                >
                  <span style={{ color: COLORS.gray900 }}>{item.status}</span>
                  <span style={{
                    background: COLORS.primary,
                    color: 'white',
                    padding: '0.125rem 0.5rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: '700'
                  }}>
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div style={{
          marginTop: '1.5rem',
          background: COLORS.primaryLighter,
          border: `1px solid ${COLORS.primaryLight}`,
          borderRadius: '0.75rem',
          padding: '1.5rem',
          display: 'flex',
          alignItems: 'start',
          gap: '1rem'
        }}>
          <div style={{ fontSize: '1.5rem' }}>💡</div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: COLORS.primaryText, marginBottom: '0.5rem' }}>
              ملاحظة
            </h3>
            <p style={{ fontSize: '0.875rem', color: COLORS.gray600, lineHeight: '1.6' }}>
              هذه صفحة ملخص أساسية. يمكن تطويرها لاحقاً لتشمل رسوم بيانية تفصيلية، فلاتر متقدمة،
              وإمكانية تصدير التقارير بصيغ مختلفة (PDF, Excel).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
