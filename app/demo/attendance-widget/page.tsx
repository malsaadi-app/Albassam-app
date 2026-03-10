'use client';

import { useState } from 'react';
import { CardEnhanced, CardHeader, CardBody } from '@/components/ui/CardEnhanced';
import { ResponsiveContainer } from '@/components/layout/ResponsiveContainer';
import { HiOutlineClock, HiOutlineLocationMarker, HiOutlineCalendar } from 'react-icons/hi';

export default function AttendanceWidgetDemo() {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [selectedDemo, setSelectedDemo] = useState<'fab' | 'sidebar' | 'topbar'>('fab');

  const handleCheckIn = () => {
    setIsCheckedIn(true);
    setLastAction(`تسجيل دخول: ${new Date().toLocaleTimeString('ar-SA')}`);
  };

  const handleCheckOut = () => {
    setIsCheckedIn(false);
    setLastAction(`تسجيل خروج: ${new Date().toLocaleTimeString('ar-SA')}`);
  };

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <ResponsiveContainer size="xl">
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>
            🎨 Demo: Attendance Widget
          </h1>
          <p style={{ color: '#64748b', fontSize: '16px' }}>
            اختر التصميم وشوف شكله في الموبايل والديسكتوب
          </p>
        </div>

        {/* Toggle Demos */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          marginBottom: '32px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setSelectedDemo('fab')}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              background: selectedDemo === 'fab' 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                : '#E5E7EB',
              color: selectedDemo === 'fab' ? 'white' : '#374151',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
          >
            💫 FAB (Floating)
          </button>
          <button
            onClick={() => setSelectedDemo('sidebar')}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              background: selectedDemo === 'sidebar' 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                : '#E5E7EB',
              color: selectedDemo === 'sidebar' ? 'white' : '#374151',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
          >
            📌 Sidebar Widget
          </button>
          <button
            onClick={() => setSelectedDemo('topbar')}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              background: selectedDemo === 'topbar' 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                : '#E5E7EB',
              color: selectedDemo === 'topbar' ? 'white' : '#374151',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
          >
            🔝 TopBar Badge
          </button>
        </div>

        {/* Status Display */}
        <CardEnhanced variant="stats" style={{ marginBottom: '32px' }}>
          <CardBody>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: isCheckedIn ? '#10B981' : '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}>
                {isCheckedIn ? '✅' : '❌'}
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                  الحالة: {isCheckedIn ? 'مسجل دخول' : 'غير مسجل'}
                </h3>
                <p style={{ fontSize: '14px', color: '#64748b' }}>
                  {lastAction || 'لم يتم التسجيل بعد'}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', fontSize: '13px', color: '#64748b' }}>
              <span><HiOutlineCalendar style={{ display: 'inline', marginLeft: '4px' }} />11 مارس 2026</span>
              <span><HiOutlineClock style={{ display: 'inline', marginLeft: '4px' }} />12:51 ص</span>
              <span><HiOutlineLocationMarker style={{ display: 'inline', marginLeft: '4px' }} />الرياض</span>
            </div>
          </CardBody>
        </CardEnhanced>

        {/* Demo Previews */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {/* Mobile Preview */}
          <CardEnhanced variant="outlined">
            <CardHeader title="📱 Mobile View" subtitle="iPhone 14 Pro" />
            <CardBody>
              <div style={{
                width: '100%',
                height: '600px',
                background: '#F9FAFB',
                borderRadius: '32px',
                border: '8px solid #1e293b',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
              }}>
                {/* Mock Content */}
                <div style={{ padding: '60px 16px 16px', height: '100%', overflow: 'auto' }}>
                  <div style={{ background: 'white', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>لوحة التحكم</h3>
                    <p style={{ fontSize: '14px', color: '#64748b' }}>محتوى الصفحة...</p>
                  </div>
                  <div style={{ background: 'white', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                    <div style={{ height: '100px', background: '#E5E7EB', borderRadius: '8px' }}></div>
                  </div>
                  <div style={{ background: 'white', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ height: '100px', background: '#E5E7EB', borderRadius: '8px' }}></div>
                  </div>
                </div>

                {/* FAB Demo */}
                {selectedDemo === 'fab' && (
                  <button
                    onClick={isCheckedIn ? handleCheckOut : handleCheckIn}
                    style={{
                      position: 'absolute',
                      bottom: '24px',
                      right: '24px',
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: isCheckedIn 
                        ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' 
                        : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      color: 'white',
                      fontSize: '28px',
                      border: 'none',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)';
                      e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
                    }}
                  >
                    {isCheckedIn ? '🔴' : '🟢'}
                  </button>
                )}

                {/* TopBar Demo */}
                {selectedDemo === 'topbar' && (
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    left: '16px',
                    right: '16px',
                    background: 'white',
                    borderRadius: '12px',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>⏰ الحضور</span>
                    <button
                      onClick={isCheckedIn ? handleCheckOut : handleCheckIn}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        background: isCheckedIn ? '#EF4444' : '#10B981',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      {isCheckedIn ? '🔴 خروج' : '🟢 دخول'}
                    </button>
                  </div>
                )}

                {/* Sidebar Demo */}
                {selectedDemo === 'sidebar' && (
                  <div style={{
                    position: 'absolute',
                    bottom: '60px',
                    left: '16px',
                    right: '16px',
                    background: 'white',
                    borderRadius: '16px',
                    padding: '16px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
                  }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: '#1e293b' }}>
                      ⏰ تسجيل سريع
                    </h4>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={handleCheckIn}
                        disabled={isCheckedIn}
                        style={{
                          flex: 1,
                          padding: '12px',
                          borderRadius: '10px',
                          border: 'none',
                          background: isCheckedIn ? '#E5E7EB' : '#10B981',
                          color: isCheckedIn ? '#9CA3AF' : 'white',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: isCheckedIn ? 'not-allowed' : 'pointer'
                        }}
                      >
                        🟢 دخول
                      </button>
                      <button
                        onClick={handleCheckOut}
                        disabled={!isCheckedIn}
                        style={{
                          flex: 1,
                          padding: '12px',
                          borderRadius: '10px',
                          border: 'none',
                          background: !isCheckedIn ? '#E5E7EB' : '#EF4444',
                          color: !isCheckedIn ? '#9CA3AF' : 'white',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: !isCheckedIn ? 'not-allowed' : 'pointer'
                        }}
                      >
                        🔴 خروج
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </CardBody>
          </CardEnhanced>

          {/* Desktop Preview */}
          <CardEnhanced variant="outlined">
            <CardHeader title="💻 Desktop View" subtitle="1920x1080" />
            <CardBody>
              <div style={{
                width: '100%',
                height: '600px',
                background: '#F9FAFB',
                borderRadius: '12px',
                border: '2px solid #E5E7EB',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Sidebar */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '240px',
                  height: '100%',
                  background: 'white',
                  borderLeft: '1px solid #E5E7EB',
                  padding: '16px'
                }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>القائمة</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                    <div style={{ padding: '10px', background: '#F3F4F6', borderRadius: '8px', fontSize: '14px' }}>
                      📊 لوحة التحكم
                    </div>
                    <div style={{ padding: '10px', borderRadius: '8px', fontSize: '14px' }}>
                      📝 المهام
                    </div>
                    <div style={{ padding: '10px', borderRadius: '8px', fontSize: '14px' }}>
                      👥 الموظفين
                    </div>
                  </div>

                  {/* Widget in Sidebar */}
                  {selectedDemo === 'sidebar' && (
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)',
                      border: '1px solid rgba(102, 126, 234, 0.2)',
                      borderRadius: '12px',
                      padding: '16px'
                    }}>
                      <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '12px', color: '#1e293b' }}>
                        ⏰ تسجيل سريع
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button
                          onClick={handleCheckIn}
                          disabled={isCheckedIn}
                          style={{
                            padding: '10px',
                            borderRadius: '8px',
                            border: 'none',
                            background: isCheckedIn ? '#E5E7EB' : '#10B981',
                            color: isCheckedIn ? '#9CA3AF' : 'white',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: isCheckedIn ? 'not-allowed' : 'pointer'
                          }}
                        >
                          🟢 تسجيل دخول
                        </button>
                        <button
                          onClick={handleCheckOut}
                          disabled={!isCheckedIn}
                          style={{
                            padding: '10px',
                            borderRadius: '8px',
                            border: 'none',
                            background: !isCheckedIn ? '#E5E7EB' : '#EF4444',
                            color: !isCheckedIn ? '#9CA3AF' : 'white',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: !isCheckedIn ? 'not-allowed' : 'pointer'
                          }}
                        >
                          🔴 تسجيل خروج
                        </button>
                      </div>
                      <a href="#" style={{ 
                        display: 'block', 
                        marginTop: '10px', 
                        fontSize: '11px', 
                        color: '#667eea', 
                        textDecoration: 'none',
                        textAlign: 'center'
                      }}>
                        📊 لوحة الحضور
                      </a>
                    </div>
                  )}
                </div>

                {/* Main Content */}
                <div style={{ padding: '24px', paddingRight: '264px' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '16px' }}>لوحة التحكم</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <div style={{ background: 'white', borderRadius: '12px', padding: '20px', height: '120px' }}>
                      <div style={{ height: '100%', background: '#E5E7EB', borderRadius: '8px' }}></div>
                    </div>
                    <div style={{ background: 'white', borderRadius: '12px', padding: '20px', height: '120px' }}>
                      <div style={{ height: '100%', background: '#E5E7EB', borderRadius: '8px' }}></div>
                    </div>
                  </div>
                </div>

                {/* TopBar Demo */}
                {selectedDemo === 'topbar' && (
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    left: '16px',
                    background: 'white',
                    borderRadius: '12px',
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    <span style={{ fontSize: '13px', fontWeight: '600' }}>⏰ الحضور</span>
                    <button
                      onClick={isCheckedIn ? handleCheckOut : handleCheckIn}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        background: isCheckedIn ? '#EF4444' : '#10B981',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      {isCheckedIn ? '🔴 خروج' : '🟢 دخول'}
                    </button>
                  </div>
                )}

                {/* FAB Demo */}
                {selectedDemo === 'fab' && (
                  <button
                    onClick={isCheckedIn ? handleCheckOut : handleCheckIn}
                    style={{
                      position: 'absolute',
                      bottom: '24px',
                      left: '24px',
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      background: isCheckedIn 
                        ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' 
                        : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      color: 'white',
                      fontSize: '24px',
                      border: 'none',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    {isCheckedIn ? '🔴' : '🟢'}
                  </button>
                )}
              </div>
            </CardBody>
          </CardEnhanced>
        </div>

        {/* Comparison */}
        <CardEnhanced variant="gradient" style={{ marginTop: '32px' }}>
          <CardHeader 
            title="📊 المقارنة" 
            subtitle="مميزات وعيوب كل تصميم"
          />
          <CardBody>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {/* FAB */}
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: '#1e293b' }}>
                  💫 FAB (Floating Action Button)
                </h4>
                <div style={{ fontSize: '14px', color: '#475569' }}>
                  <p style={{ marginBottom: '8px' }}><strong>✅ المميزات:</strong></p>
                  <ul style={{ marginBottom: '12px', paddingRight: '20px' }}>
                    <li>دائم ظاهر في كل الصفحات</li>
                    <li>ما يحتاج فتح sidebar</li>
                    <li>سهل الوصول للموبايل</li>
                    <li>مودرن وعصري</li>
                  </ul>
                  <p style={{ marginBottom: '8px' }}><strong>❌ العيوب:</strong></p>
                  <ul style={{ paddingRight: '20px' }}>
                    <li>ياخذ مساحة من الشاشة</li>
                    <li>قد يعيق المحتوى أحياناً</li>
                  </ul>
                </div>
              </div>

              {/* Sidebar */}
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: '#1e293b' }}>
                  📌 Sidebar Widget
                </h4>
                <div style={{ fontSize: '14px', color: '#475569' }}>
                  <p style={{ marginBottom: '8px' }}><strong>✅ المميزات:</strong></p>
                  <ul style={{ marginBottom: '12px', paddingRight: '20px' }}>
                    <li>منظم مع القائمة</li>
                    <li>ما ياخذ مساحة من المحتوى</li>
                    <li>يدعم معلومات إضافية</li>
                  </ul>
                  <p style={{ marginBottom: '8px' }}><strong>❌ العيوب:</strong></p>
                  <ul style={{ paddingRight: '20px' }}>
                    <li>في الموبايل: يحتاج فتح sidebar</li>
                    <li>أبطأ في الوصول</li>
                  </ul>
                </div>
              </div>

              {/* TopBar */}
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: '#1e293b' }}>
                  🔝 TopBar Badge
                </h4>
                <div style={{ fontSize: '14px', color: '#475569' }}>
                  <p style={{ marginBottom: '8px' }}><strong>✅ المميزات:</strong></p>
                  <ul style={{ marginBottom: '12px', paddingRight: '20px' }}>
                    <li>دائم ظاهر في الأعلى</li>
                    <li>ما ياخذ مساحة من المحتوى</li>
                    <li>سريع ومباشر</li>
                  </ul>
                  <p style={{ marginBottom: '8px' }}><strong>❌ العيوب:</strong></p>
                  <ul style={{ paddingRight: '20px' }}>
                    <li>مساحة محدودة للمعلومات</li>
                    <li>قد يضيع بين الأيقونات</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardBody>
        </CardEnhanced>

        {/* Recommendation */}
        <CardEnhanced variant="success" style={{ marginTop: '24px' }}>
          <CardBody>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px', color: '#065f46' }}>
              ⭐ توصيتي النهائية
            </h3>
            <p style={{ fontSize: '16px', color: '#047857', lineHeight: '1.8' }}>
              أفضل حل: <strong>FAB للموبايل</strong> (دائم ظاهر، سهل الوصول) + <strong>Sidebar Widget للديسكتوب</strong> (منظم ويدعم معلومات أكثر)
            </p>
            <p style={{ fontSize: '14px', color: '#047857', marginTop: '12px' }}>
              💡 نقدر نطبق responsive: إذا الشاشة صغيرة (موبايل) → FAB | إذا الشاشة كبيرة (ديسكتوب) → Sidebar Widget
            </p>
          </CardBody>
        </CardEnhanced>
      </ResponsiveContainer>
    </div>
  );
}
