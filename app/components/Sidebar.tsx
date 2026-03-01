'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/useI18n';
import { 
  HiOutlineHome, 
  HiOutlineClipboardList, 
  HiOutlineOfficeBuilding,
  HiOutlineClock,
  HiOutlineUserGroup,
  HiOutlineCube,
  HiOutlineBell,
  HiOutlineChartBar,
  HiOutlineCog,
  HiOutlineLogout,
  HiOutlineChevronDown,
  HiOutlineX,
  HiOutlineSearch,
  HiOutlineUser,
  HiOutlineDocumentText,
  HiOutlineClipboardCheck,
  HiOutlinePencil,
  HiOutlineViewGrid,
  HiOutlineBriefcase,
  HiOutlineUserAdd,
  HiOutlineCurrencyDollar,
  HiOutlineShoppingCart,
  HiOutlineTruck,
  HiOutlineTag,
  HiOutlineShieldCheck,
  HiOutlineLocationMarker
} from 'react-icons/hi';

interface MenuItem {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

interface MenuSection {
  id: string;
  icon: React.ReactNode;
  label: string;
  items: MenuItem[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const { t, locale, setLocale, dir } = useI18n();

  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [userRole, setUserRole] = useState<string>('');
  const [isImpersonating, setIsImpersonating] = useState(false);

  useEffect(() => {
    fetchPendingCounts();
    fetchUserRole();
    const interval = setInterval(fetchPendingCounts, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchPendingCounts = async () => {
    try {
      const res = await fetch('/api/sidebar/counts');
      if (res.ok) {
        const data = await res.json();
        setPendingRequestsCount(data.pendingApprovals || 0);
        setUnreadNotificationsCount(data.unreadNotifications || 0);
      }
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  };

  const fetchUserRole = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUserRole(data.user?.role || data.role || '');
        setIsImpersonating(data.isImpersonating || false);
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const fullMenuSections: MenuSection[] = [
    {
      id: 'main',
      icon: <HiOutlineHome size={18} />,
      label: t('mainMenu'),
      items: [
        { href: '/dashboard', icon: <HiOutlineViewGrid size={18} />, label: t('home') },
        { href: '/tasks', icon: <HiOutlineClipboardList size={18} />, label: t('tasks') },
        { href: '/attendance', icon: <HiOutlineClock size={18} />, label: t('attendance') },
        { href: '/notifications', icon: <HiOutlineBell size={18} />, label: t('notifications'), badge: unreadNotificationsCount },
        { href: '/workflows/approvals', icon: <HiOutlineClipboardCheck size={18} />, label: t('workflowApprovals'), badge: pendingRequestsCount },
      ]
    },
    {
      id: 'hr',
      icon: <HiOutlineUserGroup size={18} />,
      label: t('hr'),
      items: [
        { href: '/hr/employees', icon: <HiOutlineUser size={18} />, label: t('employees') },
        { href: '/hr/leaves', icon: <HiOutlineDocumentText size={18} />, label: t('leaves') },
        { href: '/hr/requests', icon: <HiOutlineClipboardCheck size={18} />, label: t('hrRequests') },
        { href: '/hr/attendance', icon: <HiOutlineClock size={18} />, label: t('attendance') },
        { href: '/hr/attendance/correction', icon: <HiOutlinePencil size={18} />, label: t('attendanceRequests') },
        { href: '/hr/job-applications', icon: <HiOutlineUserAdd size={18} />, label: t('jobApplications') },
      ]
    },
    {
      id: 'procurement',
      icon: <HiOutlineShoppingCart size={18} />,
      label: t('procurement'),
      items: [
        { href: '/procurement/requests', icon: <HiOutlineClipboardList size={18} />, label: t('procurementRequests') },
        { href: '/procurement/purchase-orders', icon: <HiOutlineDocumentText size={18} />, label: t('purchaseOrders') },
        { href: '/procurement/suppliers', icon: <HiOutlineTruck size={18} />, label: t('suppliers') },
      ]
    },
    {
      id: 'maintenance',
      icon: <HiOutlineCube size={18} />,
      label: t('maintenance'),
      items: [
        { href: '/maintenance/requests', icon: <HiOutlineClipboardCheck size={18} />, label: t('maintenanceRequests') },
        { href: '/maintenance/assets', icon: <HiOutlineCube size={18} />, label: t('maintenanceAssets') },
        { href: '/maintenance/vendors', icon: <HiOutlineUserGroup size={18} />, label: t('maintenanceVendors') },
      ]
    },
    {
      id: 'finance',
      icon: <HiOutlineCurrencyDollar size={18} />,
      label: t('finance'),
      items: [
        { href: '/finance/requests', icon: <HiOutlineClipboardCheck size={18} />, label: t('financeRequests') },
      ]
    },
    {
      id: 'reports',
      icon: <HiOutlineChartBar size={18} />,
      label: t('reports'),
      items: [
        { href: '/reports', icon: <HiOutlineChartBar size={18} />, label: t('allReports') },
        { href: '/reports/attendance', icon: <HiOutlineClock size={18} />, label: t('attendanceReports') },
        { href: '/reports/financial', icon: <HiOutlineCurrencyDollar size={18} />, label: t('financialReports') },
      ]
    },
    {
      id: 'workflow',
      icon: <HiOutlineClipboardList size={18} />,
      label: t('workflow'),
      items: [
        { href: '/workflows', icon: <HiOutlineClipboardList size={18} />, label: t('workflow') },
        { href: '/workflows/approvals', icon: <HiOutlineClipboardCheck size={18} />, label: t('workflowApprovals'), badge: 0 },
        { href: '/workflows/stages', icon: <HiOutlineTag size={18} />, label: t('workflowStages') },
      ]
    },
    {
      id: 'settings',
      icon: <HiOutlineCog size={18} />,
      label: t('settings'),
      items: [
        { href: '/branches', icon: <HiOutlineOfficeBuilding size={18} />, label: t('branches') },
        { href: '/settings/locations', icon: <HiOutlineLocationMarker size={18} />, label: t('locations') },
        { href: '/settings/roles', icon: <HiOutlineShieldCheck size={18} />, label: t('rolesAndPermissions') },
        { href: '/settings/delegations', icon: <HiOutlineUserGroup size={18} />, label: t('delegations') },
        { href: '/hr/succession', icon: <HiOutlineUserGroup size={18} />, label: t('succession') },
        { href: '/hr/positions', icon: <HiOutlineBriefcase size={18} />, label: t('positions') },
        { href: '/settings', icon: <HiOutlineCog size={18} />, label: t('systemSettings') },
        ...(userRole === 'ADMIN' ? [
          { href: '/admin', icon: <HiOutlineShieldCheck size={18} />, label: t('adminPanel') },
        ] : []),
      ]
    },
  ];

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const menuSections: MenuSection[] = (() => {
    // Restrict what normal employees see
    if (userRole === 'USER') {
      return [
        {
          id: 'main',
          icon: <HiOutlineHome size={18} />,
          label: t('mainMenu'),
          items: [
            { href: '/dashboard', icon: <HiOutlineViewGrid size={18} />, label: t('home') },
            { href: '/attendance', icon: <HiOutlineClock size={18} />, label: t('attendance') },
            { href: '/notifications', icon: <HiOutlineBell size={18} />, label: t('notifications'), badge: unreadNotificationsCount },
            { href: '/workflows/approvals', icon: <HiOutlineClipboardCheck size={18} />, label: t('workflowApprovals'), badge: pendingRequestsCount },
          ]
        },
        {
          id: 'hr',
          icon: <HiOutlineUserGroup size={18} />,
          label: t('hr'),
          items: [
            { href: '/hr/requests', icon: <HiOutlineClipboardCheck size={18} />, label: t('hrRequests') },
          ]
        },
        {
          id: 'procurement',
          icon: <HiOutlineShoppingCart size={18} />,
          label: t('procurement'),
          items: [
            { href: '/procurement/requests', icon: <HiOutlineClipboardList size={18} />, label: t('procurementRequests') },
          ]
        },
        {
          id: 'maintenance',
          icon: <HiOutlineCube size={18} />,
          label: t('maintenance'),
          items: [
            { href: '/maintenance/requests', icon: <HiOutlineClipboardCheck size={18} />, label: t('maintenanceRequests') },
          ]
        },
      ];
    }

    return fullMenuSections;
  })();

  const filteredSections = menuSections.map(section => ({
    ...section,
    items: section.items.filter(item =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(section => section.items.length > 0);

  const handleLogout = async () => {
    if (confirm(t('confirmLogout'))) {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/';
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
  };

  // Hide sidebar on auth pages
  if (pathname?.startsWith('/auth')) {
    return null;
  }

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1001,
          background: '#3B82F6',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          padding: '12px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.background = '#2563EB';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.background = '#3B82F6';
        }}
      >
        {isOpen ? <HiOutlineX size={24} /> : <HiOutlineViewGrid size={24} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
            backdropFilter: 'blur(2px)'
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '280px',
          background: 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease-in-out',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.08)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '24px 20px',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)'
        }}>
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <div style={{
              fontSize: '24px',
              fontWeight: '800',
              color: '#1E293B',
              marginBottom: '4px',
              letterSpacing: '-0.5px'
            }}>
              🏫 Albassam Group Platform
            </div>
            <div style={{
              fontSize: '13px',
              color: '#64748B',
              fontWeight: '500'
            }}>
              {t('tasks')}
            </div>
          </Link>
        </div>

        {/* Search */}
        <div style={{ padding: '16px 20px' }}>
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center'
          }}>
            <HiOutlineSearch size={18} style={{
              position: 'absolute',
              right: '12px',
              color: '#94A3B8'
            }} />
            <input
              type="text"
              placeholder={t('search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 40px 10px 12px',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                color: '#1E293B',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Menu Sections */}
        <nav style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 16px 16px'
        }}>
          {filteredSections.map(section => (
            <div key={section.id} style={{ marginBottom: '8px' }}>
              <button
                onClick={() => toggleSection(section.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 12px',
                  background: 'transparent',
                  border: 'none',
                  color: '#475569',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ opacity: 0.8 }}>{section.icon}</span>
                  <span>{section.label}</span>
                </div>
                <HiOutlineChevronDown
                  size={16}
                  style={{
                    transform: expandedSections.has(section.id) ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.2s'
                  }}
                />
              </button>

              {expandedSections.has(section.id) && (
                <div style={{
                  marginTop: '4px',
                  paddingRight: '8px'
                }}>
                  {section.items.map(item => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 16px',
                        color: pathname === item.href ? '#3B82F6' : '#64748B',
                        background: pathname === item.href ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                        borderRight: pathname === item.href ? '3px solid #3B82F6' : '3px solid transparent',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: pathname === item.href ? '600' : '500',
                        textDecoration: 'none',
                        transition: 'all 0.2s',
                        marginBottom: '2px'
                      }}
                      onMouseEnter={(e) => {
                        if (pathname !== item.href) {
                          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.04)';
                          e.currentTarget.style.color = '#1E293B';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (pathname !== item.href) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = '#64748B';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ opacity: 0.8 }}>{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      {item.badge && item.badge > 0 && (
                        <span style={{
                          background: '#EF4444',
                          color: 'white',
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          minWidth: '20px',
                          textAlign: 'center'
                        }}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid rgba(0, 0, 0, 0.08)'
        }}>
          {isImpersonating && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid #EF4444',
              borderRadius: '8px',
              padding: '8px 12px',
              marginBottom: '12px',
              fontSize: '12px',
              color: '#DC2626',
              textAlign: 'center'
            }}>
              ⚠️ وضع المحاكاة نشط
              <div style={{ marginTop: 8 }}>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/auth/revert-impersonation', { method: 'POST' })
                      if (!res.ok) {
                        const data = await res.json().catch(() => ({}))
                        alert(data?.error || 'تعذر الرجوع للحساب الأصلي')
                        return
                      }
                      window.location.href = '/dashboard'
                    } catch {
                      alert('تعذر الرجوع للحساب الأصلي')
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '10px',
                    border: '1px solid #EF4444',
                    background: '#FFFFFF',
                    color: '#DC2626',
                    fontSize: '12px',
                    fontWeight: 900,
                    cursor: 'pointer'
                  }}
                >
                  ↩️ الرجوع لحساب المدير
                </button>
              </div>
            </div>
          )}

          {/* Language quick switch */}
          <div dir={dir} style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <button
              type="button"
              onClick={() => setLocale('ar')}
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: '10px',
                border: locale === 'ar' ? '1px solid #2563EB' : '1px solid #CBD5E1',
                background: locale === 'ar' ? 'rgba(37, 99, 235, 0.08)' : '#FFFFFF',
                color: '#0F172A',
                fontSize: '12px',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              العربية
            </button>
            <button
              type="button"
              onClick={() => setLocale('en')}
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: '10px',
                border: locale === 'en' ? '1px solid #2563EB' : '1px solid #CBD5E1',
                background: locale === 'en' ? 'rgba(37, 99, 235, 0.08)' : '#FFFFFF',
                color: '#0F172A',
                fontSize: '12px',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              English
            </button>
          </div>
          
          <Link
            href="/profile"
            onClick={() => setIsOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              textDecoration: 'none',
              marginBottom: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F8FAFC';
              e.currentTarget.style.borderColor = '#CBD5E1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#FFFFFF';
              e.currentTarget.style.borderColor = '#E2E8F0';
            }}
          >
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '18px',
              fontWeight: '700'
            }}>
              <HiOutlineUser size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#1E293B',
                marginBottom: '2px'
              }}>
                {t('profile')}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#64748B'
              }}>
                {userRole === 'ADMIN' ? 'Admin' : 'User'}
              </div>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              color: '#DC2626',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
              e.currentTarget.style.borderColor = '#EF4444';
              e.currentTarget.style.color = '#B91C1C';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
              e.currentTarget.style.color = '#DC2626';
            }}
          >
            <HiOutlineLogout size={18} />
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
