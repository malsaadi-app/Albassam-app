'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import dynamic from 'next/dynamic';

// Dynamic import for Chart.js (heavy library - ~120KB)
// Only load when user visits reports page
const Bar = dynamic(
  () => import('react-chartjs-2').then(mod => {
    // Register Chart.js components only when needed
    const ChartJS = require('chart.js');
    ChartJS.Chart.register(
      ChartJS.CategoryScale,
      ChartJS.LinearScale,
      ChartJS.BarElement,
      ChartJS.PointElement,
      ChartJS.LineElement,
      ChartJS.Title,
      ChartJS.Tooltip,
      ChartJS.Legend,
      ChartJS.ArcElement
    );
    return mod.Bar;
  }),
  {
    loading: () => <div className="h-64 flex items-center justify-center text-gray-500">جاري تحميل الرسم البياني...</div>,
    ssr: false,
  }
);

const Pie = dynamic(
  () => import('react-chartjs-2').then(mod => mod.Pie),
  {
    loading: () => <div className="h-64 flex items-center justify-center text-gray-500">جاري تحميل الرسم البياني...</div>,
    ssr: false,
  }
);

const Line = dynamic(
  () => import('react-chartjs-2').then(mod => mod.Line),
  {
    loading: () => <div className="h-64 flex items-center justify-center text-gray-500">جاري تحميل الرسم البياني...</div>,
    ssr: false,
  }
);

export type TaskRow = {
  id: string;
  title: string;
  status: 'NEW' | 'IN_PROGRESS' | 'ON_HOLD' | 'DONE';
  category: 'TRANSACTIONS' | 'HR';
  owner: { username: string; displayName: string };
  createdAt: string;
  updatedAt: string;
};

export type TaskStats = {
  total: number;
  byStatus: { NEW: number; IN_PROGRESS: number; ON_HOLD: number; DONE: number };
  byCategory: { TRANSACTIONS: number; HR: number };
  completionRate: number;
  averageCompletionTime: number;
  overdueCount: number;
};

export type UserTaskStat = {
  userId: string;
  displayName: string;
  total: number;
  completed: number;
};

export type HRStats = {
  employees: {
    total: number;
    active: number;
    onLeave: number;
    resigned: number;
  };
  leaves: {
    pending: number;
    approved: number;
    rejected: number;
  };
  departmentStats: Array<{ department: string; count: number }>;
};

export type DailyCompletion = { date: string; count: number };

export default function ReportsClient(props: {
  taskStats: TaskStats;
  topUsers: UserTaskStat[];
  dailyCompletions: DailyCompletion[];
  hrStats: HRStats;
}) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const { taskStats, topUsers, dailyCompletions, hrStats } = props;

  const handleRefresh = async () => {
    setRefreshing(true);
    // Triggers server component re-fetch
    router.refresh();
    // Small delay to avoid rapid double-clicks
    setTimeout(() => setRefreshing(false), 600);
  };

  const handleExportCSV = () => {
    let csv = 'تقرير شامل - نظام إدارة المهام\n\n';
    csv += 'إحصائيات المهام:\n';
    csv += `إجمالي المهام,${taskStats.total}\n`;
    csv += `مهام جديدة,${taskStats.byStatus.NEW}\n`;
    csv += `قيد التنفيذ,${taskStats.byStatus.IN_PROGRESS}\n`;
    csv += `بانتظار,${taskStats.byStatus.ON_HOLD}\n`;
    csv += `مكتملة,${taskStats.byStatus.DONE}\n`;
    csv += `معدل الإنجاز,${taskStats.completionRate}%\n`;
    csv += `متوسط وقت الإنجاز,${taskStats.averageCompletionTime} يوم\n`;
    csv += `مهام متأخرة,${taskStats.overdueCount}\n\n`;

    csv += 'إحصائيات الموارد البشرية:\n';
    csv += `إجمالي الموظفين,${hrStats.employees.total}\n`;
    csv += `موظفين نشطين,${hrStats.employees.active}\n`;
    csv += `في إجازة,${hrStats.employees.onLeave}\n`;
    csv += `مستقيلين/منتهيين,${hrStats.employees.resigned}\n`;
    csv += `طلبات إجازة معلقة,${hrStats.leaves.pending}\n`;
    csv += `طلبات إجازة موافق عليها,${hrStats.leaves.approved}\n`;
    csv += `طلبات إجازة مرفوضة,${hrStats.leaves.rejected}\n\n`;

    csv += 'أفضل 5 موظفين:\n';
    csv += 'الاسم,إجمالي المهام,المهام المكتملة\n';
    topUsers.forEach((user) => {
      csv += `${user.displayName},${user.total},${user.completed}\n`;
    });

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `تقرير_شامل_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          labels: {
            font: { family: 'Cairo', size: 12 },
          },
        },
      },
    }),
    []
  );

  const tasksByStatusChart = useMemo(
    () => ({
      labels: ['جديد', 'قيد التنفيذ', 'بانتظار', 'مكتمل'],
      datasets: [
        {
          data: [
            taskStats.byStatus.NEW,
            taskStats.byStatus.IN_PROGRESS,
            taskStats.byStatus.ON_HOLD,
            taskStats.byStatus.DONE,
          ],
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
          ],
          borderColor: [
            'rgba(59, 130, 246, 1)',
            'rgba(245, 158, 11, 1)',
            'rgba(139, 92, 246, 1)',
            'rgba(16, 185, 129, 1)',
          ],
          borderWidth: 2,
        },
      ],
    }),
    [taskStats]
  );

  const topUsersChart = useMemo(
    () => ({
      labels: topUsers.map((u) => u.displayName),
      datasets: [
        {
          label: 'إجمالي المهام',
          data: topUsers.map((u) => u.total),
          backgroundColor: 'rgba(212, 165, 116, 0.8)',
          borderColor: 'rgba(212, 165, 116, 1)',
          borderWidth: 2,
        },
        {
          label: 'المهام المكتملة',
          data: topUsers.map((u) => u.completed),
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 2,
        },
      ],
    }),
    [topUsers]
  );

  const dailyCompletionsChart = useMemo(
    () => ({
      labels: dailyCompletions.map((d) => {
        const date = new Date(d.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }),
      datasets: [
        {
          label: 'المهام المكتملة',
          data: dailyCompletions.map((d) => d.count),
          borderColor: 'rgba(45, 27, 78, 1)',
          backgroundColor: 'rgba(45, 27, 78, 0.1)',
          tension: 0.4,
          fill: true,
          borderWidth: 3,
          pointRadius: 5,
          pointBackgroundColor: 'rgba(212, 165, 116, 1)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        },
      ],
    }),
    [dailyCompletions]
  );

  const employeesByDeptChart = useMemo(
    () => ({
      labels: hrStats.departmentStats.map((d) => d.department),
      datasets: [
        {
          label: 'عدد الموظفين',
          data: hrStats.departmentStats.map((d) => d.count),
          backgroundColor: 'rgba(230, 126, 34, 0.8)',
          borderColor: 'rgba(230, 126, 34, 1)',
          borderWidth: 2,
        },
      ],
    }),
    [hrStats.departmentStats]
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-secondary)', direction: 'rtl' }}>
      <header
        style={{
          background: 'linear-gradient(135deg, #2D1B4E 0%, #3D2B5E 100%)',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 0',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ position: 'relative', width: '48px', height: '48px' }}>
                <Image src="/logo.jpg" alt="Albassam Schools" fill style={{ objectFit: 'contain' }} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', margin: 0 }}>
                  📊 التقارير والإحصائيات الشاملة
                </h1>
                <p style={{ fontSize: '0.875rem', color: '#e5e7eb', margin: 0 }}>
                  نظام إدارة المهام والموارد البشرية
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                  color: 'white',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(255,255,255,0.3)',
                  cursor: refreshing ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  opacity: refreshing ? 0.7 : 1,
                }}
              >
                {refreshing ? '🔄 جاري التحديث...' : '🔄 تحديث'}
              </button>
              <button
                onClick={handleExportCSV}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                }}
              >
                📥 تصدير CSV
              </button>
              <button
                onClick={() => router.push('/tasks')}
                style={{
                  background: 'white',
                  color: '#2D1B4E',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                }}
              >
                ← العودة للمهام
              </button>
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1rem' }}>
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: 'var(--color-primary)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          📋 إحصائيات المهام
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '1rem',
            marginBottom: '2.5rem',
          }}
        >
          {/* Same summary cards as before */}
          <div
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              borderRadius: '16px',
              padding: '1.5rem',
              textAlign: 'center',
              boxShadow: '0 4px 15px rgba(59,130,246,0.3)',
            }}
          >
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>
              {taskStats.total}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.95)', fontWeight: '600' }}>إجمالي المهام</div>
          </div>
          <div
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '16px',
              padding: '1.5rem',
              textAlign: 'center',
              boxShadow: '0 4px 15px rgba(16,185,129,0.3)',
            }}
          >
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>
              {taskStats.byStatus.DONE}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.95)', fontWeight: '600' }}>مكتملة</div>
          </div>
          <div
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              borderRadius: '16px',
              padding: '1.5rem',
              textAlign: 'center',
              boxShadow: '0 4px 15px rgba(245,158,11,0.3)',
            }}
          >
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>
              {taskStats.byStatus.IN_PROGRESS}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.95)', fontWeight: '600' }}>قيد التنفيذ</div>
          </div>
          <div
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              borderRadius: '16px',
              padding: '1.5rem',
              textAlign: 'center',
              boxShadow: '0 4px 15px rgba(139,92,246,0.3)',
            }}
          >
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>
              {taskStats.byStatus.ON_HOLD}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.95)', fontWeight: '600' }}>بانتظار</div>
          </div>
          <div
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              borderRadius: '16px',
              padding: '1.5rem',
              textAlign: 'center',
              boxShadow: '0 4px 15px rgba(239,68,68,0.3)',
            }}
          >
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>
              {taskStats.overdueCount}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.95)', fontWeight: '600' }}>متأخرة</div>
          </div>
          <div
            style={{
              background: 'linear-gradient(135deg, #D4A574 0%, #C49564 100%)',
              borderRadius: '16px',
              padding: '1.5rem',
              textAlign: 'center',
              boxShadow: '0 4px 15px rgba(212,165,116,0.3)',
            }}
          >
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>
              {taskStats.completionRate}%
            </div>
            <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.95)', fontWeight: '600' }}>معدل الإنجاز</div>
          </div>
          <div
            style={{
              background: 'linear-gradient(135deg, #E67E22 0%, #D66E12 100%)',
              borderRadius: '16px',
              padding: '1.5rem',
              textAlign: 'center',
              boxShadow: '0 4px 15px rgba(230,126,34,0.3)',
            }}
          >
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>
              {taskStats.averageCompletionTime}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.95)', fontWeight: '600' }}>متوسط الإنجاز (أيام)</div>
          </div>
        </div>

        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: 'var(--color-primary)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          👥 إحصائيات الموارد البشرية
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '1rem',
            marginBottom: '2.5rem',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '16px',
              padding: '1.5rem',
              textAlign: 'center',
              boxShadow: '0 4px 15px rgba(102,126,234,0.3)',
            }}
          >
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>{hrStats.employees.total}</div>
            <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.95)', fontWeight: '600' }}>إجمالي الموظفين</div>
          </div>
          <div
            style={{
              background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
              borderRadius: '16px',
              padding: '1.5rem',
              textAlign: 'center',
              boxShadow: '0 4px 15px rgba(46,204,113,0.3)',
            }}
          >
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>{hrStats.employees.active}</div>
            <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.95)', fontWeight: '600' }}>نشط</div>
          </div>
          <div
            style={{
              background: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)',
              borderRadius: '16px',
              padding: '1.5rem',
              textAlign: 'center',
              boxShadow: '0 4px 15px rgba(243,156,18,0.3)',
            }}
          >
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>{hrStats.employees.onLeave}</div>
            <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.95)', fontWeight: '600' }}>في إجازة</div>
          </div>
          <div
            style={{
              background: 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)',
              borderRadius: '16px',
              padding: '1.5rem',
              textAlign: 'center',
              boxShadow: '0 4px 15px rgba(149,165,166,0.3)',
            }}
          >
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>{hrStats.employees.resigned}</div>
            <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.95)', fontWeight: '600' }}>مستقيل/منتهي</div>
          </div>
          <div
            style={{
              background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
              borderRadius: '16px',
              padding: '1.5rem',
              textAlign: 'center',
              boxShadow: '0 4px 15px rgba(231,76,60,0.3)',
            }}
          >
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>{hrStats.leaves.pending}</div>
            <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.95)', fontWeight: '600' }}>إجازات معلقة</div>
          </div>
          <div
            style={{
              background: 'linear-gradient(135deg, #16a085 0%, #1abc9c 100%)',
              borderRadius: '16px',
              padding: '1.5rem',
              textAlign: 'center',
              boxShadow: '0 4px 15px rgba(22,160,133,0.3)',
            }}
          >
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>{hrStats.leaves.approved}</div>
            <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.95)', fontWeight: '600' }}>إجازات موافقة</div>
          </div>
          <div
            style={{
              background: 'linear-gradient(135deg, #c0392b 0%, #8e2417 100%)',
              borderRadius: '16px',
              padding: '1.5rem',
              textAlign: 'center',
              boxShadow: '0 4px 15px rgba(192,57,43,0.3)',
            }}
          >
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>{hrStats.leaves.rejected}</div>
            <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.95)', fontWeight: '600' }}>إجازات مرفوضة</div>
          </div>
        </div>

        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: 'var(--color-primary)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          📈 الرسوم البيانية
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div
            style={{
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              padding: '1.5rem',
              boxShadow: '0 8px 16px rgba(0,0,0,0.08)',
              border: '1px solid rgba(45,27,78,0.1)',
            }}
          >
            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#2D1B4E', marginBottom: '1rem' }}>🥧 المهام حسب الحالة</h3>
            <div style={{ maxWidth: '350px', margin: '0 auto' }}>
              <Pie data={tasksByStatusChart} options={chartOptions} />
            </div>
          </div>

          {topUsers.length > 0 && (
            <div
              style={{
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                padding: '1.5rem',
                boxShadow: '0 8px 16px rgba(0,0,0,0.08)',
                border: '1px solid rgba(45,27,78,0.1)',
              }}
            >
              <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#2D1B4E', marginBottom: '1rem' }}>👥 أفضل 5 موظفين (حسب عدد المهام)</h3>
              <Bar data={topUsersChart} options={chartOptions} />
            </div>
          )}

          {dailyCompletions.length > 0 && (
            <div
              style={{
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                padding: '1.5rem',
                boxShadow: '0 8px 16px rgba(0,0,0,0.08)',
                border: '1px solid rgba(45,27,78,0.1)',
              }}
            >
              <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#2D1B4E', marginBottom: '1rem' }}>📊 المهام المكتملة (آخر 7 أيام)</h3>
              <Line data={dailyCompletionsChart} options={chartOptions} />
            </div>
          )}

          {hrStats.departmentStats.length > 0 && (
            <div
              style={{
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                padding: '1.5rem',
                boxShadow: '0 8px 16px rgba(0,0,0,0.08)',
                border: '1px solid rgba(45,27,78,0.1)',
              }}
            >
              <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#2D1B4E', marginBottom: '1rem' }}>🏢 الموظفين حسب القسم</h3>
              <Bar data={employeesByDeptChart} options={chartOptions} />
            </div>
          )}

          <div
            style={{
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              padding: '1.5rem',
              boxShadow: '0 8px 16px rgba(0,0,0,0.08)',
              border: '1px solid rgba(45,27,78,0.1)',
            }}
          >
            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#2D1B4E', marginBottom: '1rem' }}>📂 المهام حسب القسم</h3>
            <div style={{ maxWidth: '350px', margin: '0 auto' }}>
              <Pie
                data={{
                  labels: ['معاملات', 'شؤون الموظفين'],
                  datasets: [
                    {
                      data: [taskStats.byCategory.TRANSACTIONS, taskStats.byCategory.HR],
                      backgroundColor: ['rgba(212, 165, 116, 0.8)', 'rgba(230, 126, 34, 0.8)'],
                      borderColor: ['rgba(212, 165, 116, 1)', 'rgba(230, 126, 34, 1)'],
                      borderWidth: 2,
                    },
                  ],
                }}
                options={chartOptions}
              />
            </div>
          </div>

          <div
            style={{
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              padding: '1.5rem',
              boxShadow: '0 8px 16px rgba(0,0,0,0.08)',
              border: '1px solid rgba(45,27,78,0.1)',
            }}
          >
            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#2D1B4E', marginBottom: '1rem' }}>🌴 ملخص طلبات الإجازات</h3>
            <div style={{ maxWidth: '350px', margin: '0 auto' }}>
              <Pie
                data={{
                  labels: ['معلقة', 'موافقة', 'مرفوضة'],
                  datasets: [
                    {
                      data: [hrStats.leaves.pending, hrStats.leaves.approved, hrStats.leaves.rejected],
                      backgroundColor: ['rgba(245, 158, 11, 0.8)', 'rgba(16, 185, 129, 0.8)', 'rgba(239, 68, 68, 0.8)'],
                      borderColor: ['rgba(245, 158, 11, 1)', 'rgba(16, 185, 129, 1)', 'rgba(239, 68, 68, 1)'],
                      borderWidth: 2,
                    },
                  ],
                }}
                options={chartOptions}
              />
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'linear-gradient(135deg, rgba(45,27,78,0.05) 0%, rgba(212,165,116,0.05) 100%)',
            borderRadius: '20px',
            padding: '2rem',
            border: '2px solid rgba(45,27,78,0.1)',
            boxShadow: '0 8px 16px rgba(0,0,0,0.05)',
          }}
        >
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: '1rem' }}>📝 ملخص التقرير</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--color-primary)', marginBottom: '0.75rem' }}>📋 المهام:</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                <li style={{ marginBottom: '0.5rem' }}>• إجمالي المهام: <strong>{taskStats.total}</strong></li>
                <li style={{ marginBottom: '0.5rem' }}>• معدل الإنجاز: <strong>{taskStats.completionRate}%</strong></li>
                <li style={{ marginBottom: '0.5rem' }}>• متوسط وقت الإنجاز: <strong>{taskStats.averageCompletionTime} يوم</strong></li>
                <li style={{ marginBottom: '0.5rem' }}>• مهام متأخرة: <strong style={{ color: 'var(--color-error)' }}>{taskStats.overdueCount}</strong></li>
              </ul>
            </div>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--color-primary)', marginBottom: '0.75rem' }}>👥 الموارد البشرية:</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                <li style={{ marginBottom: '0.5rem' }}>• إجمالي الموظفين: <strong>{hrStats.employees.total}</strong></li>
                <li style={{ marginBottom: '0.5rem' }}>• موظفين نشطين: <strong style={{ color: 'var(--color-success)' }}>{hrStats.employees.active}</strong></li>
                <li style={{ marginBottom: '0.5rem' }}>• في إجازة: <strong>{hrStats.employees.onLeave}</strong></li>
                <li style={{ marginBottom: '0.5rem' }}>• طلبات إجازة معلقة: <strong style={{ color: 'var(--color-warning)' }}>{hrStats.leaves.pending}</strong></li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
