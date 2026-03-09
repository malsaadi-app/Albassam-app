'use client';

import { useEffect, useState } from 'react';

interface AnalyticsData {
  period: string;
  summary: {
    totalDays: number;
    presentDays: number;
    lateDays: number;
    totalWorkHours: number;
    avgWorkHours: number;
    avgCheckInTime: string;
    punctualityRate: number;
    avgLateMinutes: number;
    bestStreak: number;
  };
  dayOfWeekStats: { [key: string]: number };
  weeklyTrend: Array<{ week: string; present: number; late: number; hours: number }>;
}

interface Props {
  userId?: string;
  period?: 'week' | 'month' | 'year';
}

export function AttendanceAnalytics({ userId, period = 'month' }: Props) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(period);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod, userId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ period: selectedPeriod });
      if (userId) params.append('userId', userId);
      
      const res = await fetch(`/api/attendance/analytics?${params}`);
      if (res.ok) {
        const analytics = await res.json();
        setData(analytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #E5E7EB',
          borderTop: '4px solid #667eea',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto'
        }}></div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
        لا توجد بيانات متاحة
      </div>
    );
  }

  const { summary, dayOfWeekStats, weeklyTrend } = data;

  // Find best day of week
  const bestDay = Object.entries(dayOfWeekStats).reduce((a, b) => a[1] > b[1] ? a : b);
  
  // Arabic day names
  const dayNames: { [key: string]: string } = {
    'Sunday': 'الأحد',
    'Monday': 'الاثنين',
    'Tuesday': 'الثلاثاء',
    'Wednesday': 'الأربعاء',
    'Thursday': 'الخميس',
    'Friday': 'الجمعة',
    'Saturday': 'السبت'
  };

  return (
    <div>
      {/* Period Selector */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
        {['week', 'month', 'year'].map(p => (
          <button
            key={p}
            onClick={() => setSelectedPeriod(p as any)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: selectedPeriod === p ? '2px solid #667eea' : '1px solid #E5E7EB',
              background: selectedPeriod === p ? '#EEF2FF' : 'white',
              color: selectedPeriod === p ? '#667eea' : '#6B7280',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {p === 'week' ? 'أسبوع' : p === 'month' ? 'شهر' : 'سنة'}
          </button>
        ))}
      </div>

      {/* Key Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '12px', padding: '20px', color: 'white' }}>
          <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '8px' }}>معدل الالتزام</div>
          <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{summary.punctualityRate}%</div>
          <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>
            {summary.presentDays} من {summary.totalDays} يوم
          </div>
        </div>

        <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>متوسط وقت الوصول</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827', fontFamily: 'monospace' }}>
            {summary.avgCheckInTime}
          </div>
          <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>
            ⏰ {summary.avgLateMinutes > 0 ? `متأخر ${summary.avgLateMinutes} دقيقة` : 'في الوقت'}
          </div>
        </div>

        <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>إجمالي ساعات العمل</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827' }}>
            {summary.totalWorkHours}
          </div>
          <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>
            📊 معدل {summary.avgWorkHours} ساعة/يوم
          </div>
        </div>

        <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>أطول سلسلة حضور</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10B981' }}>
            {summary.bestStreak}
          </div>
          <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>
            🔥 يوم متتالي
          </div>
        </div>
      </div>

      {/* Day of Week Chart */}
      <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '20px' }}>
          📅 الحضور حسب أيام الأسبوع
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {Object.entries(dayOfWeekStats).map(([day, count]) => {
            const maxCount = Math.max(...Object.values(dayOfWeekStats));
            const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
            const isBestDay = day === bestDay[0];
            
            return (
              <div key={day}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                  <span style={{ fontWeight: isBestDay ? '700' : '500', color: isBestDay ? '#667eea' : '#111827' }}>
                    {dayNames[day] || day} {isBestDay && '⭐'}
                  </span>
                  <span style={{ color: '#6B7280', fontFamily: 'monospace' }}>{count} يوم</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#F3F4F6', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${percentage}%`,
                    height: '100%',
                    background: isBestDay 
                      ? 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
                      : '#E5E7EB',
                    transition: 'width 0.3s'
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly Trend */}
      {weeklyTrend.length > 0 && (
        <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '20px' }}>
            📈 الاتجاه الأسبوعي
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {weeklyTrend.map((week, index) => (
              <div key={week.week} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                background: index === weeklyTrend.length - 1 ? '#F9FAFB' : 'transparent',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '13px', color: '#6B7280' }}>
                  أسبوع {new Date(week.week).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })}
                </div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                  <span style={{ color: '#10B981', fontWeight: '600' }}>✅ {week.present}</span>
                  <span style={{ color: '#F59E0B', fontWeight: '600' }}>⏰ {week.late}</span>
                  <span style={{ color: '#6B7280', fontFamily: 'monospace' }}>{week.hours.toFixed(1)}h</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Badges */}
      <div style={{ marginTop: '24px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        {summary.punctualityRate >= 95 && (
          <div style={{
            padding: '8px 16px',
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            color: 'white',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: '600'
          }}>
            🏆 ممتاز - معدل التزام عالي
          </div>
        )}
        {summary.bestStreak >= 10 && (
          <div style={{
            padding: '8px 16px',
            background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            color: 'white',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: '600'
          }}>
            🔥 ملتزم - {summary.bestStreak} يوم متتالي
          </div>
        )}
        {summary.avgLateMinutes === 0 && summary.presentDays > 5 && (
          <div style={{
            padding: '8px 16px',
            background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
            color: 'white',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: '600'
          }}>
            ⏰ دقيق - دائماً في الوقت
          </div>
        )}
      </div>
    </div>
  );
}
