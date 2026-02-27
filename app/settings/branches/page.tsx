'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsBranchesPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the correct branches page
    router.replace('/branches');
  }, [router]);

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#F9FAFB' 
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
        <p style={{ fontSize: '16px', color: '#6B7280' }}>جاري التحويل...</p>
      </div>
    </div>
  );
}
