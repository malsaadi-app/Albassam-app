import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/session';
import Link from 'next/link';
import NewRoleForm from './NewRoleForm';

export default async function NewRolePage() {
  const session = await getSession(await cookies());
  
  if (!session?.user) {
    redirect('/');
  }

  return (
    <>
      <style>{`
        .back-link:hover {
          opacity: 0.8;
        }
      `}</style>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '2rem', direction: 'rtl' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ background: 'rgba(255, 255, 255, 0.95)', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1a202c', marginBottom: '0.5rem' }}>
              ➕ إضافة دور جديد
            </h1>
            <p style={{ color: '#718096' }}>
              إنشاء دور جديد مع تحديد الصلاحيات
            </p>
          </div>

          {/* Form */}
          <NewRoleForm />

          {/* Back Button */}
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <Link 
              href="/settings/roles"
              className="back-link"
              style={{
                color: 'white',
                textDecoration: 'none',
                fontSize: '1rem',
                opacity: 0.9,
                transition: 'opacity 0.2s'
              }}
            >
              ← العودة لقائمة الأدوار
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
