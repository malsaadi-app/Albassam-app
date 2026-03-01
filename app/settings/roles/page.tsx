'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';

interface SystemRoleRow {
  id: string;
  name: string;
  nameAr: string;
  nameEn?: string | null;
  description?: string | null;
  isActive: boolean;
  isSystem: boolean;
  userCount: number;
  permissionCount: number;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<SystemRoleRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings/roles')
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || 'Failed to fetch roles')
        return data
      })
      .then((data) => {
        setRoles(data.roles || [])
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error fetching roles:', err)
        setLoading(false)
      })
  }, [])

  // System roles are editable via /settings/roles/[id]

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
          actions={
            <Link
              href="/settings/roles/new"
              style={{
                background: '#111827',
                color: 'white',
                padding: '10px 14px',
                borderRadius: '10px',
                fontWeight: 800,
                textDecoration: 'none'
              }}
            >
              ➕ إضافة دور
            </Link>
          }
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
              {roles.reduce((sum, r) => sum + r.userCount, 0)}
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
                {roles.map((role) => (
                  <a
                    key={role.id}
                    href={`/settings/roles/${role.id}`}
                    style={{
                      border: '1px solid #E5E7EB',
                      borderRadius: '12px',
                      padding: '18px 18px',
                      background: 'white',
                      textDecoration: 'none',
                      color: 'inherit',
                      display: 'block'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#111827', margin: 0 }}>
                            {role.nameAr}
                          </h3>
                          {role.isSystem && (
                            <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '999px', background: '#EEF2FF', border: '1px solid #C7D2FE', color: '#3730A3', fontWeight: 800 }}>
                              🔒 نظام
                            </span>
                          )}
                          {!role.isActive && (
                            <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '999px', background: '#F3F4F6', border: '1px solid #E5E7EB', color: '#6B7280', fontWeight: 800 }}>
                              ⚫ معطل
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
                          {role.name} {role.description ? `— ${role.description}` : ''}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div style={{ textAlign: 'center', padding: '6px 12px', borderRadius: '999px', background: role.userCount > 0 ? '#10B981' : '#6B7280', color: 'white', fontWeight: 900, fontSize: '13px' }}>
                          {role.userCount} مستخدم
                        </div>
                        <div style={{ textAlign: 'center', padding: '6px 12px', borderRadius: '999px', background: '#111827', color: 'white', fontWeight: 900, fontSize: '13px' }}>
                          {role.permissionCount} صلاحية
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
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
            تقدر تضغط على أي دور عشان تعدل صلاحياته وتشوف المستخدمين المرتبطين فيه.
          </div>
        </div>
      </div>
    </div>
  );
}
