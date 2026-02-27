'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';

interface UserDetail {
  id: string;
  username: string;
  displayName: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  employee: {
    id: string;
    fullNameAr: string;
    fullNameEn: string | null;
    nationalId: string | null;
    position: string | null;
    branch: {
      id: string;
      name: string;
    } | null;
  } | null;
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!params.id) return;

    fetch(`/api/admin/users/${params.id}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch user');
        return res.json();
      })
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching user:', err);
        setError('فشل تحميل بيانات المستخدم');
        setLoading(false);
      });
  }, [params.id]);

  const getRoleArabic = (role: string) => {
    const roles: Record<string, string> = {
      ADMIN: 'مدير النظام',
      HR_EMPLOYEE: 'موظف موارد بشرية',
      USER: 'مستخدم عادي'
    };
    return roles[role] || role;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <PageHeader
            title="👤 تفاصيل المستخدم"
            breadcrumbs={['الرئيسية', 'المستخدمين', 'تفاصيل']}
            
          />
          <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '12px' }}>
            <div style={{ fontSize: '24px' }}>⏳</div>
            <div style={{ marginTop: '12px', color: '#6B7280' }}>جاري التحميل...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <PageHeader
            title="👤 تفاصيل المستخدم"
            breadcrumbs={['الرئيسية', 'المستخدمين', 'تفاصيل']}
            
          />
          <div style={{
            textAlign: 'center',
            padding: '60px',
            background: 'white',
            borderRadius: '12px',
            border: '2px solid #FCA5A5'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
            <div style={{ color: '#DC2626', fontSize: '18px', fontWeight: '600' }}>
              {error || 'المستخدم غير موجود'}
            </div>
            <button
              onClick={() => router.push('/admin/users')}
              style={{
                marginTop: '20px',
                padding: '10px 24px',
                background: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              العودة للمستخدمين
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <PageHeader
          title="👤 تفاصيل المستخدم"
          breadcrumbs={['الرئيسية', 'المستخدمين', 'تفاصيل']}
          
        />

        {/* معلومات أساسية */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
                {user.username}
              </h2>
              <div style={{ fontSize: '14px', color: '#6B7280' }}>
                {user.displayName}
              </div>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              {getRoleArabic(user.role)}
            </div>
          </div>

          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ fontSize: '18px' }}>👤</div>
              <div>
                <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '4px' }}>الموظف المرتبط</div>
                <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>
                  {user.employee ? user.employee.fullNameAr : 'غير مرتبط بموظف'}
                </div>
              </div>
            </div>

            {user.employee?.branch && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ fontSize: '18px' }}>🏢</div>
                <div>
                  <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '4px' }}>الفرع</div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>
                    {user.employee.branch.name}
                  </div>
                </div>
              </div>
            )}

            {user.employee?.position && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ fontSize: '18px' }}>💼</div>
                <div>
                  <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '4px' }}>المسمى الوظيفي</div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>
                    {user.employee.position}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* معلومات النظام */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '16px' }}>
            ⚙️ معلومات النظام
          </h3>
          <div style={{ display: 'grid', gap: '12px', fontSize: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6B7280' }}>معرف المستخدم:</span>
              <span style={{ fontWeight: '600', color: '#111827', fontFamily: 'monospace', fontSize: '13px' }}>
                {user.id}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6B7280' }}>تاريخ الإنشاء:</span>
              <span style={{ fontWeight: '600', color: '#111827' }}>
                {formatDate(user.createdAt)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6B7280' }}>آخر تحديث:</span>
              <span style={{ fontWeight: '600', color: '#111827' }}>
                {formatDate(user.updatedAt)}
              </span>
            </div>
          </div>
        </div>

        {/* أزرار الإجراءات */}
        <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={() => router.push(`/admin/users/${user.id}/edit`)}
            style={{
              padding: '12px 32px',
              background: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            ✏️ تعديل المستخدم
          </button>
          <button
            onClick={() => router.push('/admin/users')}
            style={{
              padding: '12px 32px',
              background: '#6B7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            ↩️ العودة
          </button>
        </div>
      </div>
    </div>
  );
}
