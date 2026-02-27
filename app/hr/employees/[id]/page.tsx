'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    fetchUserRole();
    if (params.id) {
      fetchEmployee();
    }
  }, [params.id]);

  const fetchUserRole = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUserRole(data.user.role);
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const fetchEmployee = async () => {
    try {
      const res = await fetch(`/api/hr/employees/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setEmployee(data);
      }
    } catch (error) {
      console.error('Error fetching employee:', error);
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

  if (!employee) {
    return (
      <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
        <Card variant="default" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ padding: '60px 40px', textAlign: 'center' }}>
            <div style={{ fontSize: '80px', marginBottom: '24px' }}>❌</div>
            <h3 style={{ fontSize: '24px', color: '#111827', fontWeight: '800', marginBottom: '12px' }}>
              الموظف غير موجود
            </h3>
            <Button variant="primary" onClick={() => router.push('/hr/employees')}>
              العودة للقائمة
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const totalSalary =
    employee.basicSalary + employee.housingAllowance + employee.transportAllowance + employee.otherAllowances;

  const canEdit = userRole === 'ADMIN' || userRole === 'HR_EMPLOYEE';

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Page Header */}
        <PageHeader
          title={`👤 ${employee.fullNameAr || 'موظف'}`}
          breadcrumbs={['الرئيسية', 'شؤون الموظفين', 'الموظفين', employee.fullNameAr]}
          actions={
            <>
              {canEdit && (
                <>
                  <Button variant="primary" onClick={() => router.push(`/hr/employees/${params.id}/edit`)}>
                    ✏️ تعديل
                  </Button>
                  <Button variant="success" onClick={() => router.push(`/hr/employees/${params.id}/files`)}>
                    📂 ملفات
                  </Button>
                </>
              )}
              <Button variant="outline" onClick={() => router.push('/hr/employees')}>
                ← رجوع
              </Button>
            </>
          }
        />

        {/* Employee Info Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          marginBottom: '24px'
        }}>
          {/* Basic Info */}
          <Card variant="default">
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', marginBottom: '20px' }}>
              📋 البيانات الأساسية
            </h3>
            <InfoRow label="الاسم بالعربي" value={employee.fullNameAr} />
            <InfoRow label="الاسم بالإنجليزي" value={employee.fullNameEn || '-'} />
            <InfoRow label="رقم الهوية" value={employee.nationalId} />
            <InfoRow label="الجنسية" value={employee.nationality} />
            <InfoRow label="تاريخ الميلاد" value={new Date(employee.dateOfBirth).toLocaleDateString('ar-SA')} />
            <InfoRow label="الجنس" value={employee.gender === 'MALE' ? 'ذكر' : 'أنثى'} />
          </Card>

          {/* Job Info */}
          <Card variant="default">
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', marginBottom: '20px' }}>
              💼 البيانات الوظيفية
            </h3>
            <InfoRow label="رقم الموظف" value={employee.employeeNumber} />
            <InfoRow label="القسم" value={employee.department} />
            <InfoRow label="المسمى الوظيفي" value={employee.position} />
            <InfoRow label="المدير المباشر" value={employee.directManager || '-'} />
            <InfoRow label="تاريخ التوظيف" value={new Date(employee.hireDate).toLocaleDateString('ar-SA')} />
            <InfoRow
              label="نوع التوظيف"
              value={
                employee.employmentType === 'PERMANENT'
                  ? 'دائم'
                  : employee.employmentType === 'CONTRACT'
                    ? 'متعاقد'
                    : 'مؤقت'
              }
            />
          </Card>

          {/* Financial Info */}
          <Card variant="default">
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', marginBottom: '20px' }}>
              💰 البيانات المالية
            </h3>
            <InfoRow label="الراتب الأساسي" value={`${employee.basicSalary.toLocaleString('ar-SA')} ر.س`} />
            <InfoRow label="بدل السكن" value={`${employee.housingAllowance.toLocaleString('ar-SA')} ر.س`} />
            <InfoRow label="بدل النقل" value={`${employee.transportAllowance.toLocaleString('ar-SA')} ر.س`} />
            <InfoRow label="بدلات أخرى" value={`${employee.otherAllowances.toLocaleString('ar-SA')} ر.س`} />
            <div style={{
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '2px solid #E5E7EB'
            }}>
              <InfoRow label="إجمالي الراتب" value={`${totalSalary.toLocaleString('ar-SA')} ر.س`} bold />
            </div>
          </Card>

          {/* Contact Info */}
          <Card variant="default">
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', marginBottom: '20px' }}>
              📞 معلومات الاتصال
            </h3>
            <InfoRow label="الجوال" value={employee.phone} />
            <InfoRow label="البريد الإلكتروني" value={employee.email || '-'} />
            <InfoRow label="العنوان" value={employee.address || '-'} />
            <InfoRow label="المدينة" value={employee.city || '-'} />
          </Card>
        </div>

        {/* Leave Balance */}
        {employee.leaveBalance && (
          <Card variant="default" style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#111827', marginBottom: '20px' }}>
              🌴 رصيد الإجازات ({employee.leaveBalance.year})
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '20px'
            }}>
              <LeaveBalanceCard
                title="الإجازات السنوية"
                total={employee.leaveBalance.annualTotal}
                used={employee.leaveBalance.annualUsed}
                remaining={employee.leaveBalance.annualRemaining}
                color="#3B82F6"
              />
              <LeaveBalanceCard
                title="الإجازات العارضة"
                total={employee.leaveBalance.casualTotal}
                used={employee.leaveBalance.casualUsed}
                remaining={employee.leaveBalance.casualRemaining}
                color="#10B981"
              />
              {employee.leaveBalance.emergencyTotal > 0 && (
                <LeaveBalanceCard
                  title="الإجازات الاضطرارية"
                  total={employee.leaveBalance.emergencyTotal}
                  used={employee.leaveBalance.emergencyUsed}
                  remaining={employee.leaveBalance.emergencyRemaining}
                  color="#F59E0B"
                />
              )}
            </div>
          </Card>
        )}

        {/* Recent Leaves */}
        {employee.leaves && employee.leaves.length > 0 && (
          <Card variant="default">
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#111827', marginBottom: '20px' }}>
              📋 آخر الإجازات
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {employee.leaves.slice(0, 5).map((leave: any) => (
                <div
                  key={leave.id}
                  style={{
                    background: '#F9FAFB',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid #E5E7EB',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div>
                    <p style={{ fontSize: '16px', fontWeight: '800', color: '#111827', marginBottom: '4px' }}>
                      {leave.type} - {leave.days} يوم
                    </p>
                    <p style={{ fontSize: '14px', color: '#6B7280', fontWeight: '600', margin: 0 }}>
                      {new Date(leave.startDate).toLocaleDateString('ar-SA')} -{' '}
                      {new Date(leave.endDate).toLocaleDateString('ar-SA')}
                    </p>
                  </div>

                  <Badge
                    variant={
                      leave.status === 'APPROVED'
                        ? 'green'
                        : leave.status === 'PENDING'
                          ? 'yellow'
                          : 'red'
                    }
                  >
                    {leave.status === 'APPROVED' ? 'موافق' : leave.status === 'PENDING' ? 'معلق' : 'مرفوض'}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600', marginBottom: '4px' }}>
        {label}
      </p>
      <p style={{ fontSize: '15px', fontWeight: bold ? '800' : '700', color: '#111827', margin: 0 }}>
        {value}
      </p>
    </div>
  );
}

function LeaveBalanceCard({
  title,
  total,
  used,
  remaining,
  color
}: {
  title: string;
  total: number;
  used: number;
  remaining: number;
  color: string;
}) {
  const remainingColor = remaining > 5 ? '#10B981' : '#EF4444';

  return (
    <div style={{
      background: '#F9FAFB',
      padding: '20px',
      borderRadius: '12px',
      border: '1px solid #E5E7EB',
      borderRight: `4px solid ${color}`
    }}>
      <p style={{ fontSize: '15px', fontWeight: '800', color: '#111827', marginBottom: '16px' }}>
        {title}
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
        <span style={{ color: '#6B7280', fontWeight: '600' }}>الإجمالي:</span>
        <span style={{ fontWeight: '800', color: '#111827' }}>{total}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
        <span style={{ color: '#6B7280', fontWeight: '600' }}>المستخدم:</span>
        <span style={{ fontWeight: '800', color: '#111827' }}>{used}</span>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '14px',
        fontWeight: '800',
        marginTop: '16px',
        paddingTop: '16px',
        borderTop: '2px solid #E5E7EB'
      }}>
        <span style={{ color: '#111827' }}>المتبقي:</span>
        <span style={{ color: remainingColor, fontSize: '18px' }}>{remaining}</span>
      </div>
    </div>
  );
}
