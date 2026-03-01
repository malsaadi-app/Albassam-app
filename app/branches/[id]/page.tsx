'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';

interface Stage {
  id: string;
  name: string;
  status: string;
}

interface BranchDetail {
  id: string;
  name: string;
  type: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  latitude: number | null;
  longitude: number | null;
  workStartTime: string;
  workEndTime: string;
  stages: Stage[];
  _count: {
    employees: number;
  };
}

export default function BranchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [branch, setBranch] = useState<BranchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    if (!params.id) return;

    // Best-effort current user role (for admin-only actions)
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setUserRole(d?.user?.role || ''))
      .catch(() => setUserRole(''))

    fetch(`/api/branches/${params.id}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch branch');
        return res.json();
      })
      .then(data => {
        setBranch(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching branch:', err);
        setError('فشل تحميل بيانات الفرع');
        setLoading(false);
      });
  }, [params.id]);

  const getTypeArabic = (type: string) => {
    const types: Record<string, string> = {
      SCHOOL: 'مدرسة',
      INSTITUTE: 'معهد',
      COMPANY: 'شركة'
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <PageHeader
            title="🏢 تفاصيل الفرع"
            breadcrumbs={['الرئيسية', 'الفروع', 'تفاصيل']}
          />
          <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '12px' }}>
            <div style={{ fontSize: '24px' }}>⏳</div>
            <div style={{ marginTop: '12px', color: '#6B7280' }}>جاري التحميل...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !branch) {
    return (
      <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <PageHeader
            title="🏢 تفاصيل الفرع"
            breadcrumbs={['الرئيسية', 'الفروع', 'تفاصيل']}
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
              {error || 'الفرع غير موجود'}
            </div>
            <button
              onClick={() => router.push('/branches')}
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
              العودة للفروع
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
          title="🏢 تفاصيل الفرع"
          breadcrumbs={['الرئيسية', 'الفروع', 'تفاصيل']}
        />

        {/* معلومات أساسية */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
                {branch.name}
              </h2>
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: '600',
                display: 'inline-block'
              }}>
                {getTypeArabic(branch.type)}
              </div>
            </div>
            <div style={{
              background: '#DBEAFE',
              color: '#1E40AF',
              padding: '12px 20px',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '28px', fontWeight: '800' }}>{branch._count.employees}</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>موظف</div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '16px' }}>
            {branch.address && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ fontSize: '18px' }}>📍</div>
                <div>
                  <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '4px' }}>العنوان</div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>
                    {branch.address}
                    {branch.city && `, ${branch.city}`}
                  </div>
                </div>
              </div>
            )}

            {branch.phone && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ fontSize: '18px' }}>📞</div>
                <div>
                  <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '4px' }}>الهاتف</div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827', direction: 'ltr', textAlign: 'right' }}>
                    {branch.phone}
                  </div>
                </div>
              </div>
            )}

            {branch.email && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ fontSize: '18px' }}>📧</div>
                <div>
                  <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '4px' }}>البريد الإلكتروني</div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>
                    {branch.email}
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ fontSize: '18px' }}>⏰</div>
              <div>
                <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '4px' }}>ساعات العمل</div>
                <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>
                  {branch.workStartTime} - {branch.workEndTime}
                </div>
              </div>
            </div>

            {branch.latitude && branch.longitude && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ fontSize: '18px' }}>🗺️</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '4px' }}>الإحداثيات</div>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: '#111827', fontFamily: 'monospace' }}>
                    {branch.latitude.toFixed(6)}, {branch.longitude.toFixed(6)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* المراحل الدراسية */}
        {branch.type === 'SCHOOL' && branch.stages.length > 0 && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '16px' }}>
                📚 المراحل الدراسية ({branch.stages.length})
              </h3>
              {userRole === 'ADMIN' && (
                <button
                  onClick={() => router.push(`/branches/${branch.id}/stages`)}
                  style={{
                    marginBottom: '16px',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #E5E7EB',
                    background: '#111827',
                    color: 'white',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  ⚙️ إدارة المراحل
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              {branch.stages.map(stage => (
                <div
                  key={stage.id}
                  style={{
                    background: '#F0FDF4',
                    border: '2px solid #86EFAC',
                    borderRadius: '8px',
                    padding: '16px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎓</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                    {stage.name}
                  </div>

                  {userRole === 'ADMIN' && (
                    <button
                      onClick={() => router.push(`/branches/${branch.id}/stages/${stage.id}`)}
                      style={{
                        marginTop: '10px',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        border: '1px solid #E5E7EB',
                        background: 'white',
                        color: '#111827',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      ⚙️ إدارة
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* معلومات النظام */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '16px' }}>
            ⚙️ معلومات النظام
          </h3>
          <div style={{ display: 'grid', gap: '12px', fontSize: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6B7280' }}>معرف الفرع:</span>
              <span style={{ fontWeight: '600', color: '#111827', fontFamily: 'monospace', fontSize: '13px' }}>
                {branch.id}
              </span>
            </div>
          </div>
        </div>

        {/* أزرار الإجراءات */}
        <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => router.push(`/branches/${branch.id}/edit`)}
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
            ✏️ تعديل الفرع
          </button>
          {branch.type === 'SCHOOL' && (
            <button
              onClick={() => router.push(`/branches/${branch.id}/stages`)}
              style={{
                padding: '12px 32px',
                background: '#10B981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              📚 إدارة المراحل
            </button>
          )}
          <button
            onClick={() => router.push('/branches')}
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
