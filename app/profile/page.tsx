'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Input, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

type User = {
  id: string;
  username: string;
  displayName: string;
  role: 'ADMIN' | 'USER' | 'HR_EMPLOYEE';
  telegramId: string | null;
  notificationsEnabled: boolean;
};

type EmployeeSummary = {
  id: string;
  fullNameAr: string;
  fullNameEn: string | null;
  nationalId: string;
  employeeNumber: string;
  jobTitle: string | null;
  department: string | null;
  branch: { id: string; name: string } | null;
  stage: { id: string; name: string } | null;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [employee, setEmployee] = useState<EmployeeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [telegramId, setTelegramId] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.status === 401) {
        router.push('/');
        return;
      }
      const data = await res.json();
      setUser(data.user);
      setEmployee(data.employee || null);
      setTelegramId(data.user.telegramId || '');
      setNotificationsEnabled(data.user.notificationsEnabled ?? true);
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'كلمة المرور الجديدة غير متطابقة' });
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setMessage({ type: 'error', text: 'حدث خطأ. يرجى المحاولة مرة أخرى.' });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    setSavingSettings(true);
    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          telegramId: telegramId.trim() || null, 
          notificationsEnabled 
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: 'تم حفظ الإعدادات بنجاح' });
        fetchUser();
      } else {
        setMessage({ type: 'error', text: data.error || 'فشل حفظ الإعدادات' });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'حدث خطأ. يرجى المحاولة مرة أخرى.' });
    } finally {
      setSavingSettings(false);
    }
  };

  const getRoleText = (role: string) => {
    const roles: Record<string, string> = {
      ADMIN: 'مدير',
      USER: 'موظف',
      HR_EMPLOYEE: 'موظف موارد بشرية'
    };
    return roles[role] || 'موظف';
  };

  const getRoleColor = (role: string): 'blue' | 'green' | 'purple' => {
    const colors: Record<string, 'blue' | 'green' | 'purple'> = {
      ADMIN: 'purple',
      USER: 'blue',
      HR_EMPLOYEE: 'green'
    };
    return colors[role] || 'blue';
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

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Page Header */}
        <PageHeader
          title="الملف الشخصي"
          breadcrumbs={['الرئيسية', 'الإعدادات', 'الملف الشخصي']}
          actions={
            <Button variant="primary" onClick={() => router.push('/dashboard')}>
              ← الرئيسية
            </Button>
          }
        />

        {/* Message Alert */}
        {message && (
          <div style={{
            background: message.type === 'success' ? '#D1FAE5' : '#FEE2E2',
            border: `2px solid ${message.type === 'success' ? '#10B981' : '#EF4444'}`,
            color: message.type === 'success' ? '#065F46' : '#991B1B',
            padding: '16px 20px',
            borderRadius: '12px',
            marginBottom: '24px',
            fontSize: '15px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: 'slideDown 0.3s ease-out'
          }}>
            <span style={{ fontSize: '24px' }}>
              {message.type === 'success' ? '✅' : '❌'}
            </span>
            {message.text}
          </div>
        )}

        {/* User Info Card */}
        <Card variant="default" className="mb-6">
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              fontWeight: '700',
              color: 'white',
              boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)',
              flexShrink: 0
            }}>
              {user?.displayName?.charAt(0).toUpperCase() || 'U'}
            </div>

            {/* User Info */}
            <div style={{ flex: 1 }}>
              <h2 style={{ 
                fontSize: '28px', 
                fontWeight: '800', 
                color: '#111827', 
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                {user?.displayName}
                <Badge variant={getRoleColor(user?.role || 'USER')} size="lg">
                  {getRoleText(user?.role || 'USER')}
                </Badge>
              </h2>
              <p style={{ fontSize: '15px', color: '#6B7280', fontWeight: '500' }}>
                @{user?.username}
              </p>
            </div>
          </div>

          {/* User Details Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            padding: '20px',
            background: '#F9FAFB',
            borderRadius: '12px'
          }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#6B7280', marginBottom: '6px' }}>
                اسم المستخدم
              </p>
              <p style={{ fontSize: '15px', fontWeight: '700', color: '#111827' }}>
                {user?.username}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#6B7280', marginBottom: '6px' }}>
                حالة الإشعارات
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {user?.notificationsEnabled ? (
                  <Badge variant="green" dot>مفعلة</Badge>
                ) : (
                  <Badge variant="gray">معطلة</Badge>
                )}
              </div>
            </div>
            {user?.telegramId && (
              <div>
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#6B7280', marginBottom: '6px' }}>
                  Telegram ID
                </p>
                <p style={{ fontSize: '15px', fontWeight: '700', color: '#111827', fontFamily: 'monospace' }}>
                  {user.telegramId}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Employee Info Card */}
        {employee && (
          <Card variant="default" className="mb-6">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span style={{ fontSize: '28px' }}>🧾</span>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#111827', margin: 0 }}>بيانات الموظف</h3>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              padding: '16px',
              background: '#F9FAFB',
              borderRadius: '12px'
            }}>
              <div>
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#6B7280', marginBottom: '6px' }}>الاسم</p>
                <p style={{ fontSize: '15px', fontWeight: '800', color: '#111827' }}>{employee.fullNameAr}</p>
              </div>
              {employee.jobTitle && (
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#6B7280', marginBottom: '6px' }}>المسمى الوظيفي</p>
                  <p style={{ fontSize: '15px', fontWeight: '700', color: '#111827' }}>{employee.jobTitle}</p>
                </div>
              )}
              {employee.branch?.name && (
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#6B7280', marginBottom: '6px' }}>المنشأة</p>
                  <p style={{ fontSize: '15px', fontWeight: '700', color: '#111827' }}>{employee.branch.name}</p>
                </div>
              )}
              <div>
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#6B7280', marginBottom: '6px' }}>رقم الهوية/الإقامة</p>
                <p style={{ fontSize: '15px', fontWeight: '700', color: '#111827', fontFamily: 'monospace' }}>{employee.nationalId}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Telegram Settings Card */}
        <Card variant="default" className="mb-6">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <span style={{ fontSize: '32px' }}>🔔</span>
            <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#111827', margin: 0 }}>
              إعدادات Telegram
            </h3>
          </div>

          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Input
              label="Telegram ID (اختياري)"
              placeholder="مثال: 123456789"
              value={telegramId}
              onChange={(e) => setTelegramId(e.target.value)}
              helperText="💡 للحصول على Telegram ID الخاص بك، تحدث مع البوت @userinfobot"
            />

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px',
              background: '#F9FAFB',
              borderRadius: '12px',
              border: '2px solid #E5E7EB',
              transition: 'all 0.2s'
            }}>
              <input
                type="checkbox"
                id="notificationsEnabled"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                style={{
                  width: '20px',
                  height: '20px',
                  cursor: 'pointer',
                  accentColor: '#3B82F6'
                }}
              />
              <label htmlFor="notificationsEnabled" style={{ 
                fontSize: '15px', 
                fontWeight: '600',
                color: '#374151', 
                cursor: 'pointer',
                flex: 1
              }}>
                تفعيل الإشعارات عبر Telegram
              </label>
            </div>

            <Button 
              type="submit" 
              variant="success" 
              size="lg" 
              loading={savingSettings}
              style={{ width: '100%' }}
            >
              {savingSettings ? 'جاري الحفظ...' : '💾 حفظ الإعدادات'}
            </Button>
          </form>
        </Card>

        {/* Change Password Card */}
        <Card variant="default">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <span style={{ fontSize: '32px' }}>🔐</span>
            <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#111827', margin: 0 }}>
              تغيير كلمة المرور
            </h3>
          </div>

          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Input
              label="كلمة المرور الحالية"
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              autoComplete="current-password"
            />

            <Input
              label="كلمة المرور الجديدة (8 أحرف على الأقل)"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              helperText={newPassword && newPassword.length < 8 ? '⚠️ كلمة المرور قصيرة جداً' : ''}
              error={newPassword.length > 0 && newPassword.length < 8}
            />

            <Input
              label="تأكيد كلمة المرور الجديدة"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              helperText={confirmPassword && newPassword !== confirmPassword ? '⚠️ كلمة المرور غير متطابقة' : ''}
              error={confirmPassword.length > 0 && newPassword !== confirmPassword}
            />

            <Button 
              type="submit" 
              variant="danger" 
              size="lg" 
              loading={savingPassword}
              style={{ width: '100%' }}
            >
              {savingPassword ? 'جاري التغيير...' : '🔒 تغيير كلمة المرور'}
            </Button>
          </form>
        </Card>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
