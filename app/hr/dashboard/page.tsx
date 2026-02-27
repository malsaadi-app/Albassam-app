'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Stats } from '@/components/ui/Stats';
import { Badge } from '@/components/ui/Badge';

interface DashboardStats {
  employees: {
    total: number;
    active: number;
    onLeave: number;
    resigned: number;
    newThisMonth: number;
  };
  leaves: {
    pending: number;
    today: number;
    thisWeek: number;
    recent: any[];
  };
  documents: {
    expiringSoon: number;
    expired: number;
  };
  departmentStats: Array<{
    department: string;
    count: number;
  }>;
  recentEmployees: any[];
}

export default function HRDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/hr/dashboard/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB' }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #E5E7EB',
          borderTop: '4px solid #3B82F6',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}></div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
        <Card variant="default" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ padding: '60px 40px', textAlign: 'center' }}>
            <div style={{ fontSize: '80px', marginBottom: '24px' }}>❌</div>
            <h3 style={{ fontSize: '24px', color: '#111827', fontWeight: '800', marginBottom: '12px' }}>
              حدث خطأ في تحميل البيانات
            </h3>
            <Button variant="primary" onClick={() => fetchStats()}>
              إعادة المحاولة
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Page Header */}
        <PageHeader
          title="👥 لوحة تحكم الموارد البشرية"
          breadcrumbs={['الرئيسية', 'الموارد البشرية', 'لوحة التحكم']}
          actions={
            <>
              <Button variant="primary" onClick={() => router.push('/hr/employees')}>
                👥 الموظفين
              </Button>
              <Button variant="outline" onClick={() => router.push('/hr/leaves')}>
                🌴 الإجازات
              </Button>
              <Button variant="outline" onClick={() => router.push('/hr/attendance')}>
                ⏰ الحضور
              </Button>
            </>
          }
        />

        {/* Employee Statistics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          <Stats 
            label="إجمالي الموظفين" 
            value={stats.employees.total} 
            variant="blue" 
            icon="👥"
          />
          <Stats 
            label="نشط" 
            value={stats.employees.active} 
            variant="green" 
            icon="✅"
          />
          <Stats 
            label="في إجازة" 
            value={stats.employees.onLeave} 
            variant="yellow" 
            icon="🌴"
          />
          <Stats 
            label="موظفين جدد (هذا الشهر)" 
            value={stats.employees.newThisMonth} 
            variant="purple" 
            icon="🆕"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          {/* Leaves Section */}
          <Card variant="default">
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#111827', marginBottom: '20px' }}>
              🌴 الإجازات
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{
                background: '#FEF3C7',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #FDE68A'
              }}>
                <p style={{ fontSize: '13px', color: '#92400E', fontWeight: '600', marginBottom: '4px' }}>
                  معلقة
                </p>
                <p style={{ fontSize: '28px', fontWeight: '800', color: '#D97706', margin: 0 }}>
                  {stats.leaves.pending}
                </p>
              </div>

              <div style={{
                background: '#DBEAFE',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #93C5FD'
              }}>
                <p style={{ fontSize: '13px', color: '#1E3A8A', fontWeight: '600', marginBottom: '4px' }}>
                  اليوم
                </p>
                <p style={{ fontSize: '28px', fontWeight: '800', color: '#2563EB', margin: 0 }}>
                  {stats.leaves.today}
                </p>
              </div>

              <div style={{
                background: '#E0E7FF',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #C7D2FE'
              }}>
                <p style={{ fontSize: '13px', color: '#3730A3', fontWeight: '600', marginBottom: '4px' }}>
                  هذا الأسبوع
                </p>
                <p style={{ fontSize: '28px', fontWeight: '800', color: '#4F46E5', margin: 0 }}>
                  {stats.leaves.thisWeek}
                </p>
              </div>
            </div>

            {/* Recent Leaves */}
            {stats.leaves.recent && stats.leaves.recent.length > 0 && (
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#374151', marginBottom: '12px' }}>
                  آخر طلبات الإجازات
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {stats.leaves.recent.slice(0, 5).map((leave: any) => (
                    <div
                      key={leave.id}
                      style={{
                        background: '#F9FAFB',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: '1px solid #E5E7EB',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer'
                      }}
                      onClick={() => router.push(`/hr/leaves`)}
                    >
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>
                          {leave.employee?.displayName || 'موظف'}
                        </p>
                        <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600', margin: 0 }}>
                          {leave.leaveType} • {new Date(leave.startDate).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                      <Badge variant={leave.status === 'PENDING' ? 'yellow' : leave.status === 'APPROVED' ? 'green' : 'red'}>
                        {leave.status === 'PENDING' ? 'معلق' : leave.status === 'APPROVED' ? 'موافق' : 'مرفوض'}
                      </Badge>
                    </div>
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  size="md" 
                  onClick={() => router.push('/hr/leaves')}
                  style={{ width: '100%', marginTop: '16px' }}
                >
                  عرض الكل
                </Button>
              </div>
            )}
          </Card>

          {/* Documents Section */}
          <Card variant="default">
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#111827', marginBottom: '20px' }}>
              📄 الوثائق
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {stats.documents.expiringSoon > 0 && (
                <div style={{
                  background: '#FEF3C7',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid #FDE68A'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '32px' }}>⚠️</span>
                    <div>
                      <p style={{ fontSize: '28px', fontWeight: '800', color: '#D97706', margin: 0 }}>
                        {stats.documents.expiringSoon}
                      </p>
                      <p style={{ fontSize: '13px', color: '#92400E', fontWeight: '600', margin: 0 }}>
                        وثيقة تنتهي قريباً
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {stats.documents.expired > 0 && (
                <div style={{
                  background: '#FEE2E2',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid #FCA5A5'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '32px' }}>❌</span>
                    <div>
                      <p style={{ fontSize: '28px', fontWeight: '800', color: '#DC2626', margin: 0 }}>
                        {stats.documents.expired}
                      </p>
                      <p style={{ fontSize: '13px', color: '#7F1D1D', fontWeight: '600', margin: 0 }}>
                        وثيقة منتهية
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Button 
                variant="outline" 
                size="md" 
                onClick={() => router.push('/hr/employees')}
                style={{ width: '100%' }}
              >
                إدارة الوثائق
              </Button>
            </div>
          </Card>
        </div>

        {/* Department Stats & Recent Employees */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginBottom: '32px' }}>
          {/* Department Stats */}
          {stats.departmentStats && stats.departmentStats.length > 0 && (
            <Card variant="default">
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#111827', marginBottom: '20px' }}>
                📊 توزيع الموظفين حسب القسم
              </h3>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                gap: '16px' 
              }}>
                {stats.departmentStats.map((dept: any, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      background: '#F9FAFB',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '1px solid #E5E7EB'
                    }}
                  >
                    <p style={{ fontSize: '14px', color: '#6B7280', fontWeight: '600', marginBottom: '8px' }}>
                      {dept.department || 'بدون قسم'}
                    </p>
                    <p style={{ fontSize: '28px', fontWeight: '800', color: '#111827', margin: 0 }}>
                      {dept.count}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recent Employees */}
          {stats.recentEmployees && stats.recentEmployees.length > 0 && (
            <Card variant="default">
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#111827', marginBottom: '20px' }}>
                🆕 الموظفين الجدد
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {stats.recentEmployees.slice(0, 5).map((employee: any) => (
                  <div
                    key={employee.id}
                    style={{
                      background: '#F9FAFB',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '1px solid #E5E7EB',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                    onClick={() => router.push(`/hr/employees/${employee.id}`)}
                  >
                    <div>
                      <p style={{ fontSize: '16px', fontWeight: '800', color: '#111827', marginBottom: '4px' }}>
                        {employee.displayName}
                      </p>
                      <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600', margin: 0 }}>
                        {employee.jobTitle} • {employee.department}
                      </p>
                    </div>
                    <Badge variant="green">جديد</Badge>
                  </div>
                ))}
              </div>

              <Button 
                variant="outline" 
                size="md" 
                onClick={() => router.push('/hr/employees')}
                style={{ width: '100%', marginTop: '16px' }}
              >
                عرض كل الموظفين
              </Button>
            </Card>
          )}
        </div>

        {/* Quick Actions */}
        <Card variant="default">
          <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#111827', marginBottom: '20px' }}>
            ⚡ إجراءات سريعة
          </h3>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '16px' 
          }}>
            <Button variant="primary" onClick={() => router.push('/hr/employees/new')}>
              + إضافة موظف
            </Button>
            <Button variant="outline" onClick={() => router.push('/hr/attendance')}>
              ⏰ الحضور
            </Button>
            <Button variant="outline" onClick={() => router.push('/hr/leaves')}>
              🌴 طلبات الإجازات
            </Button>
            <Button variant="outline" onClick={() => router.push('/hr/requests')}>
              📋 الطلبات
            </Button>
            <Button variant="outline" onClick={() => router.push('/hr/payroll')}>
              💰 الرواتب
            </Button>
            <Button variant="outline" onClick={() => router.push('/hr/departments')}>
              🏢 الأقسام
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
