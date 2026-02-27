'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';

interface RoleStats {
  role: string;
  count: number;
  arabicName: string;
  permissions: string[];
}

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings/roles')
      .then(res => res.json())
      .then(data => {
        setRoles(data.roles || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching roles:', err);
        setLoading(false);
      });
  }, []);

  const roleDescriptions: Record<string, { name: string; permissions: string[] }> = {
    ADMIN: {
      name: 'مدير النظام',
      permissions: ['الوصول الكامل', 'إدارة المستخدمين', 'إدارة الفروع', 'إدارة الإعدادات', 'عرض جميع التقارير']
    },
    HR_EMPLOYEE: {
      name: 'موظف موارد بشرية',
      permissions: ['إدارة الموظفين', 'إدارة الحضور والانصراف', 'إدارة الإجازات', 'عرض تقارير الموارد البشرية']
    },
    USER: {
      name: 'مستخدم عادي',
      permissions: ['عرض البيانات الخاصة', 'تسجيل الحضور', 'طلب الإجازات', 'عرض المهام الخاصة']
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <PageHeader
            title="🔐 الأدوار والصلاحيات"
            breadcrumbs={['الرئيسية', 'الإعدادات', 'الأدوار']}
          />
          <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '12px' }}>
            <div style={{ fontSize: '24px' }}>⏳</div>
            <div style={{ marginTop: '12px', color: '#6B7280' }}>جاري التحميل...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <PageHeader
          title="🔐 الأدوار والصلاحيات"
          breadcrumbs={['الرئيسية', 'الإعدادات', 'الأدوار']}
        />

        {/* إحصائيات سريعة */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '12px', padding: '24px', color: 'white' }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>إجمالي الأدوار</div>
            <div style={{ fontSize: '36px', fontWeight: '800' }}>{roles.length}</div>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', borderRadius: '12px', padding: '24px', color: 'white' }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>إجمالي المستخدمين</div>
            <div style={{ fontSize: '36px', fontWeight: '800' }}>
              {roles.reduce((sum, r) => sum + r.count, 0)}
            </div>
          </div>
        </div>

        {/* قائمة الأدوار */}
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #E5E7EB' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>
              الأدوار والصلاحيات
            </h2>
          </div>
          <div style={{ padding: '20px' }}>
            {roles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
                <div>لا توجد أدوار</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {roles.map((role) => {
                  const info = roleDescriptions[role.role] || { name: role.role, permissions: [] };
                  return (
                    <div
                      key={role.role}
                      style={{
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        padding: '20px',
                        background: '#F9FAFB'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div>
                          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>
                            {info.name}
                          </h3>
                          <div style={{ fontSize: '13px', color: '#6B7280' }}>
                            {role.role}
                          </div>
                        </div>
                        <div style={{
                          background: role.count > 0 ? '#10B981' : '#6B7280',
                          color: 'white',
                          padding: '6px 16px',
                          borderRadius: '20px',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}>
                          {role.count} مستخدم
                        </div>
                      </div>
                      
                      {/* الصلاحيات */}
                      {info.permissions.length > 0 && (
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                            الصلاحيات:
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {info.permissions.map((perm, idx) => (
                              <div
                                key={idx}
                                style={{
                                  background: 'white',
                                  border: '1px solid #D1D5DB',
                                  borderRadius: '6px',
                                  padding: '6px 12px',
                                  fontSize: '13px',
                                  color: '#374151'
                                }}
                              >
                                ✓ {perm}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ملاحظة */}
        <div style={{
          marginTop: '24px',
          background: '#EFF6FF',
          border: '1px solid #BFDBFE',
          borderRadius: '8px',
          padding: '16px',
          display: 'flex',
          gap: '12px'
        }}>
          <div style={{ fontSize: '20px' }}>ℹ️</div>
          <div style={{ fontSize: '14px', color: '#1E40AF' }}>
            <strong>ملاحظة:</strong> لتعديل صلاحيات الأدوار، يمكنك التواصل مع مدير النظام.
          </div>
        </div>
      </div>
    </div>
  );
}
