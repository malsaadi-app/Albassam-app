'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/useI18n';
import { AttendanceQuickWidget } from '@/components/AttendanceQuickWidget';
import styles from './Sidebar.enhanced.module.css';
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
  HiOutlineLocationMarker,
  HiOutlineDotsHorizontal
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

import { useSidebar } from '@/contexts/SidebarContext';

export default function SidebarEnhanced() {
  const pathname = usePathname();
  const { t, locale, setLocale, dir } = useI18n();
  const { isOpen, close } = useSidebar();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['main']));
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
      id: 'support_services',
      icon: <HiOutlineTruck size={18} />,
      label: 'الخدمات المساندة',
      items: [
        { href: '/support-services/transport/drivers', icon: <HiOutlineTruck size={18} />, label: 'النقل — السائقين' },
        { href: '/support-services/transport/vehicles', icon: <HiOutlineTruck size={18} />, label: 'النقل — المركبات' },
        ...(userRole === 'ADMIN'
          ? [
              { href: '/inventory', icon: <HiOutlineCube size={18} />, label: 'المخازن' },
              { href: '/settings/inventory', icon: <HiOutlineCog size={18} />, label: 'إعدادات المخزون' },
            ]
          : []),
      ]
    },
    {
      id: 'finance',
      icon: <HiOutlineCurrencyDollar size={18} />,
      label: t('finance'),
      items: [
        { href: '/hr/payroll', icon: <HiOutlineCurrencyDollar size={18} />, label: 'الرواتب' },
        { href: '/finance/requests', icon: <HiOutlineClipboardCheck size={18} />, label: t('financeRequests') },
      ]
    },
    {
      id: 'reports',
      icon: <HiOutlineChartBar size={18} />,
      label: t('reports'),
      items: [
        { href: '/analytics', icon: <HiOutlineChartBar size={18} />, label: 'لوحة التحليلات' },
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
        { href: '/settings/school-structure', icon: <HiOutlineOfficeBuilding size={18} />, label: 'هيكل المدارس' },
        { href: '/settings/locations', icon: <HiOutlineLocationMarker size={18} />, label: t('locations') },
        { href: '/settings/roles', icon: <HiOutlineShieldCheck size={18} />, label: t('rolesAndPermissions') },
        { href: '/settings/org-structure', icon: <HiOutlineUserGroup size={18} />, label: 'الهيكل التنظيمي' },
        { href: '/settings/hr-routing-rules', icon: <HiOutlineDotsHorizontal size={18} />, label: 'HR Routing (بنين)' },
        { href: '/settings/workflow-builder', icon: <HiOutlineDotsHorizontal size={18} />, label: 'Workflow Builder' },
        { href: '/settings/delegations', icon: <HiOutlineUserGroup size={18} />, label: t('delegations') },
        { href: '/hr/succession', icon: <HiOutlineUserGroup size={18} />, label: t('succession') },
        { href: '/hr/positions', icon: <HiOutlineBriefcase size={18} />, label: t('positions') },
        { href: '/settings', icon: <HiOutlineCog size={18} />, label: t('systemSettings') },
        ...(userRole === 'ADMIN' ? [
          { href: '/admin/users', icon: <HiOutlineUserGroup size={18} />, label: 'إدارة المستخدمين' },
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
        {
          id: 'profile',
          icon: <HiOutlineUser size={18} />,
          label: 'الخدمة الذاتية',
          items: [
            { href: '/profile/payslips', icon: <HiOutlineCurrencyDollar size={18} />, label: 'كشوف الرواتب' },
            { href: '/profile/leave-balance', icon: <HiOutlineDocumentText size={18} />, label: 'رصيد الإجازات' },
            { href: '/profile/attendance-history', icon: <HiOutlineClock size={18} />, label: 'سجل الحضور' },
          ]
        },
      ];
    }

    return fullMenuSections;
  })();

  const filteredSections = searchQuery
    ? menuSections.map(section => ({
        ...section,
        items: section.items.filter(item =>
          item.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(section => section.items.length > 0)
    : menuSections;

  const handleLogout = async () => {
    if (!confirm(t('confirmLogout'))) return;
    
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        window.location.href = '/auth/login';
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className={styles.mobileOverlay}
          onClick={() => close()}
        />
      )}

      {/* Sidebar */}
      <aside 
        dir={dir}
        className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}
      >
        {/* Close Button (Mobile) */}
        <button
          className={styles.closeButton}
          onClick={() => close()}
          aria-label="Close sidebar"
        >
          <HiOutlineX size={20} />
        </button>

        {/* Impersonation Banner */}
        {isImpersonating && (
          <div className={styles.impersonationBanner}>
            ⚠️ وضع المحاكاة نشط
          </div>
        )}

        {/* Header */}
        <div className={styles.sidebarHeader}>
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <div className={styles.sidebarTitle}>
              🏫 Albassam Platform
            </div>
            <div className={styles.sidebarSubtitle}>
              {t('tasks')}
            </div>
          </Link>
        </div>

        {/* Search */}
        <div className={styles.searchContainer}>
          <div className={styles.searchWrapper}>
            <HiOutlineSearch size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder={t('search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* Menu Navigation */}
        <nav className={styles.menuNav}>
          {filteredSections.map(section => (
            <div key={section.id} className={styles.section}>
              <button
                onClick={() => toggleSection(section.id)}
                className={styles.sectionButton}
              >
                <div className={styles.sectionIcon}>
                  <span className={styles.sectionIconSvg}>{section.icon}</span>
                  <span>{section.label}</span>
                </div>
                <HiOutlineChevronDown
                  size={16}
                  className={`${styles.sectionChevron} ${
                    expandedSections.has(section.id) ? styles.sectionChevronExpanded : ''
                  }`}
                />
              </button>

              {expandedSections.has(section.id) && (
                <div className={styles.menuItems}>
                  {section.items.map(item => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => close()}
                      className={`${styles.menuItem} ${
                        pathname === item.href ? styles.menuItemActive : ''
                      }`}
                    >
                      <div className={styles.menuItemContent}>
                        <span className={styles.menuItemIcon}>{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      {item.badge && item.badge > 0 && (
                        <span className={styles.badge}>
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

        {/* Spacer - Push footer to bottom */}
        <div style={{ flex: 1 }} />

        {/* Attendance Quick Widget */}
        <div style={{ 
          padding: '16px', 
          borderTop: '1px solid rgba(226, 232, 240, 0.6)',
          background: 'linear-gradient(180deg, rgba(249, 250, 251, 0) 0%, rgba(249, 250, 251, 0.5) 100%)'
        }}>
          <AttendanceQuickWidget />
        </div>

        {/* Footer */}
        <div className={styles.sidebarFooter}>
          <div className={styles.footerContent}>
            {/* Language Switcher */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <button
                type="button"
                onClick={() => setLocale('ar')}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: '10px',
                  border: locale === 'ar' ? '1px solid #3B82F6' : '1px solid #CBD5E1',
                  background: locale === 'ar' ? 'rgba(59, 130, 246, 0.1)' : '#FFFFFF',
                  color: '#0F172A',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
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
                  border: locale === 'en' ? '1px solid #3B82F6' : '1px solid #CBD5E1',
                  background: locale === 'en' ? 'rgba(59, 130, 246, 0.1)' : '#FFFFFF',
                  color: '#0F172A',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                English
              </button>
            </div>

            {/* User Info */}
            <Link
              href="/profile"
              onClick={() => close()}
              className={styles.userInfo}
            >
              <div className={styles.userAvatar}>
                <HiOutlineUser size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div className={styles.userName}>
                  {t('profile')}
                </div>
                <div className={styles.userRole}>
                  {userRole === 'ADMIN' ? 'Admin' : 'User'}
                </div>
              </div>
            </Link>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className={styles.logoutButton}
            >
              <HiOutlineLogout size={18} />
              <span>{t('logout')}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
