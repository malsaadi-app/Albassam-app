'use client';
import { PageHeader } from '@/components/ui/PageHeader';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { HiOutlineLocationMarker, HiOutlineSave } from 'react-icons/hi';

// تحميل الخريطة ديناميكياً (لتجنب مشاكل SSR)
const GoogleMap = dynamic(() => import('@/app/components/GoogleMap'), {
  ssr: false,
  loading: () => (
    <div style={{ 
      width: '100%', 
      height: '400px', 
      background: '#F3F4F6',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#6B7280'
    }}>
      جاري تحميل الخريطة...
    </div>
  )
});

interface Branch {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  geofenceRadius: number;
}

export default function LocationsPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState(100);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const res = await fetch('/api/branches');
      if (res.ok) {
        const data = await res.json();
        setBranches(Array.isArray(data) ? data : []);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching branches:', error);
      setLoading(false);
    }
  };

  const handleBranchSelect = (branch: Branch) => {
    setSelectedBranch(branch);
    if (branch.latitude && branch.longitude) {
      setLocation({ lat: branch.latitude, lng: branch.longitude });
      setRadius(branch.geofenceRadius);
    } else {
      setLocation(null);
      setRadius(100);
    }
  };

  const handleLocationSelect = (loc: { lat: number; lng: number }) => {
    setLocation(loc);
  };

  const handleSave = async () => {
    if (!selectedBranch || !location) {
      alert('اختر فرع وحدد الموقع على الخريطة');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/branches/${selectedBranch.id}/location`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: location.lat,
          longitude: location.lng,
          geofenceRadius: radius
        })
      });

      if (res.ok) {
        alert('تم حفظ الموقع بنجاح! ✅');
        fetchBranches();
      } else {
        alert('حدث خطأ أثناء الحفظ');
      }
    } catch (error) {
      console.error('Error saving location:', error);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <PageHeader
          title="إدارة مواقع الفروع"
          breadcrumbs={['الإعدادات', 'المواقع']}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '24px', marginTop: '24px' }}>
          {/* القائمة الجانبية */}
          <div>
            {/* قائمة الفروع */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #E5E7EB',
              marginBottom: '20px'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '16px' }}>
                <HiOutlineLocationMarker size={20} style={{ display: 'inline', marginLeft: '8px' }} />
                اختر الفرع
              </h3>

              {loading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#6B7280' }}>
                  جاري التحميل...
                </div>
              ) : branches.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#6B7280' }}>
                  لا توجد فروع
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {branches.map(branch => (
                    <button
                      key={branch.id}
                      onClick={() => handleBranchSelect(branch)}
                      style={{
                        padding: '12px 16px',
                        background: selectedBranch?.id === branch.id ? '#EFF6FF' : 'white',
                        border: selectedBranch?.id === branch.id ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                        borderRadius: '8px',
                        textAlign: 'right',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedBranch?.id !== branch.id) {
                          e.currentTarget.style.background = '#F9FAFB';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedBranch?.id !== branch.id) {
                          e.currentTarget.style.background = 'white';
                        }
                      }}
                    >
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                        {branch.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>
                        {branch.latitude && branch.longitude 
                          ? `✅ تم تحديد الموقع (${branch.geofenceRadius}م)`
                          : '❌ لم يتم تحديد الموقع'
                        }
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* إعدادات النطاق */}
            {selectedBranch && (
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #E5E7EB'
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '16px' }}>
                  نطاق الحضور
                </h3>

                <label style={{ display: 'block', fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>
                  نصف القطر (متر)
                </label>
                <input
                  type="number"
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  min="50"
                  max="1000"
                  step="10"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    marginBottom: '12px'
                  }}
                />

                <button
                  onClick={handleSave}
                  disabled={!location || saving}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: location ? '#3B82F6' : '#E5E7EB',
                    color: location ? 'white' : '#9CA3AF',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: location ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <HiOutlineSave size={18} />
                  {saving ? 'جاري الحفظ...' : 'حفظ الموقع'}
                </button>

                <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '12px', lineHeight: '1.5' }}>
                  💡 اضغط على الخريطة لتحديد موقع الفرع. سيتمكن الموظفون من تسجيل الحضور فقط داخل النطاق المحدد.
                </p>
              </div>
            )}
          </div>

          {/* الخريطة */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #E5E7EB',
            minHeight: '600px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '16px' }}>
              {selectedBranch ? `تحديد موقع: ${selectedBranch.name}` : 'اختر فرع لتحديد موقعه'}
            </h3>

            {selectedBranch ? (
              <GoogleMap
                center={location || { lat: 26.4207, lng: 50.0888 }}
                zoom={15}
                onLocationSelect={handleLocationSelect}
                editable={true}
              />
            ) : (
              <div style={{
                height: '500px',
                background: '#F3F4F6',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6B7280'
              }}>
                <HiOutlineLocationMarker size={64} style={{ marginBottom: '16px', opacity: 0.3 }} />
                <p style={{ fontSize: '16px', fontWeight: '600' }}>اختر فرع من القائمة</p>
                <p style={{ fontSize: '14px', marginTop: '8px' }}>لتحديد موقعه على الخريطة</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
