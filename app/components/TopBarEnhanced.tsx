'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/useI18n';
import { useSidebar } from '@/contexts/SidebarContext';
import styles from './TopBar.enhanced.module.css';
import {
  HiOutlineBell,
  HiOutlineClipboardCheck,
  HiOutlineSearch,
  HiOutlineUser,
  HiOutlineLogout,
  HiOutlineCog,
  HiOutlineChevronDown,
  HiOutlineMenu,
  HiOutlineHome,
  HiOutlineChevronRight,
  HiOutlineX
} from 'react-icons/hi';

interface QuickSearchItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  category: string;
}

export default function TopBarEnhanced() {
  const pathname = usePathname();
  const { t } = useI18n();
  const { toggle } = useSidebar();

  const [unread, setUnread] = useState(0);
  const [pending, setPending] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const res = await fetch('/api/sidebar/counts');
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        setUnread(Number(data.unreadNotifications || 0));
        setPending(Number(data.pendingApprovals || 0));
      } catch {
        // ignore
      }
    };

    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUserRole(data.user?.role || data.role || '');
        }
      } catch {
        // ignore
      }
    };

    load();
    fetchUser();
    const interval = setInterval(load, 60000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
        setShowUserMenu(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Quick search items
  const allItems: QuickSearchItem[] = [
    { title: t('home'), path: '/dashboard', icon: <HiOutlineHome size={18} />, category: t('mainMenu') },
    { title: t('tasks'), path: '/tasks', icon: <HiOutlineClipboardCheck size={18} />, category: t('mainMenu') },
    { title: t('attendance'), path: '/attendance', icon: <HiOutlineBell size={18} />, category: t('mainMenu') },
    { title: t('employees'), path: '/hr/employees', icon: <HiOutlineUser size={18} />, category: t('hr') },
    { title: t('hrRequests'), path: '/hr/requests', icon: <HiOutlineClipboardCheck size={18} />, category: t('hr') },
    { title: t('procurementRequests'), path: '/procurement/requests', icon: <HiOutlineClipboardCheck size={18} />, category: t('procurement') },
    { title: t('maintenanceRequests'), path: '/maintenance/requests', icon: <HiOutlineClipboardCheck size={18} />, category: t('maintenance') },
    { title: t('settings'), path: '/settings', icon: <HiOutlineCog size={18} />, category: t('settings') },
  ];

  const filteredItems = searchQuery
    ? allItems.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allItems.slice(0, 6);

  // Breadcrumbs
  const getBreadcrumbs = () => {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length === 0) return [{ label: t('home'), path: '/dashboard' }];
    
    const breadcrumbs = [{ label: t('home'), path: '/dashboard' }];
    
    if (parts[0] === 'dashboard') return breadcrumbs;
    if (parts[0] === 'hr') breadcrumbs.push({ label: t('hr'), path: '/hr' });
    if (parts[0] === 'tasks') breadcrumbs.push({ label: t('tasks'), path: '/tasks' });
    if (parts[0] === 'procurement') breadcrumbs.push({ label: t('procurement'), path: '/procurement' });
    if (parts[0] === 'maintenance') breadcrumbs.push({ label: t('maintenance'), path: '/maintenance' });
    if (parts[0] === 'settings') breadcrumbs.push({ label: t('settings'), path: '/settings' });
    
    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  const handleLogout = async () => {
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
      {/* TopBar */}
      <header className={`${styles.topBar} ${scrolled ? styles.topBarScrolled : ''}`}>
        {/* Left Section */}
        <div className={styles.leftSection}>
          {/* Mobile Menu Toggle */}
          <button 
            className={styles.menuToggle} 
            onClick={toggle}
            aria-label="Toggle menu"
          >
            <HiOutlineMenu size={24} />
          </button>

          {/* Breadcrumbs */}
          <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.path} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {index > 0 && (
                  <span className={styles.breadcrumbSeparator}>
                    <HiOutlineChevronRight size={14} />
                  </span>
                )}
                {index === breadcrumbs.length - 1 ? (
                  <span className={styles.breadcrumbCurrent}>{crumb.label}</span>
                ) : (
                  <Link href={crumb.path} className={styles.breadcrumbItem}>
                    {crumb.label}
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* Quick Search Button */}
          <button
            className={styles.searchButton}
            onClick={() => setShowSearch(true)}
            aria-label="Quick search"
          >
            <HiOutlineSearch size={20} className={styles.searchButtonIcon} />
            <span className={styles.searchButtonText}>{t('search')}</span>
            <kbd className={styles.searchButtonKbd}>
              <span>⌘</span>
              <span>K</span>
            </kbd>
          </button>
        </div>

        {/* Right Section */}
        <div className={styles.rightSection}>
          {/* Approvals */}
          <Link href="/workflows/approvals" className={styles.iconButton} aria-label="Pending approvals">
            <HiOutlineClipboardCheck size={20} />
            {pending > 0 && (
              <span className={styles.badge}>
                {pending > 99 ? '99+' : pending}
              </span>
            )}
          </Link>

          {/* Notifications */}
          <Link href="/notifications" className={styles.iconButton} aria-label="Notifications">
            <HiOutlineBell size={20} />
            {unread > 0 && (
              <span className={`${styles.badge} ${styles.badgeBlue}`}>
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </Link>

          {/* User Profile */}
          <div style={{ position: 'relative' }}>
            <button
              className={styles.userButton}
              onClick={() => setShowUserMenu(!showUserMenu)}
              aria-label="User menu"
            >
              <div className={styles.userAvatar}>
                <HiOutlineUser size={18} />
              </div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{t('profile')}</span>
                <span className={styles.userRole}>
                  {userRole === 'ADMIN' ? 'Admin' : 'User'}
                </span>
              </div>
              <HiOutlineChevronDown size={16} className={styles.userChevron} />
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div className={styles.userDropdown}>
                <Link href="/profile" className={styles.dropdownItem} onClick={() => setShowUserMenu(false)}>
                  <HiOutlineUser size={18} />
                  <span>{t('profile')}</span>
                </Link>
                <Link href="/settings" className={styles.dropdownItem} onClick={() => setShowUserMenu(false)}>
                  <HiOutlineCog size={18} />
                  <span>{t('settings')}</span>
                </Link>
                <div className={styles.dropdownDivider} />
                <button
                  className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                  onClick={() => {
                    setShowUserMenu(false);
                    if (confirm(t('confirmLogout'))) {
                      handleLogout();
                    }
                  }}
                >
                  <HiOutlineLogout size={18} />
                  <span>{t('logout')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Quick Search Modal */}
      {showSearch && (
        <div className={styles.searchModal}>
          <div className={styles.searchOverlay} onClick={() => setShowSearch(false)} />
          <div className={styles.searchContent}>
            <div className={styles.searchInputWrapper}>
              <HiOutlineSearch size={24} style={{ color: '#94A3B8' }} />
              <input
                type="text"
                className={styles.searchModalInput}
                placeholder={`${t('search')}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <button
                onClick={() => setShowSearch(false)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: '#94A3B8',
                  padding: '4px'
                }}
              >
                <HiOutlineX size={20} />
              </button>
            </div>
            <div className={styles.searchResults}>
              {filteredItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={styles.searchResultItem}
                  onClick={() => {
                    setShowSearch(false);
                    setSearchQuery('');
                  }}
                >
                  <div className={styles.searchResultIcon}>{item.icon}</div>
                  <div className={styles.searchResultText}>
                    <div className={styles.searchResultTitle}>{item.title}</div>
                    <div className={styles.searchResultPath}>{item.category}</div>
                  </div>
                </Link>
              ))}
              {filteredItems.length === 0 && (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94A3B8' }}>
                  لا توجد نتائج
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
