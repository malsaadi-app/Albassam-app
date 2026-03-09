'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface PendingCounts {
  total: number;
  breakdown: {
    hr: number;
    maintenance: number;
    purchase: number;
    attendance: number;
  };
}

export default function PendingRequestsCard() {
  const router = useRouter();
  const [counts, setCounts] = useState<PendingCounts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    try {
      const res = await fetch('/api/requests/pending-count');
      if (res.ok) {
        const data = await res.json();
        setCounts(data);
      }
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        border: '2px solid #E5E7EB'
      }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
        <div style={{ fontSize: '14px', color: '#6B7280' }}>جاري التحميل...</div>
      </div>
    );
  }

  if (!counts || counts.total === 0) {
    return null; // Don't show card if no pending requests
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      borderRadius: '16px',
      padding: '24px',
      color: 'white',
      boxShadow: '0 10px 25px rgba(245, 158, 11, 0.3)',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      border: 'none',
      position: 'relative',
      overflow: 'hidden'
    }}
    onClick={() => router.push('/requests')}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 15px 35px rgba(245, 158, 11, 0.4)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 10px 25px rgba(245, 158, 11, 0.3)';
    }}
    >
      {/* Animated background pattern */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-20%',
        width: '150%',
        height: '150%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
        animation: 'pulse 3s ease-in-out infinite'
      }}></div>
      
      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ fontSize: '32px' }}>📋</div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>
              طلبات في انتظار موافقتي
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              تحتاج اتخاذ إجراء
            </div>
          </div>
        </div>

        {/* Total Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.25)',
          padding: '8px 16px',
          borderRadius: '20px',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '28px', fontWeight: '800' }}>
            {counts.total}
          </div>
          <div style={{ fontSize: '14px', fontWeight: '600', opacity: 0.95 }}>
            طلب معلق
          </div>
        </div>

        {/* Breakdown */}
        <div style={{ 
          display: 'grid', 
          gap: '12px',
          marginBottom: '16px',
          background: 'rgba(0, 0, 0, 0.1)',
          borderRadius: '12px',
          padding: '16px'
        }}>
          {counts.breakdown.hr > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>👥</span>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>موارد بشرية</span>
              </div>
              <span style={{ 
                fontSize: '16px', 
                fontWeight: '800',
                background: 'rgba(255, 255, 255, 0.25)',
                padding: '4px 12px',
                borderRadius: '12px'
              }}>
                {counts.breakdown.hr}
              </span>
            </div>
          )}

          {counts.breakdown.maintenance > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🔧</span>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>صيانة</span>
              </div>
              <span style={{ 
                fontSize: '16px', 
                fontWeight: '800',
                background: 'rgba(255, 255, 255, 0.25)',
                padding: '4px 12px',
                borderRadius: '12px'
              }}>
                {counts.breakdown.maintenance}
              </span>
            </div>
          )}

          {counts.breakdown.purchase > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>📦</span>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>مشتريات</span>
              </div>
              <span style={{ 
                fontSize: '16px', 
                fontWeight: '800',
                background: 'rgba(255, 255, 255, 0.25)',
                padding: '4px 12px',
                borderRadius: '12px'
              }}>
                {counts.breakdown.purchase}
              </span>
            </div>
          )}

          {counts.breakdown.attendance > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>📅</span>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>حضور</span>
              </div>
              <span style={{ 
                fontSize: '16px', 
                fontWeight: '800',
                background: 'rgba(255, 255, 255, 0.25)',
                padding: '4px 12px',
                borderRadius: '12px'
              }}>
                {counts.breakdown.attendance}
              </span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '12px',
          background: 'rgba(255, 255, 255, 0.15)',
          borderRadius: '10px',
          fontSize: '14px',
          fontWeight: '700',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
        }}
        >
          عرض جميع الطلبات →
        </div>
      </div>

      {/* Animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
