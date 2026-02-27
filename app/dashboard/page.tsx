'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '80vh' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            border: '4px solid #e5e7eb', 
            borderTopColor: '#2D1B4E', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#64748b' }}>جاري التحميل...</p>
        </div>
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'HR';

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: '700', 
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
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px',
        marginBottom: '32px'
      }}>
        <ActionCard href="/tasks" icon="📋" title="المهام" color="#3b82f6" />
        <ActionCard href="/attendance" icon="⏰" title="الحضور" color="#10b981" />
        {isAdmin && <ActionCard href="/hr/employees" icon="👥" title="الموارد البشرية" color="#8b5cf6" />}
        <ActionCard href="/reports" icon="📊" title="التقارير" color="#f59e0b" />
      </div>

      {/* Stats Grid */}
      {stats && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
          gap: '20px',
          marginBottom: '32px'
        }}>
          <StatCard 
            title="المهام" 
            value={stats.tasks.total}
            subtitle={`${stats.tasks.pending} معلقة`}
            color="#3b82f6"
            icon="📋"
          />
          <StatCard 
            title="الحضور اليوم" 
            value={`${stats.attendance.rate}%`}
            subtitle={`${stats.attendance.present} حاضر`}
            color="#10b981"
            icon="✅"
          />
          {isAdmin && stats.hrRequests && (
            <StatCard 
              title="طلبات HR" 
              value={stats.hrRequests.pending}
              subtitle="بانتظار المراجعة"
              color="#f59e0b"
              icon="📝"
            />
          )}
          {stats.leaves && (
            <StatCard 
              title="رصيد الإجازات" 
              value={stats.leaves.balance}
              subtitle={`${stats.leaves.pending} طلب معلق`}
              color="#8b5cf6"
              icon="🏖️"
            />
          )}
        </div>
      )}

      {/* Recent Tasks */}
      {tasks.length > 0 && (
        <div style={{ 
          background: 'white', 
          borderRadius: '16px', 
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b' }}>
              المهام الأخيرة
            </h2>
            <Link href="/tasks" style={{ 
              color: '#3b82f6', 
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              عرض الكل ←
            </Link>
          </div>
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
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f1f5f9';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                <div>
                  <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
                    {task.title}
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b' }}>
                    {task.dueDate ? `مطلوب: ${new Date(task.dueDate).toLocaleDateString('ar-SA')}` : ''}
                  </div>
                </div>
                <StatusBadge status={task.status} />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ActionCard({ href, icon, title, color }: { href: string; icon: string; title: string; color: string }) {
  return (
    <Link 
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '20px',
        background: 'white',
        borderRadius: '16px',
        textDecoration: 'none',
        color: '#1e293b',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #e2e8f0',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
      }}
    >
      <div style={{ 
        fontSize: '32px',
        width: '56px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `${color}15`,
        borderRadius: '12px'
      }}>
        {icon}
      </div>
      <div style={{ fontWeight: '600', fontSize: '16px' }}>{title}</div>
    </Link>
  );
}

function StatCard({ title, value, subtitle, color, icon }: any) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #e2e8f0'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>
            {title}
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
            {value}
          </div>
          <div style={{ fontSize: '14px', color: '#64748b' }}>
            {subtitle}
          </div>
        </div>
        <div style={{
          fontSize: '28px',
          width: '48px',
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `${color}15`,
          borderRadius: '12px'
        }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string; label: string }> = {
    PENDING: { bg: '#fef3c7', text: '#92400e', label: 'معلقة' },
    IN_PROGRESS: { bg: '#dbeafe', text: '#1e40af', label: 'قيد التنفيذ' },
    COMPLETED: { bg: '#d1fae5', text: '#065f46', label: 'مكتملة' },
    CANCELLED: { bg: '#fee2e2', text: '#991b1b', label: 'ملغاة' }
  };
  
  const style = colors[status] || colors.PENDING;
  
  return (
    <span style={{
      padding: '6px 12px',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: '600',
      background: style.bg,
      color: style.text
    }}>
      {style.label}
    </span>
  );
}
