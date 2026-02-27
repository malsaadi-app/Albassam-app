import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '24px',
      textAlign: 'center',
    }}>
      <h1 style={{ fontSize: '72px', marginBottom: '16px' }}>404</h1>
      <h2 style={{ fontSize: '24px', marginBottom: '8px', color: '#64748b' }}>
        الصفحة غير موجودة
      </h2>
      <p style={{ color: '#94a3b8', marginBottom: '24px' }}>
        عذراً، الصفحة التي تبحث عنها غير موجودة
      </p>
      <Link
        href="/"
        style={{
          padding: '12px 24px',
          backgroundColor: '#2D1B4E',
          color: 'white',
          borderRadius: '8px',
          textDecoration: 'none',
        }}
      >
        العودة للرئيسية
      </Link>
    </div>
  );
}
