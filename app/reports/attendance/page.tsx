'use client';
import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { 
  HiOutlineCalendar, 
  HiOutlineUserGroup, 
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineDownload,
  HiOutlineFilter
} from 'react-icons/hi';

interface AttendanceStats {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  avgWorkHours: number;
}

interface DailyAttendance {
  date: string;
  present: number;
  absent: number;
  late: number;
  onTime: number;
}

export default function AttendanceReportPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AttendanceStats>({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
    avgWorkHours: 0
  });
  const [dateRange, setDateRange] = useState('today');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  // Convert numbers to Western format
  const toWesternNum = (num: number): string => num.toLocaleString('en-US');

  useEffect(() => {
    fetchStats();
  }, [dateRange, departmentFilter]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      // Fetch from API - for now using mock data
      setTimeout(() => {
        setStats({
          totalEmployees: 30,
          presentToday: 26,
          absentToday: 4,
          lateToday: 3,
          avgWorkHours: 8.5
        });
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    alert('تصدير إلى Excel - سيتم التنفيذ قريباً');
  };

  const statCards = [
    {
      title: 'إجمالي الموظفين',
      value: stats.totalEmployees,
      icon: <HiOutlineUserGroup size={24} />,
      color: '#3B82F6',
      bgColor: '#EFF6FF'
    },
    {
      title: 'الحضور اليوم',
      value: stats.presentToday,
      icon: <HiOutlineCheckCircle size={24} />,
      color: '#10B981',
      bgColor: '#D1FAE5'
    },
    {
      title: 'الغياب اليوم',
      value: stats.absentToday,
      icon: <HiOutlineXCircle size={24} />,
      color: '#EF4444',
      bgColor: '#FEE2E2'
    },
    {
      title: 'التأخيرات اليوم',
      value: stats.lateToday,
      icon: <HiOutlineClock size={24} />,
      color: '#F59E0B',
      bgColor: '#FEF3C7'
    }
  ];

  // Mock daily data for chart
  const last7Days: DailyAttendance[] = [
    { date: '2024-02-19', present: 28, absent: 2, late: 2, onTime: 26 },
    { date: '2024-02-20', present: 27, absent: 3, late: 3, onTime: 24 },
    { date: '2024-02-21', present: 29, absent: 1, late: 1, onTime: 28 },
    { date: '2024-02-22', present: 26, absent: 4, late: 4, onTime: 22 },
    { date: '2024-02-23', present: 28, absent: 2, late: 2, onTime: 26 },
    { date: '2024-02-24', present: 27, absent: 3, late: 3, onTime: 24 },
    { date: '2024-02-25', present: 26, absent: 4, late: 3, onTime: 23 }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <PageHeader 
          title="تقرير الحضور والانصراف الشامل" 
          breadcrumbs={['الرئيسية', 'التقارير', 'الحضور']} 
        />

        {/* Filters Bar */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
          border: '1px solid #E5E7EB',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HiOutlineFilter size={20} style={{ color: '#6B7280' }} />
            <span style={{ fontWeight: '600', color: '#111827' }}>الفلاتر:</span>
          </div>

          {/* Date Range Filter */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #D1D5DB',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value="today">اليوم</option>
            <option value="week">هذا الأسبوع</option>
            <option value="month">هذا الشهر</option>
            <option value="quarter">هذا الربع</option>
            <option value="year">هذا العام</option>
            <option value="custom">فترة مخصصة</option>
          </select>

          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #D1D5DB',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value="all">جميع الأقسام</option>
            <option value="admin">الإدارة</option>
            <option value="hr">الموارد البشرية</option>
            <option value="it">تقنية المعلومات</option>
            <option value="finance">المالية</option>
            <option value="operations">العمليات</option>
          </select>

          {/* Export Button */}
          <button
            onClick={exportToExcel}
            style={{
              marginRight: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: '#10B981',
              color: 'white',
              borderRadius: '8px',
              border: 'none',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <HiOutlineDownload size={18} />
            تصدير Excel
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '24px'
        }}>
          {statCards.map((card, index) => (
            <div
              key={index}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                border: '1px solid #E5E7EB',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>
                    {card.title}
                  </p>
                  <p style={{ 
                    fontSize: '32px', 
                    fontWeight: '700', 
                    color: card.color,
                    fontVariantNumeric: 'lining-nums'
                  }}>
                    {toWesternNum(card.value)}
                  </p>
                </div>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: card.bgColor,
                  color: card.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {card.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Average Work Hours */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          border: '1px solid #E5E7EB'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <HiOutlineClock size={24} style={{ color: '#8B5CF6' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
              متوسط ساعات العمل
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ 
              fontSize: '48px', 
              fontWeight: '700', 
              color: '#8B5CF6',
              fontVariantNumeric: 'lining-nums'
            }}>
              {toWesternNum(stats.avgWorkHours)}
            </span>
            <span style={{ fontSize: '20px', color: '#6B7280' }}>ساعة / يوم</span>
          </div>
          <div style={{
            marginTop: '16px',
            height: '8px',
            background: '#EDE9FE',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${(stats.avgWorkHours / 12) * 100}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #8B5CF6, #A78BFA)',
              borderRadius: '4px'
            }} />
          </div>
        </div>

        {/* Daily Attendance Chart */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #E5E7EB'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '20px' }}>
            الحضور خلال آخر 7 أيام
          </h3>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', height: '300px' }}>
            {last7Days.map((day, index) => {
              const maxValue = 30;
              const presentHeight = (day.present / maxValue) * 100;
              const absentHeight = (day.absent / maxValue) * 100;
              
              return (
                <div 
                  key={index}
                  style={{ 
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <div style={{ 
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    alignItems: 'center'
                  }}>
                    {/* Present Bar */}
                    <div style={{
                      width: '100%',
                      height: `${presentHeight}%`,
                      minHeight: '20px',
                      background: 'linear-gradient(180deg, #10B981, #059669)',
                      borderRadius: '8px 8px 0 0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: '600',
                      fontVariantNumeric: 'lining-nums'
                    }}>
                      {toWesternNum(day.present)}
                    </div>
                  </div>
                  
                  {/* Date Label */}
                  <div style={{ 
                    fontSize: '11px', 
                    color: '#6B7280',
                    textAlign: 'center',
                    fontVariantNumeric: 'lining-nums'
                  }}>
                    {new Date(day.date).toLocaleDateString('ar-SA', { 
                      month: 'numeric',
                      day: 'numeric'
                    }).split('/').map(n => parseInt(n).toString()).join('/')}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '24px',
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: '1px solid #E5E7EB'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#10B981' }} />
              <span style={{ fontSize: '14px', color: '#6B7280' }}>حاضر</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#EF4444' }} />
              <span style={{ fontSize: '14px', color: '#6B7280' }}>غائب</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#F59E0B' }} />
              <span style={{ fontSize: '14px', color: '#6B7280' }}>متأخر</span>
            </div>
          </div>
        </div>

        {/* Summary Insights */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '12px',
          padding: '24px',
          marginTop: '24px',
          color: 'white'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
            📊 ملخص الأداء
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
            <p>• نسبة الحضور: <span style={{ 
              fontWeight: '700', 
              fontVariantNumeric: 'lining-nums' 
            }}>
              {toWesternNum(Math.round((stats.presentToday / stats.totalEmployees) * 100))}%
            </span></p>
            <p>• نسبة الالتزام بالمواعيد: <span style={{ 
              fontWeight: '700',
              fontVariantNumeric: 'lining-nums'
            }}>
              {toWesternNum(Math.round(((stats.presentToday - stats.lateToday) / stats.presentToday) * 100))}%
            </span></p>
            <p>• متوسط ساعات العمل أعلى من المعدل المطلوب (8 ساعات)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
