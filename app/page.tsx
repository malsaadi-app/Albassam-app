'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'same-origin',
      });

      if (res.ok) {
        // Success - redirect using window.location for reliable navigation
        window.location.href = '/dashboard';
        return;
      }

      const data = await res.json().catch(() => ({ error: 'خطأ في تسجيل الدخول' }));
      setError(data.error || data.message || 'خطأ في تسجيل الدخول');
    } catch (err) {
      console.error('Login error:', err);
      setError('حدث خطأ. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1rem',
      background: 'linear-gradient(135deg, #1D0B3E 0%, #2D1B4E 50%, #3D2B5E 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Background Elements */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-10%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(212,165,116,0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        animation: 'pulse 8s ease-in-out infinite'
      }}></div>
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        left: '-10%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(230,126,34,0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        animation: 'pulse 6s ease-in-out infinite reverse'
      }}></div>

      <div style={{ maxWidth: '440px', width: '100%', position: 'relative', zIndex: 1 }}>
        {/* Logo and Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem', animation: 'fadeIn 0.6s ease-out' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <div style={{ 
              position: 'relative', 
              width: '120px', 
              height: '120px',
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '30px',
              padding: '1rem',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.18)'
            }}>
              <Image
                src="/logo.jpg"
                alt="Albassam Schools"
                fill
                style={{ objectFit: 'contain', padding: '0.5rem' }}
                priority
              />
            </div>
          </div>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: 'bold', 
            color: 'white',
            marginBottom: '0.5rem',
            textShadow: '0 2px 10px rgba(0,0,0,0.3)'
          }}>
            مدارس الباسم
          </h1>
          <p style={{ 
            color: 'rgba(255,255,255,0.8)', 
            fontSize: '1rem',
            fontWeight: '300'
          }}>
            نظام إدارة المهام
          </p>
        </div>

        {/* Login Card - Glassmorphism */}
        <div style={{ 
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '2.5rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
          border: '1px solid rgba(255,255,255,0.18)',
          animation: 'fadeIn 0.6s ease-out 0.2s backwards'
        }}>
          <div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Username */}
              <div>
                <label htmlFor="username" style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: '500', 
                  color: 'white',
                  marginBottom: '0.5rem',
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                }}>
                  اسم المستخدم
                </label>
                <input
                  id="username"
                  type="text"
                  required
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    background: 'rgba(255,255,255,0.95)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    outline: 'none',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
                    fontFamily: 'inherit'
                  }}
                  placeholder="أدخل اسم المستخدم"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  autoComplete="username"
                  onFocus={(e) => {
                    e.target.style.background = 'white';
                    e.target.style.boxShadow = '0 0 0 3px rgba(212,165,116,0.2), inset 0 2px 4px rgba(0,0,0,0.05)';
                  }}
                  onBlur={(e) => {
                    e.target.style.background = 'rgba(255,255,255,0.95)';
                    e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.05)';
                  }}
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: '500', 
                  color: 'white',
                  marginBottom: '0.5rem',
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                }}>
                  كلمة المرور
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    background: 'rgba(255,255,255,0.95)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    outline: 'none',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
                    fontFamily: 'inherit'
                  }}
                  placeholder="أدخل كلمة المرور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                  onFocus={(e) => {
                    e.target.style.background = 'white';
                    e.target.style.boxShadow = '0 0 0 3px rgba(212,165,116,0.2), inset 0 2px 4px rgba(0,0,0,0.05)';
                  }}
                  onBlur={(e) => {
                    e.target.style.background = 'rgba(255,255,255,0.95)';
                    e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.05)';
                  }}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div style={{
                  background: 'rgba(239,68,68,0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(220,38,38,0.5)',
                  color: 'white',
                  padding: '0.875rem 1rem',
                  borderRadius: '12px',
                  fontSize: '0.875rem',
                  animation: 'fadeIn 0.3s ease-out',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{ 
                  width: '100%',
                  padding: '1rem',
                  background: loading 
                    ? 'rgba(212,165,116,0.7)' 
                    : 'linear-gradient(135deg, #D4A574 0%, #E67E22 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: loading 
                    ? 'none' 
                    : '0 4px 15px rgba(212,165,116,0.4)',
                  transform: loading ? 'scale(1)' : 'scale(1)',
                  fontFamily: 'inherit'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(212,165,116,0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(212,165,116,0.4)';
                  }
                }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <span className="spinner" style={{ width: '16px', height: '16px' }}></span>
                    جاري تسجيل الدخول...
                  </span>
                ) : (
                  'تسجيل الدخول'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '2rem',
          animation: 'fadeIn 0.6s ease-out 0.4s backwards'
        }}>
          <p style={{ 
            color: 'rgba(255,255,255,0.6)', 
            fontSize: '0.813rem',
            fontWeight: '300',
            textShadow: '0 1px 2px rgba(0,0,0,0.2)'
          }}>
            © 2026 مدارس الباسم - جميع الحقوق محفوظة
          </p>
        </div>
      </div>

      {/* Inline Keyframes */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
}
