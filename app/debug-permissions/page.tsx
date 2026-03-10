'use client';

import { useEffect, useState } from 'react';

export default function DebugPermissionsPage() {
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        setSessionData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(String(err));
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>جاري التحميل...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{
          background: '#fee',
          border: '2px solid #f00',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h2 style={{ color: '#f00', marginBottom: '10px' }}>❌ خطأ في تحميل Session</h2>
          <p>{error}</p>
        </div>
        
        <div style={{ background: '#fff3cd', border: '2px solid #ffc107', borderRadius: '8px', padding: '20px' }}>
          <h3>⚠️ ماذا يعني هذا؟</h3>
          <p>Session غير موجود أو منتهي الصلاحية.</p>
          <p><strong>الحل:</strong></p>
          <ol style={{ textAlign: 'right', direction: 'rtl' }}>
            <li>سجل خروج من الحساب</li>
            <li>سجل دخول من جديد</li>
            <li>ارجع لهذه الصفحة</li>
          </ol>
        </div>
      </div>
    );
  }

  const { user } = sessionData || {};
  const permissions = user?.permissions || [];
  const hasAttendanceSubmit = permissions.includes('attendance.submit');
  const hasAttendanceViewOwn = permissions.includes('attendance.view_own');

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', direction: 'rtl' }}>
      <h1 style={{ marginBottom: '30px', fontSize: '32px', fontWeight: 'bold' }}>
        🔍 صفحة تشخيص الصلاحيات
      </h1>

      {/* Session Status */}
      <div style={{
        background: sessionData?.user ? '#d4edda' : '#f8d7da',
        border: `2px solid ${sessionData?.user ? '#28a745' : '#dc3545'}`,
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '30px'
      }}>
        <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>
          {sessionData?.user ? '✅ Session نشط' : '❌ Session غير موجود'}
        </h2>
        {sessionData?.user && (
          <p style={{ fontSize: '16px', opacity: 0.9 }}>
            مسجل دخول كـ: <strong>{user.displayName}</strong> (@{user.username})
          </p>
        )}
      </div>

      {/* User Info */}
      {user && (
        <>
          <div style={{
            background: 'white',
            border: '2px solid #e0e0e0',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <h2 style={{ fontSize: '20px', marginBottom: '15px', borderBottom: '2px solid #667eea', paddingBottom: '10px' }}>
              👤 معلومات المستخدم
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold', width: '200px' }}>ID:</td>
                  <td style={{ padding: '10px', fontFamily: 'monospace', fontSize: '14px' }}>{user.id}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>Username:</td>
                  <td style={{ padding: '10px' }}>{user.username}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>Display Name:</td>
                  <td style={{ padding: '10px' }}>{user.displayName}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>Role:</td>
                  <td style={{ padding: '10px' }}>{user.role}</td>
                </tr>
                {user.systemRole && (
                  <>
                    <tr style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px', fontWeight: 'bold' }}>System Role:</td>
                      <td style={{ padding: '10px' }}>
                        {user.systemRole.nameAr} ({user.systemRole.name})
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px', fontWeight: 'bold' }}>System Role ID:</td>
                      <td style={{ padding: '10px', fontFamily: 'monospace', fontSize: '14px' }}>{user.systemRole.id}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Permissions */}
          <div style={{
            background: 'white',
            border: '2px solid #e0e0e0',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <h2 style={{ fontSize: '20px', marginBottom: '15px', borderBottom: '2px solid #667eea', paddingBottom: '10px' }}>
              🔐 الصلاحيات (Permissions)
            </h2>
            
            <p style={{ marginBottom: '15px', fontSize: '16px' }}>
              <strong>إجمالي الصلاحيات:</strong> {permissions.length}
            </p>

            {permissions.length === 0 ? (
              <div style={{
                background: '#fff3cd',
                border: '2px solid #ffc107',
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <h3 style={{ color: '#856404', marginBottom: '10px' }}>⚠️ لا توجد صلاحيات!</h3>
                <p>هذا هو السبب في عدم قدرتك على تسجيل الحضور.</p>
                <p style={{ marginTop: '15px' }}><strong>الحل:</strong></p>
                <ol style={{ textAlign: 'right', display: 'inline-block' }}>
                  <li>سجل خروج من الحساب</li>
                  <li>سجل دخول من جديد</li>
                  <li>Session الجديد سيحمل الصلاحيات ✅</li>
                </ol>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '10px' }}>
                {permissions.map((perm: string) => (
                  <div
                    key={perm}
                    style={{
                      background: perm.includes('attendance') ? '#d4edda' : '#f8f9fa',
                      border: `2px solid ${perm.includes('attendance') ? '#28a745' : '#dee2e6'}`,
                      borderRadius: '6px',
                      padding: '10px',
                      fontSize: '14px',
                      fontFamily: 'monospace'
                    }}
                  >
                    {perm.includes('attendance') && '🎯 '}
                    {perm}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Attendance Permissions Check */}
          <div style={{
            background: hasAttendanceSubmit ? '#d4edda' : '#f8d7da',
            border: `2px solid ${hasAttendanceSubmit ? '#28a745' : '#dc3545'}`,
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>
              {hasAttendanceSubmit ? '✅ صلاحيات الحضور موجودة' : '❌ صلاحيات الحضور مفقودة'}
            </h2>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>attendance.submit:</td>
                  <td style={{ padding: '10px', fontSize: '20px' }}>
                    {hasAttendanceSubmit ? '✅' : '❌'}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>attendance.view_own:</td>
                  <td style={{ padding: '10px', fontSize: '20px' }}>
                    {hasAttendanceViewOwn ? '✅' : '❌'}
                  </td>
                </tr>
              </tbody>
            </table>

            {!hasAttendanceSubmit && (
              <div style={{
                background: 'white',
                padding: '15px',
                borderRadius: '8px',
                marginTop: '15px'
              }}>
                <h3 style={{ marginBottom: '10px', color: '#dc3545' }}>⚠️ ماذا يجب أن تفعل؟</h3>
                <ol style={{ textAlign: 'right', marginRight: '20px' }}>
                  <li>اضغط على زر "تسجيل الخروج"</li>
                  <li>سجل دخول من جديد بنفس الحساب</li>
                  <li>ارجع لصفحة الحضور - سيعمل! ✅</li>
                </ol>
                <p style={{ marginTop: '15px', fontSize: '14px', opacity: 0.8 }}>
                  <strong>ملاحظة:</strong> قاعدة البيانات محدثة وصحيحة. المشكلة فقط في Session القديم.
                </p>
              </div>
            )}
          </div>

          {/* Raw JSON */}
          <details style={{ marginTop: '30px' }}>
            <summary style={{
              cursor: 'pointer',
              padding: '15px',
              background: '#f8f9fa',
              border: '2px solid #dee2e6',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold'
            }}>
              📄 عرض Session الكامل (JSON)
            </summary>
            <pre style={{
              background: '#282c34',
              color: '#61dafb',
              padding: '20px',
              borderRadius: '8px',
              overflow: 'auto',
              fontSize: '14px',
              fontFamily: 'monospace',
              marginTop: '10px'
            }}>
              {JSON.stringify(sessionData, null, 2)}
            </pre>
          </details>
        </>
      )}

      {/* Actions */}
      <div style={{
        marginTop: '40px',
        padding: '20px',
        background: '#f8f9fa',
        border: '2px solid #dee2e6',
        borderRadius: '12px',
        textAlign: 'center'
      }}>
        <h3 style={{ marginBottom: '20px' }}>🔧 إجراءات</h3>
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href="/api/force-relogin"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: '#dc3545',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '16px'
            }}
          >
            🔄 مسح Session وتسجيل خروج
          </a>
          <a
            href="/attendance"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: '#667eea',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '16px'
            }}
          >
            📍 الذهاب لصفحة الحضور
          </a>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            ♻️ تحديث الصفحة
          </button>
        </div>
      </div>
    </div>
  );
}
