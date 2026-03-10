'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StatsCard } from '@/components/ui/CardEnhanced';
import { CardEnhanced, CardHeader, CardBody } from '@/components/ui/CardEnhanced';
import { ResponsiveContainer, ResponsiveGrid } from '@/components/layout/ResponsiveContainer';
import { SkeletonCard } from '@/components/ui/LoadingStates';
import { Badge } from '@/components/ui/TableEnhanced';
import { HiOutlineClipboardList, HiOutlineClock, HiOutlineUserGroup, HiOutlineDocumentText, HiOutlineChartBar } from 'react-icons/hi';

interface Stats {
  tasks: { total: number; pending: number; inProgress: number; completed: number };
  attendance: { present: number; absent: number; late: number; rate: number };
  leaves: { pending: number; approved: number; balance: number };
  hrRequests: { pending: number };
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.ok ? r.json() : null),
      fetch('/api/dashboard/stats').then(r => r.ok ? r.json() : null),
      fetch('/api/tasks?limit=5').then(r => r.ok ? r.json() : { tasks: [] })
    ]).then(([userData, statsData, tasksData]) => {
      setUser(userData);
      setStats(statsData);
      setTasks(tasksData.tasks || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'HR';

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <ResponsiveContainer size="xl">
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '800', 
            color: '#1e293b', 
            marginBottom: '8px' 
          }}>
            مرحباً، {user?.fullNameAr || 'المستخدم'} 👋
          </h1>
          <p style={{ color: '#64748b', fontSize: '16px' }}>
            {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Quick Actions */}
        <ResponsiveGrid columns={{ mobile: 2, tablet: 4, desktop: 4 }} gap="md" style={{ marginBottom: '32px' }}>
          <ActionCard href="/tasks" icon={<HiOutlineClipboardList size={28} />} title="المهام" color="#3b82f6" />
          <ActionCard href="/attendance" icon={<HiOutlineClock size={28} />} title="الحضور" color="#10b981" />
          {isAdmin && <ActionCard href="/hr/employees" icon={<HiOutlineUserGroup size={28} />} title="الموارد البشرية" color="#8b5cf6" />}
          <ActionCard href="/reports" icon={<HiOutlineChartBar size={28} />} title="التقارير" color="#f59e0b" />
        </ResponsiveGrid>

        {/* Stats Grid */}
        {loading ? (
          <ResponsiveGrid columns={{ mobile: 1, tablet: 2, desktop: 4 }} gap="md" style={{ marginBottom: '32px' }}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </ResponsiveGrid>
        ) : stats ? (
          <ResponsiveGrid columns={{ mobile: 1, tablet: 2, desktop: 4 }} gap="md" style={{ marginBottom: '32px' }}>
            <StatsCard 
              icon={<HiOutlineClipboardList size={28} />}
              label="المهام"
              value={stats.tasks.total.toString()}
              change={{ value: `${stats.tasks.pending} معلقة`, isPositive: false }}
              variant="gradient"
              hoverable
            />
            <StatsCard 
              icon={<HiOutlineClock size={28} />}
              label="الحضور اليوم"
              value={`${stats.attendance.rate}%`}
              change={{ value: `${stats.attendance.present} حاضر`, isPositive: true }}
              variant="success"
              hoverable
            />
            {isAdmin && stats.hrRequests && (
              <StatsCard 
                icon={<HiOutlineDocumentText size={28} />}
                label="طلبات HR"
                value={stats.hrRequests.pending.toString()}
                change={{ value: 'بانتظار المراجعة', isPositive: false }}
                variant="warning"
                hoverable
              />
            )}
            {stats.leaves && (
              <StatsCard 
                icon={<HiOutlineDocumentText size={28} />}
                label="رصيد الإجازات"
                value={stats.leaves.balance.toString()}
                change={{ value: `${stats.leaves.pending} طلب معلق`, isPositive: false }}
                variant="stats"
                hoverable
              />
            )}
          </ResponsiveGrid>
        ) : null}

        {/* Recent Tasks */}
        {tasks.length > 0 && (
          <CardEnhanced variant="default">
            <CardHeader
              icon={<HiOutlineClipboardList size={24} />}
              title="المهام الأخيرة"
              subtitle="آخر 5 مهام تم إضافتها"
              actions={
                <Link href="/tasks" style={{ 
                  color: '#3b82f6', 
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  عرض الكل ←
                </Link>
              }
            />
            <CardBody>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {tasks.map(task => (
                  <Link 
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px',
                      background: '#f8fafc',
                      borderRadius: '12px',
                      textDecoration: 'none',
                      color: 'inherit',
                      border: '1px solid #e2e8f0',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f1f5f9';
                      e.currentTarget.style.borderColor = '#cbd5e1';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#f8fafc';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
                        {task.title}
                      </div>
                      <div style={{ fontSize: '14px', color: '#64748b' }}>
                        {task.dueDate ? `مطلوب: ${new Date(task.dueDate).toLocaleDateString('ar-SA')}` : 'بدون موعد محدد'}
                      </div>
                    </div>
                    <StatusBadge status={task.status} />
                  </Link>
                ))}
              </div>
            </CardBody>
          </CardEnhanced>
        )}
      </ResponsiveContainer>
    </div>
  );
}

function ActionCard({ href, icon, title, color }: { href: string; icon: React.ReactNode; title: string; color: string }) {
  return (
    <Link 
      href={href}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        padding: '24px',
        background: 'white',
        borderRadius: '16px',
        textDecoration: 'none',
        color: '#1e293b',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #e2e8f0',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        textAlign: 'center'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
      }}
    >
      <div style={{ 
        fontSize: '32px',
        width: '64px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `${color}15`,
        borderRadius: '16px',
        color: color
      }}>
        {icon}
      </div>
      <div style={{ fontWeight: '600', fontSize: '16px' }}>{title}</div>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { type: 'success' | 'warning' | 'danger' | 'info' | 'gray'; label: string }> = {
    PENDING: { type: 'warning', label: 'معلقة' },
    IN_PROGRESS: { type: 'info', label: 'قيد التنفيذ' },
    COMPLETED: { type: 'success', label: 'مكتملة' },
    CANCELLED: { type: 'danger', label: 'ملغاة' }
  };
  
  const config = map[status] || map.PENDING;
  
  return <Badge type={config.type}>{config.label}</Badge>;
}
