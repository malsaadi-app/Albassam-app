'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { CardEnhanced, CardBody, CardHeader } from '@/components/ui/CardEnhanced';
import { ResponsiveContainer, ResponsiveGrid } from '@/components/layout/ResponsiveContainer';
import { FloatingInput } from '@/components/ui/FormEnhanced';
import { TableEnhanced, Column } from '@/components/ui/TableEnhanced';
import { SkeletonTable } from '@/components/ui/LoadingStates';

interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workHours: number | null;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED';
  notes: string | null;
}

interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  excusedDays: number;
  averageWorkHours: number;
  attendanceRate: number;
}

export default function AttendanceHistoryPage() {
  const router = useRouter();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: ''
  });

  useEffect(() => {
    // Set default date range (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    setFilters({
      startDate: thirtyDaysAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
      status: ''
    });
  }, []);

  useEffect(() => {
    if (filters.startDate && filters.endDate) {
      fetchAttendance();
    }
  }, [filters]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.status) params.append('status', filters.status);

      const res = await fetch(`/api/attendance/my-history?${params.toString()}`);
      
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/');
          return;
        }
        throw new Error('فشل جلب البيانات');
      }

      const data = await res.json();
      setRecords(data.records || []);
      setStats(data.stats || null);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string; text: string; icon: string }> = {
      PRESENT: { bg: '#D1FAE5', color: '#065F46', text: 'حاضر', icon: '✅' },
      LATE: { bg: '#FEF3C7', color: '#92400E', text: 'متأخر', icon: '⏰' },
      ABSENT: { bg: '#FEE2E2', color: '#991B1B', text: 'غائب', icon: '❌' },
      EXCUSED: { bg: '#E0E7FF', color: '#3730A3', text: 'معذور', icon: '📋' }
    };
    const config = map[status] || { bg: '#F3F4F6', color: '#1F2937', text: status, icon: '•' };
    return (
      <span
        style={{
          background: config.bg,
          color: config.color,
          padding: '6px 12px',
          borderRadius: '12px',
          fontSize: '13px',
          fontWeight: '600',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        <span>{config.icon}</span>
        <span>{config.text}</span>
      </span>
    );
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-SA', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const columns: Column<AttendanceRecord>[] = [
    {
      key: 'date',
      label: 'التاريخ',
      sortable: true,
      render: (row) => formatDate(row.date)
    },
    {
      key: 'checkIn',
      label: 'وقت الدخول',
      sortable: true,
      render: (row) => (
        <span style={{ fontWeight: '600', color: row.checkIn ? '#111827' : '#9CA3AF' }}>
          {formatTime(row.checkIn)}
        </span>
      )
    },
    {
      key: 'checkOut',
      label: 'وقت الخروج',
      sortable: true,
      render: (row) => (
        <span style={{ fontWeight: '600', color: row.checkOut ? '#111827' : '#9CA3AF' }}>
          {formatTime(row.checkOut)}
        </span>
      )
    },
    {
      key: 'workHours',
      label: 'ساعات العمل',
      sortable: true,
      align: 'center',
      render: (row) => (
        <span style={{ fontWeight: '700', fontSize: '15px', color: '#667eea' }}>
          {row.workHours !== null ? row.workHours.toFixed(1) : '-'}
        </span>
      )
    },
    {
      key: 'status',
      label: 'الحالة',
      sortable: true,
      align: 'center',
      render: (row) => getStatusBadge(row.status)
    },
    {
      key: 'notes',
      label: 'ملاحظات',
      render: (row) => (
        <span style={{ fontSize: '13px', color: '#6B7280' }}>
          {row.notes || '-'}
        </span>
      )
    }
  ];

  const handleDownloadCSV = () => {
    if (records.length === 0) {
      alert('لا توجد بيانات للتحميل');
      return;
    }

    const headers = ['التاريخ', 'وقت الدخول', 'وقت الخروج', 'ساعات العمل', 'الحالة', 'ملاحظات'];
    const rows = records.map(r => [
      formatDate(r.date),
      formatTime(r.checkIn),
      formatTime(r.checkOut),
      r.workHours !== null ? r.workHours.toFixed(1) : '-',
      r.status,
      r.notes || '-'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `attendance-${filters.startDate}-to-${filters.endDate}.csv`;
    link.click();
  };

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <ResponsiveContainer size="xl">
        <PageHeader
          title="📊 تاريخ الحضور"
          breadcrumbs={['الرئيسية', 'الملف الشخصي', 'تاريخ الحضور']}
          actions={
            <button
              onClick={handleDownloadCSV}
              disabled={loading || records.length === 0}
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '600',
                cursor: loading || records.length === 0 ? 'not-allowed' : 'pointer',
                fontSize: '15px',
                opacity: loading || records.length === 0 ? 0.5 : 1
              }}
            >
              📥 تحميل CSV
            </button>
          }
        />

        {/* Stats Cards */}
        {stats && (
          <ResponsiveGrid columns={{ mobile: 2, tablet: 3, desktop: 6 }} gap="md" style={{ marginBottom: '24px' }}>
            <CardEnhanced variant="elevated">
              <CardBody compact>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '6px' }}>📅</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#111827', marginBottom: '4px' }}>
                    {stats.totalDays}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>إجمالي الأيام</div>
                </div>
              </CardBody>
            </CardEnhanced>

            <CardEnhanced variant="success">
              <CardBody compact>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '6px' }}>✅</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#10B981', marginBottom: '4px' }}>
                    {stats.presentDays}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>حاضر</div>
                </div>
              </CardBody>
            </CardEnhanced>

            <CardEnhanced variant="warning">
              <CardBody compact>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '6px' }}>⏰</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#F59E0B', marginBottom: '4px' }}>
                    {stats.lateDays}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>متأخر</div>
                </div>
              </CardBody>
            </CardEnhanced>

            <CardEnhanced variant="danger">
              <CardBody compact>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '6px' }}>❌</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#EF4444', marginBottom: '4px' }}>
                    {stats.absentDays}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>غائب</div>
                </div>
              </CardBody>
            </CardEnhanced>

            <CardEnhanced variant="outlined">
              <CardBody compact>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '6px' }}>📋</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#667eea', marginBottom: '4px' }}>
                    {stats.excusedDays}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>معذور</div>
                </div>
              </CardBody>
            </CardEnhanced>

            <CardEnhanced variant="gradient">
              <CardBody compact>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '6px' }}>📈</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#111827', marginBottom: '4px' }}>
                    {Math.round(stats.attendanceRate)}%
                  </div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>نسبة الحضور</div>
                </div>
              </CardBody>
            </CardEnhanced>
          </ResponsiveGrid>
        )}

        {/* Filters */}
        <CardEnhanced variant="outlined" style={{ marginBottom: '24px' }}>
          <CardBody>
            <ResponsiveGrid columns={{ mobile: 1, tablet: 2, desktop: 4 }} gap="md">
              <FloatingInput
                label="من تاريخ"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
              <FloatingInput
                label="إلى تاريخ"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>
                  الحالة
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: 'white'
                  }}
                >
                  <option value="">جميع الحالات</option>
                  <option value="PRESENT">حاضر</option>
                  <option value="LATE">متأخر</option>
                  <option value="ABSENT">غائب</option>
                  <option value="EXCUSED">معذور</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  onClick={() => setFilters({ startDate: '', endDate: '', status: '' })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'white',
                    color: '#6B7280',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  ✖ مسح الفلاتر
                </button>
              </div>
            </ResponsiveGrid>
          </CardBody>
        </CardEnhanced>

        {/* Table */}
        {loading ? (
          <SkeletonTable rows={10} />
        ) : error ? (
          <CardEnhanced variant="danger">
            <CardBody>
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>⚠️</div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#DC2626', marginBottom: '8px' }}>
                  خطأ في تحميل البيانات
                </h3>
                <p style={{ color: '#6B7280', marginBottom: '24px' }}>{error}</p>
                <button
                  onClick={fetchAttendance}
                  style={{
                    background: '#DC2626',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  إعادة المحاولة
                </button>
              </div>
            </CardBody>
          </CardEnhanced>
        ) : (
          <TableEnhanced
            data={records}
            columns={columns}
            loading={false}
            searchable={true}
            exportable={false}
            pageSize={25}
            emptyMessage="لا توجد سجلات حضور في الفترة المحددة"
            rowKey="id"
          />
        )}

        {/* Info */}
        {!loading && records.length > 0 && (
          <div style={{ marginTop: '24px', padding: '16px', background: '#F0F9FF', borderRadius: '12px', border: '1px solid #BFDBFE' }}>
            <div style={{ fontSize: '14px', color: '#1E40AF', lineHeight: '1.6' }}>
              <strong>ملاحظة:</strong> البيانات المعروضة هي سجلات الحضور الفعلية. للحصول على شهادة حضور رسمية، تواصل مع قسم الموارد البشرية.
            </div>
          </div>
        )}
      </ResponsiveContainer>
    </div>
  );
}
