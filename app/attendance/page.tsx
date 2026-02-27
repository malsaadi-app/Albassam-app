'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { HiOutlineChartBar } from 'react-icons/hi';
import { useI18n } from '@/lib/useI18n';

interface AttendanceRecord {
  id: string;
  checkIn: string;
  checkOut: string | null;
  workHours: number | null;
  location: string | null;
  date: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
  distanceFromBranch: number | null;
  branch: { id: string; name: string } | null;
  stage: { id: string; name: string } | null;
}

export default function AttendancePage() {
  const { locale, dir, t } = useI18n();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [gpsSupported, setGpsSupported] = useState(false);

  useEffect(() => {
    fetchTodayRecords();
    
    if ('geolocation' in navigator) {
      setGpsSupported(true);
    }
  }, []);

  const fetchTodayRecords = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/attendance?date=${today}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
      }
    } catch (error) {
      console.error('Error fetching today records:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLocation = (): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!gpsSupported) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          resolve(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        },
        (error) => {
          console.log('GPS not available:', error);
          resolve(null);
        },
        { timeout: 5000 }
      );
    });
  };

  const handleCheckIn = async () => {
    setActionLoading(true);
    setMessage('');

    try {
      const location = await getLocation();

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check-in', location })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
        setMessageType('success');
        fetchTodayRecords();
      } else {
        setMessage(data.error);
        setMessageType('error');
      }
    } catch (error) {
      setMessage(t('checkInError'));
      setMessageType('error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check-out' })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
        setMessageType('success');
        fetchTodayRecords();
      } else {
        setMessage(data.error);
        setMessageType('error');
      }
    } catch (error) {
      setMessage(t('checkOutError'));
      setMessageType('error');
    } finally {
      setActionLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(locale === 'ar' ? 'ar-SA' : 'en-US', {
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = () => {
    const date = new Date();
    return date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      weekday: 'short'
    });
  };

  const toWesternNum = (num: number): string => {
    return num.toLocaleString('en-US');
  };

  const hasActiveSession = records.some(r => r.checkOut === null);

  if (loading) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #E5E7EB',
            borderTopColor: '#667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#6B7280', fontSize: '16px' }}>{t('loading')}</p>
        </div>
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div dir={dir} style={{
      minHeight: '100vh',
      background: '#F5F7FA',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>

        {/* Breadcrumb */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '20px',
          fontSize: '14px',
          color: '#6B7280'
        }}>
          <span>{t('attendanceBreadcrumbHome')}</span>
          <span>/</span>
          <span style={{ color: '#111827', fontWeight: '500' }}>{t('attendanceBreadcrumbCurrent')}</span>
        </div>

        {/* Header */}
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: '700', 
            color: '#111827',
            marginBottom: '8px'
          }}>
            {t('attendanceRecordTitle')}
          </h1>
        </div>

        {/* Message */}
        {message && (
          <div style={{
            marginBottom: '20px',
            padding: '14px 18px',
            borderRadius: '12px',
            border: '1px solid',
            fontSize: '14px',
            fontWeight: '500',
            textAlign: 'center',
            ...(messageType === 'success' 
              ? {
                  background: '#D1FAE5',
                  borderColor: '#A7F3D0',
                  color: '#065F46'
                }
              : {
                  background: '#FEE2E2',
                  borderColor: '#FECACA',
                  color: '#991B1B'
                })
          }}>
            {message}
          </div>
        )}

        {/* Main Action Card */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '24px',
          padding: '40px 32px',
          marginBottom: '24px',
          boxShadow: '0 10px 40px rgba(102, 126, 234, 0.25)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px'
          }}>
            ⏰
          </div>
          
          <div style={{ 
            color: 'white', 
            fontSize: '20px', 
            marginBottom: '28px',
            fontWeight: '600'
          }}>
            {t('attendanceTitle')}
          </div>
          
          <p style={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '15px',
            marginBottom: '32px',
            lineHeight: '1.6'
          }}>
            {t('attendanceSubtitle')}
          </p>

          {/* Action Buttons */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            maxWidth: '500px',
            margin: '0 auto'
          }}>
            <button
              onClick={handleCheckIn}
              disabled={actionLoading}
              style={{
                background: actionLoading 
                  ? 'rgba(255, 255, 255, 0.6)' 
                  : 'white',
                color: actionLoading ? '#999' : '#667eea',
                border: 'none',
                padding: '16px 24px',
                borderRadius: '14px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: actionLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: actionLoading ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
              onMouseEnter={(e) => {
                if (!actionLoading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (!actionLoading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                }
              }}
            >
              {actionLoading ? t('loggingIn') : `✓ ${t('checkIn')}`}
            </button>

            <button
              onClick={handleCheckOut}
              disabled={actionLoading || !hasActiveSession}
              style={{
                background: hasActiveSession && !actionLoading
                  ? 'rgba(255, 255, 255, 0.2)'
                  : 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                color: hasActiveSession && !actionLoading ? 'white' : 'rgba(255, 255, 255, 0.5)',
                border: hasActiveSession && !actionLoading 
                  ? '2px solid rgba(255, 255, 255, 0.4)'
                  : '2px solid rgba(255, 255, 255, 0.2)',
                padding: '16px 24px',
                borderRadius: '14px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: hasActiveSession && !actionLoading ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                opacity: hasActiveSession && !actionLoading ? 1 : 0.6
              }}
              onMouseEnter={(e) => {
                if (hasActiveSession && !actionLoading) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (hasActiveSession && !actionLoading) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              ✕ {t('checkOut')}
            </button>
          </div>
        </div>

        {/* Date Card */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          textAlign: 'center',
          fontSize: '16px',
          color: '#111827',
          fontWeight: '500'
        }}>
          {formatDate()}
        </div>

        {/* Records List */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          minHeight: '200px'
        }}>
          {records.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: '#9CA3AF',
              padding: '60px 20px',
              fontSize: '15px'
            }}>
              {t('noRecordsToday')}
            </div>
          ) : (
            <div>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '20px',
                paddingBottom: '12px',
                borderBottom: '1px solid #E5E7EB'
              }}>
                {t('today')} ({toWesternNum(records.length)})
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {records.map((record, index) => (
                  <div
                    key={record.id}
                    style={{
                      padding: '16px',
                      background: record.checkOut ? '#F9FAFB' : '#EFF6FF',
                      border: `1px solid ${record.checkOut ? '#E5E7EB' : '#BFDBFE'}`,
                      borderRadius: '12px'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#111827'
                      }}>
                        {t('session')} #{toWesternNum(records.length - index)}
                      </div>
                      {!record.checkOut && (
                        <div style={{
                          padding: '4px 12px',
                          background: '#3B82F6',
                          color: 'white',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {t('activeSession')}
                        </div>
                      )}
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px',
                      fontSize: '14px'
                    }}>
                      <div>
                        <div style={{ color: '#6B7280', marginBottom: '4px', fontSize: '12px' }}>
                          {t('checkInTime')}
                        </div>
                        <div style={{ 
                          color: '#111827', 
                          fontWeight: '600',
                          fontFamily: 'monospace'
                        }}>
                          {formatTime(record.checkIn)}
                        </div>
                      </div>

                      <div>
                        <div style={{ color: '#6B7280', marginBottom: '4px', fontSize: '12px' }}>
                          {t('checkOutTime')}
                        </div>
                        <div style={{ 
                          color: record.checkOut ? '#111827' : '#9CA3AF', 
                          fontWeight: '600',
                          fontFamily: 'monospace'
                        }}>
                          {record.checkOut ? formatTime(record.checkOut) : '—'}
                        </div>
                      </div>
                    </div>

                    {record.workHours !== null && (
                      <div style={{
                        marginTop: '12px',
                        padding: '8px 12px',
                        background: '#D1FAE5',
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: '#065F46',
                        fontWeight: '600',
                        textAlign: 'center'
                      }}>
                        ⏱️ {Number(record.workHours).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} {t('workHours')}
                      </div>
                    )}

                    {record.branch && (
                      <div style={{
                        marginTop: '8px',
                        fontSize: '12px',
                        color: '#6B7280'
                      }}>
                        📍 {record.branch.name}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Link */}
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <Link
            href="/hr/attendance/reports"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              background: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              color: '#374151',
              fontWeight: '600',
              fontSize: '14px',
              textDecoration: 'none',
              transition: 'all 0.2s',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F9FAFB';
              e.currentTarget.style.borderColor = '#D1D5DB';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.borderColor = '#E5E7EB';
            }}
          >
            <HiOutlineChartBar size={18} />
            <span>{t('viewReports')}</span>
          </Link>
        </div>

      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
