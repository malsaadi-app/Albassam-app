'use client';
import { PageHeader } from '@/components/ui/PageHeader';
import Link from 'next/link';
import {
  HiOutlineCog,
  HiOutlineClock,
  HiOutlineBell,
  HiOutlineShieldCheck,
  HiOutlineDatabase,
  HiOutlineUserGroup,
  HiOutlineOfficeBuilding,
  HiOutlineKey,
  HiOutlineColorSwatch,
  HiOutlineGlobe,
  HiOutlineDocumentText,
  HiOutlineChevronLeft
} from 'react-icons/hi';

interface SettingCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  badge?: string;
  badgeColor?: string;
}

export default function SettingsPage() {
  const settingsSections: SettingCard[] = [
    {
      title: 'الإعدادات العامة',
      description: 'اسم النظام، الشعار، معلومات الشركة، وإعدادات الموقع',
      icon: <HiOutlineCog size={24} />,
      href: '/settings/general',
    },
    {
      title: 'إعدادات الحضور',
      description: 'أوقات العمل، فترات التأخير، قواعد احتساب الساعات',
      icon: <HiOutlineClock size={24} />,
      href: '/settings/attendance',
    },
    {
      title: 'إعدادات الإشعارات',
      description: 'تنبيهات البريد الإلكتروني، الرسائل النصية، والإشعارات الفورية',
      icon: <HiOutlineBell size={24} />,
      href: '/settings/notifications',
      badge: 'قريباً',
      badgeColor: '#F59E0B'
    },
    {
      title: 'إعدادات الأمان',
      description: 'سياسات كلمات المرور، المصادقة الثنائية، سجل الوصول',
      icon: <HiOutlineShieldCheck size={24} />,
      href: '/settings/security',
      badge: 'قريباً',
      badgeColor: '#F59E0B'
    },
    {
      title: 'النسخ الاحتياطي',
      description: 'جدولة النسخ الاحتياطي التلقائي واستعادة البيانات',
      icon: <HiOutlineDatabase size={24} />,
      href: '/settings/backup',
      badge: 'قريباً',
      badgeColor: '#F59E0B'
    },
    {
      title: 'إعدادات الموظفين',
      description: 'حقول مخصصة، فئات الموظفين، وقواعد الإجازات',
      icon: <HiOutlineUserGroup size={24} />,
      href: '/hr/employees',
    },
    {
      title: 'إدارة الفروع',
      description: 'الفروع، المواقع، أرقام الهواتف، والعناوين',
      icon: <HiOutlineOfficeBuilding size={24} />,
      href: '/settings/branches',
    },
    {
      title: 'الصلاحيات والأدوار',
      description: 'إدارة أدوار المستخدمين وصلاحيات الوصول',
      icon: <HiOutlineKey size={24} />,
      href: '/settings/roles',
    },
    {
      title: 'المظهر والواجهة',
      description: 'الألوان، الخطوط، والقوالب المخصصة',
      icon: <HiOutlineColorSwatch size={24} />,
      href: '/settings/appearance',
      badge: 'قريباً',
      badgeColor: '#F59E0B'
    },
    {
      title: 'اللغة والترجمة',
      description: 'اللغات المدعومة، الترجمات، والتوطين',
      icon: <HiOutlineGlobe size={24} />,
      href: '/settings/language',
    },
    {
      title: 'القوالب والنماذج',
      description: 'قوالب المستندات، العقود، والتقارير',
      icon: <HiOutlineDocumentText size={24} />,
      href: '/settings/templates',
      badge: 'قريباً',
      badgeColor: '#F59E0B'
    },
    {
      title: 'التفويضات',
      description: 'تفويض الصلاحيات المؤقتة للموظفين',
      icon: <HiOutlineKey size={24} />,
      href: '/settings/delegations',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <PageHeader title="إعدادات النظام" breadcrumbs={['الرئيسية', 'الإعدادات']} />

        {/* System Status Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '32px',
          color: 'white',
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
                🏫 مدارس الباسم
              </h2>
              <p style={{ opacity: 0.9, fontSize: '14px' }}>
                نظام إدارة المهام والموارد البشرية
              </p>
            </div>
            <div style={{
              display: 'flex',
              gap: '24px',
              flexWrap: 'wrap'
            }}>
              <div>
                <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>
                  الإصدار
                </div>
                <div style={{ fontSize: '18px', fontWeight: '700' }}>
                  v1.0.0
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>
                  الحالة
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '16px',
                  fontWeight: '600'
                }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#10B981',
                    animation: 'pulse 2s infinite'
                  }} />
                  نشط
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '20px'
        }}>
          {settingsSections.map((setting, index) => (
            <Link
              key={index}
              href={setting.href}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                textDecoration: 'none',
                border: '1px solid #E5E7EB',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.08)';
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = '#3B82F6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = '#E5E7EB';
              }}
            >
              {/* Badge */}
              {setting.badge && (
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: setting.badgeColor || '#3B82F6',
                  color: 'white',
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '4px 10px',
                  borderRadius: '12px'
                }}>
                  {setting.badge}
                </div>
              )}

              {/* Icon */}
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                marginBottom: '16px'
              }}>
                {setting.icon}
              </div>

              {/* Content */}
              <h3 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#111827',
                marginBottom: '8px'
              }}>
                {setting.title}
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#6B7280',
                lineHeight: '1.6',
                flex: 1
              }}>
                {setting.description}
              </p>

              {/* Arrow */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                marginTop: '16px',
                color: '#3B82F6',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                <span style={{ marginLeft: '8px' }}>انتقال</span>
                <HiOutlineChevronLeft size={16} />
              </div>
            </Link>
          ))}
        </div>

        {/* Help Section */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          marginTop: '32px',
          border: '1px solid #E5E7EB'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#FEF3C7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              flexShrink: 0
            }}>
              💡
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '700',
                color: '#111827',
                marginBottom: '8px'
              }}>
                هل تحتاج مساعدة؟
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#6B7280',
                marginBottom: '12px',
                lineHeight: '1.6'
              }}>
                إذا كنت بحاجة إلى مساعدة في ضبط الإعدادات، يمكنك مراجعة دليل الاستخدام أو التواصل مع الدعم الفني.
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button style={{
                  background: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#2563EB'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#3B82F6'}
                >
                  دليل الاستخدام
                </button>
                <button style={{
                  background: 'white',
                  color: '#3B82F6',
                  border: '1px solid #3B82F6',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#EFF6FF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                }}
                >
                  الدعم الفني
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
