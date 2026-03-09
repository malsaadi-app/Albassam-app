'use client';

import { useState } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { useAttendanceRecords } from '@/hooks/useAttendanceRecords';
import { useToast } from '@/components/Toast';
import Link from 'next/link';

export default function AttendanceRecordsPage() {
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const { showToast, ToastContainer } = useToast();
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: ''
  });

  const canView = hasPermission('attendance.view') || 
                 hasPermission('attendance.view_team') ||
                 hasPermission('attendance.view_own');

  const { records, pagination, isLoading, isError } = useAttendanceRecords({
    page,
    limit,
    ...filters,
    enabled: canView && !permissionsLoading
  });

  if (permissionsLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB' }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #E5E7EB',
          borderTop: '4px solid #667eea',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}></div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!canView) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB', padding: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔒</div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '12px' }}>
            ليس لديك صلاحية
          </h1>
          <Link href="/" style={{ color: '#667eea', textDecoration: 'none' }}>
            العودة إلى الصفحة الرئيسية
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '20px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '12px' }}>
            <Link href="/" style={{ color: '#6B7280', textDecoration: 'none' }}>الرئيسية</Link>
            {' / '}
            <span style={{ color: '#111827', fontWeight: '500' }}>سجل الحضور</span>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
            📋 سجل الحضور
          </h1>
          <p style={{ color: '#6B7280' }}>
            {pagination.total} سجل • صفحة {pagination.page} من {pagination.totalPages}
          </p>
        </div>

        {/* Filters */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
            🔍 الفلاتر
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                من التاريخ
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => {
                  setFilters({ ...filters, startDate: e.target.value });
                  setPage(1);
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                إلى التاريخ
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => {
                  setFilters({ ...filters, endDate: e.target.value });
                  setPage(1);
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                الحالة
              </label>
              <select
                value={filters.status}
                onChange={(e) => {
                  setFilters({ ...filters, status: e.target.value });
                  setPage(1);
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  fontSize: '14px',
                  outline: 'none'
                }}
              >
                <option value="">كل الحالات</option>
                <option value="PRESENT">حاضر</option>
                <option value="LATE">متأخر</option>
                <option value="ABSENT">غائب</option>
                <option value="HALF_DAY">نصف يوم</option>
              </select>
            </div>
          </div>
        </div>

        {/* Records Table */}
        <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}>
          {isLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
              ⏳ جاري تحميل السجلات...
            </div>
          ) : isError ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#991B1B' }}>
              ❌ حدث خطأ أثناء تحميل السجلات
            </div>
          ) : records.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
              📭 لا توجد سجلات
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F3F4F6', borderBottom: '1px solid #E5E7EB' }}>
                    <th style={{ padding: '16px', textAlign: 'right', fontWeight: '600', color: '#374151', fontSize: '14px' }}>التاريخ</th>
                    <th style={{ padding: '16px', textAlign: 'right', fontWeight: '600', color: '#374151', fontSize: '14px' }}>اسم الموظف</th>
                    <th style={{ padding: '16px', textAlign: 'right', fontWeight: '600', color: '#374151', fontSize: '14px' }}>رقم الموظف</th>
                    <th style={{ padding: '16px', textAlign: 'right', fontWeight: '600', color: '#374151', fontSize: '14px' }}>وقت الدخول</th>
                    <th style={{ padding: '16px', textAlign: 'right', fontWeight: '600', color: '#374151', fontSize: '14px' }}>وقت الخروج</th>
                    <th style={{ padding: '16px', textAlign: 'right', fontWeight: '600', color: '#374151', fontSize: '14px' }}>الحالة</th>
                    <th style={{ padding: '16px', textAlign: 'right', fontWeight: '600', color: '#374151', fontSize: '14px' }}>ساعات العمل</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record, idx) => {
                    const statusColor = {
                      'PRESENT': { bg: '#D1FAE5', text: '#065F46', label: '✅ حاضر' },
                      'LATE': { bg: '#FEF3C7', text: '#92400E', label: '⏰ متأخر' },
                      'ABSENT': { bg: '#FEE2E2', text: '#991B1B', label: '❌ غائب' },
                      'HALF_DAY': { bg: '#DBEAFE', text: '#1E40AF', label: '📌 نصف يوم' }
                    }[record.status] || { bg: '#F3F4F6', text: '#6B7280', label: record.status };

                    return (
                      <tr
                        key={record.id}
                        style={{
                          borderBottom: '1px solid #E5E7EB',
                          background: idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#F3F4F6';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB';
                        }}
                      >
                        <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>
                          {new Date(record.date).toLocaleDateString('ar-SA')}
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', color: '#374151', fontWeight: '600' }}>
                          {record.employee.name}
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', color: '#6B7280' }}>
                          {record.employee.number || '-'}
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', color: '#374151', fontFamily: 'monospace' }}>
                          {new Date(record.checkIn).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', color: '#374151', fontFamily: 'monospace' }}>
                          {record.checkOut 
                            ? new Date(record.checkOut).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
                            : '❌'
                          }
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '6px 12px',
                            background: statusColor.bg,
                            color: statusColor.text,
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            {statusColor.label}
                          </span>
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', color: '#374151', fontFamily: 'monospace' }}>
                          {record.workHours ? `${record.workHours.toFixed(2)}h` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {!isLoading && records.length > 0 && (
          <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ color: '#6B7280', fontSize: '14px' }}>
              {(page - 1) * limit + 1} إلى {Math.min(page * limit, pagination.total)} من {pagination.total}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setPage(page - 1)}
                disabled={!pagination.hasPreviousPage}
                style={{
                  padding: '10px 16px',
                  border: '1px solid #D1D5DB',
                  background: pagination.hasPreviousPage ? 'white' : '#F3F4F6',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: pagination.hasPreviousPage ? 'pointer' : 'not-allowed',
                  color: pagination.hasPreviousPage ? '#374151' : '#9CA3AF'
                }}
              >
                ← السابق
              </button>
              <div style={{ padding: '10px 16px', background: '#F9FAFB', borderRadius: '8px', fontSize: '14px', color: '#374151' }}>
                صفحة {pagination.page} من {pagination.totalPages}
              </div>
              <button
                onClick={() => setPage(page + 1)}
                disabled={!pagination.hasNextPage}
                style={{
                  padding: '10px 16px',
                  border: '1px solid #D1D5DB',
                  background: pagination.hasNextPage ? 'white' : '#F3F4F6',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: pagination.hasNextPage ? 'pointer' : 'not-allowed',
                  color: pagination.hasNextPage ? '#374151' : '#9CA3AF'
                }}
              >
                التالي →
              </button>
            </div>
          </div>
        )}

      </div>

      <ToastContainer />
    </div>
  );
}
