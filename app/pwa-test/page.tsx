'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { CardEnhanced, CardBody, CardHeader } from '@/components/ui/CardEnhanced';
import { ResponsiveContainer, ResponsiveGrid } from '@/components/layout/ResponsiveContainer';

export default function PWATestPage() {
  const [swStatus, setSwStatus] = useState<string>('Checking...');
  const [isOnline, setIsOnline] = useState(true);
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [manifestData, setManifestData] = useState<any>(null);

  useEffect(() => {
    // Check Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) {
          setSwStatus(`✅ Active (Scope: ${reg.scope})`);
        } else {
          setSwStatus('❌ Not registered');
        }
      });
    } else {
      setSwStatus('❌ Not supported');
    }

    // Check if installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsInstalled(isStandalone);

    // Check online status
    setIsOnline(navigator.onLine);

    // Listen to beforeinstallprompt
    window.addEventListener('beforeinstallprompt', () => {
      setCanInstall(true);
    });

    // Load manifest
    fetch('/manifest.webmanifest')
      .then(res => res.json())
      .then(data => setManifestData(data))
      .catch(err => console.error('Failed to load manifest:', err));

    // Network status listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const testCache = async () => {
    try {
      const cache = await caches.open('test-cache');
      await cache.add('/');
      alert('✅ Cache API works!');
    } catch (err) {
      alert('❌ Cache API failed: ' + err);
    }
  };

  const testNotification = async () => {
    if (!('Notification' in window)) {
      alert('❌ Notifications not supported');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      new Notification('🎉 PWA Test', {
        body: 'Notifications are working!',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png'
      });
    } else {
      alert('⚠️ Notification permission denied');
    }
  };

  const clearCaches = async () => {
    const names = await caches.keys();
    await Promise.all(names.map(name => caches.delete(name)));
    alert(`✅ Cleared ${names.length} cache(s)`);
    window.location.reload();
  };

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <ResponsiveContainer size="xl">
        <PageHeader
          title="🧪 PWA Testing Dashboard"
          breadcrumbs={['Home', 'PWA Test']}
        />

        {/* Status Cards */}
        <ResponsiveGrid columns={{ mobile: 1, tablet: 2, desktop: 4 }} gap="lg" style={{ marginBottom: '24px' }}>
          <CardEnhanced variant={swStatus.includes('✅') ? 'success' : 'danger'}>
            <CardBody compact>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>⚙️</div>
                <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>Service Worker</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>
                  {swStatus}
                </div>
              </div>
            </CardBody>
          </CardEnhanced>

          <CardEnhanced variant={isOnline ? 'success' : 'danger'}>
            <CardBody compact>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>
                  {isOnline ? '🌐' : '📡'}
                </div>
                <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>Network Status</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>
                  {isOnline ? '✅ Online' : '❌ Offline'}
                </div>
              </div>
            </CardBody>
          </CardEnhanced>

          <CardEnhanced variant={isInstalled ? 'success' : 'warning'}>
            <CardBody compact>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>📱</div>
                <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>Install Status</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>
                  {isInstalled ? '✅ Installed' : '⚠️ Browser Mode'}
                </div>
              </div>
            </CardBody>
          </CardEnhanced>

          <CardEnhanced variant={canInstall ? 'success' : 'outlined'}>
            <CardBody compact>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>⬇️</div>
                <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>Can Install</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>
                  {canInstall ? '✅ Yes' : '⚠️ No Prompt'}
                </div>
              </div>
            </CardBody>
          </CardEnhanced>
        </ResponsiveGrid>

        {/* Manifest Info */}
        {manifestData && (
          <CardEnhanced variant="outlined" style={{ marginBottom: '24px' }}>
            <CardHeader title="📄 Manifest Info" />
            <CardBody>
              <div style={{ display: 'grid', gap: '12px', fontSize: '14px' }}>
                <div><strong>Name:</strong> {manifestData.name}</div>
                <div><strong>Short Name:</strong> {manifestData.short_name}</div>
                <div><strong>Display:</strong> {manifestData.display}</div>
                <div><strong>Theme Color:</strong> {manifestData.theme_color}</div>
                <div><strong>Icons:</strong> {manifestData.icons?.length || 0} icons</div>
              </div>
            </CardBody>
          </CardEnhanced>
        )}

        {/* Test Actions */}
        <CardEnhanced variant="elevated">
          <CardHeader title="🧪 Test PWA Features" />
          <CardBody>
            <ResponsiveGrid columns={{ mobile: 1, tablet: 2, desktop: 3 }} gap="md">
              <button
                onClick={testCache}
                style={{
                  padding: '16px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '15px'
                }}
              >
                💾 Test Cache API
              </button>

              <button
                onClick={testNotification}
                style={{
                  padding: '16px',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '15px'
                }}
              >
                🔔 Test Notifications
              </button>

              <button
                onClick={clearCaches}
                style={{
                  padding: '16px',
                  background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '15px'
                }}
              >
                🗑️ Clear All Caches
              </button>

              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '16px',
                  background: 'white',
                  color: '#667eea',
                  border: '2px solid #667eea',
                  borderRadius: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '15px'
                }}
              >
                🔄 Reload App
              </button>

              <button
                onClick={() => window.location.href = '/offline'}
                style={{
                  padding: '16px',
                  background: 'white',
                  color: '#F59E0B',
                  border: '2px solid #F59E0B',
                  borderRadius: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '15px'
                }}
              >
                📡 View Offline Page
              </button>

              <button
                onClick={async () => {
                  const reg = await navigator.serviceWorker.getRegistration();
                  if (reg) {
                    await reg.unregister();
                    alert('✅ Service Worker unregistered');
                    window.location.reload();
                  }
                }}
                style={{
                  padding: '16px',
                  background: 'white',
                  color: '#DC2626',
                  border: '2px solid #DC2626',
                  borderRadius: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '15px'
                }}
              >
                ⚠️ Unregister SW
              </button>
            </ResponsiveGrid>
          </CardBody>
        </CardEnhanced>

        {/* Browser Info */}
        <CardEnhanced variant="outlined" style={{ marginTop: '24px' }}>
          <CardHeader title="🌐 Browser Info" />
          <CardBody>
            <div style={{ display: 'grid', gap: '8px', fontSize: '13px', fontFamily: 'monospace' }}>
              <div><strong>User Agent:</strong> {typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}</div>
              <div><strong>Platform:</strong> {typeof navigator !== 'undefined' ? navigator.platform : 'N/A'}</div>
              <div><strong>Language:</strong> {typeof navigator !== 'undefined' ? navigator.language : 'N/A'}</div>
              <div><strong>Screen:</strong> {typeof screen !== 'undefined' ? `${screen.width} x ${screen.height}` : 'N/A'}</div>
              <div><strong>Viewport:</strong> {typeof window !== 'undefined' ? `${window.innerWidth} x ${window.innerHeight}` : 'N/A'}</div>
            </div>
          </CardBody>
        </CardEnhanced>
      </ResponsiveContainer>
    </div>
  );
}
