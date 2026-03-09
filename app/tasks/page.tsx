'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Stats } from '@/components/ui/Stats';
import { Badge } from '@/components/ui/Badge';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { type ChecklistItem } from './ChecklistEditor';
import ReactSelect from 'react-select';
import { useToast } from '@/components/Toast';

// Dynamic imports for heavy components (lazy loading)
const TaskAttachments = dynamic(() => import('./TaskAttachments'), {
  loading: () => <div className="text-center py-4 text-gray-500">جاري التحميل...</div>,
  ssr: false,
});

const CommentList = dynamic(() => import('./CommentList'), {
  loading: () => <div className="text-center py-4 text-gray-500">جاري التحميل...</div>,
  ssr: false,
});

const Timeline = dynamic(() => import('./Timeline'), {
  loading: () => <div className="text-center py-4 text-gray-500">جاري التحميل...</div>,
  ssr: false,
});

const ChecklistEditor = dynamic(() => import('./ChecklistEditor'), {
  loading: () => <div className="text-center py-4 text-gray-500">جاري التحميل...</div>,
  ssr: false,
});

const ChecklistDisplay = dynamic(() => import('./ChecklistDisplay'), {
  loading: () => <div className="text-center py-4 text-gray-500">جاري التحميل...</div>,
  ssr: false,
});

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: 'NEW' | 'IN_PROGRESS' | 'ON_HOLD' | 'DONE';
  category: 'TRANSACTIONS' | 'HR';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
  ownerId: string;
  owner: { username: string };
  isPrivate: boolean;
  attachments: string | null;
  checklist: string | null;
};

type User = {
  id: string;
  username: string;
  role: 'ADMIN' | 'USER';
};

type AvailableUser = {
  id: string;
  username: string;
  displayName: string;
  employee: {
    fullNameAr: string;
    employeeNumber: string;
    position: string;
  } | null;
};

type TaskTemplate = {
  id: string;
  name: string;
  description: string | null;
  category: 'TRANSACTIONS' | 'HR';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  checklist: string | null;
};

export default function TasksPage() {
  const router = useRouter();
  const { showToast, ToastContainer } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<AvailableUser[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [showEditTaskForm, setShowEditTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [view, setView] = useState<'my' | 'team'>('my');
  const [filter, setFilter] = useState<'ALL' | 'NEW' | 'IN_PROGRESS' | 'ON_HOLD' | 'DONE'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'TRANSACTIONS' | 'HR'>('ALL');

  // New task form state
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: 'TRANSACTIONS' as 'TRANSACTIONS' | 'HR',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    isPrivate: false,
    ownerId: '',
  });
  const [newTaskAssignees, setNewTaskAssignees] = useState<string[]>([]);
  const [newTaskChecklist, setNewTaskChecklist] = useState<ChecklistItem[]>([]);
  const [editTaskChecklist, setEditTaskChecklist] = useState<ChecklistItem[]>([]);

  useEffect(() => {
    fetchTasks();
    fetchTemplates();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [view]);

  const fetchTasks = async () => {
    try {
      const res = await fetch(`/api/tasks?view=${view}`);
      if (res.status === 401) {
        router.push('/');
        return;
      }
      const data = await res.json();
      setTasks(data.tasks);
      setUser(data.user);
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    if (!templateId) return;
    
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    setNewTask({
      ...newTask,
      title: template.name,
      description: template.description || '',
      category: template.category,
      priority: template.priority,
    });

    if (template.checklist) {
      try {
        const checklistItems = JSON.parse(template.checklist);
        setNewTaskChecklist(checklistItems);
      } catch (e) {
        console.error('Failed to parse template checklist');
      }
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...newTask,
        checklist: newTaskChecklist.length > 0 ? JSON.stringify(newTaskChecklist) : null,
        assigneeIds: newTaskAssignees,
      };

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast('تم إنشاء المهمة بنجاح ✅', 'success');
        setShowNewTaskForm(false);
        setNewTask({
          title: '',
          description: '',
          category: 'TRANSACTIONS',
          priority: 'MEDIUM',
          isPrivate: false,
          ownerId: '',
        });
        setNewTaskAssignees([]);
        setNewTaskChecklist([]);
        fetchTasks();
      } else {
        const error = await res.json();
        showToast(error.error || 'فشل إنشاء المهمة ❌', 'error');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      showToast('حدث خطأ أثناء إنشاء المهمة ❌', 'error');
    }
  };

  const handleEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    try {
      const payload: any = {
        taskId: editingTask.id,
        title: editingTask.title,
        description: editingTask.description,
        category: editingTask.category,
        priority: editingTask.priority,
        isPrivate: editingTask.isPrivate,
        ownerId: editingTask.ownerId,
      };

      if (editTaskChecklist.length > 0) {
        payload.checklist = JSON.stringify(editTaskChecklist);
      }

      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast('تم حفظ التعديلات بنجاح ✅', 'success');
        setShowEditTaskForm(false);
        setEditingTask(null);
        setEditTaskChecklist([]);
        fetchTasks();
      } else {
        const error = await res.json();
        showToast(error.error || 'فشل حفظ التعديلات ❌', 'error');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      showToast('حدث خطأ أثناء حفظ التعديلات ❌', 'error');
    }
  };

  const openEditForm = (task: Task) => {
    setEditingTask({ ...task });
    
    if (task.checklist) {
      try {
        const parsedChecklist = JSON.parse(task.checklist);
        setEditTaskChecklist(parsedChecklist);
      } catch (e) {
        setEditTaskChecklist([]);
      }
    } else {
      setEditTaskChecklist([]);
    }
    
    setShowEditTaskForm(true);
  };

  const handleDeleteTask = async (taskId: string, taskTitle: string) => {
    if (!confirm(`هل أنت متأكد من حذف المهمة "${taskTitle}"؟\n\nهذا الإجراء لا يمكن التراجع عنه.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/tasks/${taskId}/delete`, {
        method: 'DELETE'
      });

      if (res.ok) {
        fetchTasks();
      } else {
        const error = await res.json();
        alert(`❌ ${error.error || 'حدث خطأ أثناء الحذف'}`);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('❌ حدث خطأ أثناء الحذف');
    }
  };

  const handleUpdateStatus = async (taskId: string, status: Task['status']) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, status }),
      });

      if (res.ok) {
        fetchTasks();
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter !== 'ALL' && task.status !== filter) return false;
    if (categoryFilter !== 'ALL' && task.category !== categoryFilter) return false;
    return true;
  });

  const getStatusBadge = (status: Task['status']) => {
    const badges: Record<Task['status'], { variant: 'blue' | 'yellow' | 'red' | 'green', text: string }> = {
      NEW: { variant: 'blue', text: 'جديد' },
      IN_PROGRESS: { variant: 'yellow', text: 'قيد التنفيذ' },
      ON_HOLD: { variant: 'red', text: 'بانتظار' },
      DONE: { variant: 'green', text: 'مكتمل' },
    };
    const badge = badges[status];
    return <Badge variant={badge.variant}>{badge.text}</Badge>;
  };

  const getCategoryText = (category: Task['category']) => {
    return category === 'TRANSACTIONS' ? 'معاملات' : 'شؤون الموظفين';
  };

  const getPriorityIcon = (priority: Task['priority']) => {
    const icons = {
      LOW: '🟢',
      MEDIUM: '🟡',
      HIGH: '🔴',
    };
    return icons[priority];
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB' }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #E5E7EB',
          borderTop: '4px solid #3B82F6',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}></div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Page Header */}
        <PageHeader
          title="📝 المهام"
          breadcrumbs={['الرئيسية', 'المهام']}
          actions={
            <Button variant="primary" onClick={() => setShowNewTaskForm(true)}>
              + مهمة جديدة
            </Button>
          }
        />

        {/* View Tabs */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '8px',
          marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          display: 'flex',
          gap: '8px'
        }}>
          <button
            onClick={() => setView('my')}
            style={{
              flex: 1,
              padding: '14px 24px',
              background: view === 'my' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
              color: view === 'my' ? 'white' : '#6B7280',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <span style={{ fontSize: '20px' }}>👤</span>
            <span>مهامي</span>
            <span style={{
              background: view === 'my' ? 'rgba(255, 255, 255, 0.3)' : '#E5E7EB',
              color: view === 'my' ? 'white' : '#374151',
              padding: '2px 10px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '700'
            }}>
              {tasks.length}
            </span>
          </button>

          {user?.role === 'ADMIN' && (
            <button
              onClick={() => setView('team')}
              style={{
                flex: 1,
                padding: '14px 24px',
                background: view === 'team' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                color: view === 'team' ? 'white' : '#6B7280',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '20px' }}>👥</span>
              <span>مهام الفريق</span>
              <span style={{
                background: view === 'team' ? 'rgba(255, 255, 255, 0.3)' : '#E5E7EB',
                color: view === 'team' ? 'white' : '#374151',
                padding: '2px 10px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: '700'
              }}>
                {view === 'team' ? tasks.length : 0}
              </span>
            </button>
          )}
        </div>

        {/* Statistics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          <Stats
            label="جديد"
            value={tasks.filter(t => t.status === 'NEW').length}
            variant="blue"
            icon="📋"
          />
          <Stats
            label="قيد التنفيذ"
            value={tasks.filter(t => t.status === 'IN_PROGRESS').length}
            variant="yellow"
            icon="⚡"
          />
          <Stats
            label="بانتظار"
            value={tasks.filter(t => t.status === 'ON_HOLD').length}
            variant="red"
            icon="⏸️"
          />
          <Stats
            label="مكتمل"
            value={tasks.filter(t => t.status === 'DONE').length}
            variant="green"
            icon="✅"
          />
        </div>

        {/* Filters */}
        <Card variant="default" className="mb-6">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ flex: '1 1 200px' }}>
              <Select
                label="الحالة"
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
              >
                <option value="ALL">كل الحالات</option>
                <option value="NEW">جديد</option>
                <option value="IN_PROGRESS">قيد التنفيذ</option>
                <option value="ON_HOLD">بانتظار</option>
                <option value="DONE">مكتمل</option>
              </Select>
            </div>

            <div style={{ flex: '1 1 200px' }}>
              <Select
                label="القسم"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as any)}
              >
                <option value="ALL">كل الأقسام</option>
                <option value="TRANSACTIONS">معاملات</option>
                <option value="HR">شؤون الموظفين</option>
              </Select>
            </div>
          </div>
        </Card>

        {/* Tasks Grid */}
        {filteredTasks.length === 0 ? (
          <Card variant="default">
            <div style={{ padding: '60px 40px', textAlign: 'center' }}>
              <div style={{ fontSize: '80px', marginBottom: '24px' }}>
                {view === 'my' ? '📭' : '👥'}
              </div>
              <h3 style={{ fontSize: '24px', color: '#111827', fontWeight: '800', marginBottom: '12px' }}>
                {view === 'my' ? 'لا توجد مهام شخصية' : 'لا توجد مهام للفريق'}
              </h3>
              <p style={{ fontSize: '16px', color: '#6B7280', fontWeight: '500' }}>
                {view === 'my' 
                  ? 'قم بإنشاء مهمة جديدة للبدء'
                  : 'جميع مهام الفريق مكتملة أو لا توجد مهام عامة حالياً'
                }
              </p>
            </div>
          </Card>
        ) : (
          <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))' }}>
            {filteredTasks.map((task) => (
              <Card key={task.id} variant="default" hover>
                {/* Task Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', marginBottom: '6px' }}>
                      {task.title}
                    </h3>
                    <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600' }}>
                      {getCategoryText(task.category)}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '24px' }}>{getPriorityIcon(task.priority)}</span>
                    {task.isPrivate && <span style={{ fontSize: '20px' }}>🔒</span>}
                  </div>
                </div>

                {/* Description */}
                {task.description && (
                  <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '16px', lineHeight: '1.6' }}>
                    {task.description.slice(0, 120)}{task.description.length > 120 ? '...' : ''}
                  </p>
                )}

                {/* Owner */}
                {task.owner && (
                  <p style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '12px', fontWeight: '600' }}>
                    👤 {task.owner.username}
                  </p>
                )}

                {/* Status */}
                <div style={{ marginBottom: '16px' }}>
                  {getStatusBadge(task.status)}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                  {user?.role === 'ADMIN' && task.status !== 'DONE' && (
                    <>
                      {task.status === 'NEW' && (
                        <Button
                          size="sm"
                          variant="warning"
                          onClick={() => handleUpdateStatus(task.id, 'IN_PROGRESS')}
                        >
                          ▶️ بدء
                        </Button>
                      )}
                      {task.status === 'IN_PROGRESS' && (
                        <>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleUpdateStatus(task.id, 'ON_HOLD')}
                          >
                            ⏸️ إيقاف
                          </Button>
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => handleUpdateStatus(task.id, 'DONE')}
                          >
                            ✅ إكمال
                          </Button>
                        </>
                      )}
                      {task.status === 'ON_HOLD' && (
                        <Button
                          size="sm"
                          variant="warning"
                          onClick={() => handleUpdateStatus(task.id, 'IN_PROGRESS')}
                        >
                          ▶️ استئناف
                        </Button>
                      )}
                    </>
                  )}

                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => openEditForm(task)}
                  >
                    ✏️ تعديل
                  </Button>

                  {(user?.role === 'ADMIN' || task.ownerId === user?.id) && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDeleteTask(task.id, task.title)}
                    >
                      🗑️ حذف
                    </Button>
                  )}
                </div>

                {/* Checklist */}
                {task.checklist && (
                  <div style={{ marginBottom: '16px' }}>
                    <ChecklistDisplay
                      taskId={task.id}
                      checklist={JSON.parse(task.checklist)}
                      canEdit={user?.role === 'ADMIN' || task.ownerId === user?.id}
                      onUpdate={fetchTasks}
                    />
                  </div>
                )}

                {/* Attachments */}
                <TaskAttachments
                  taskId={task.id}
                  attachments={task.attachments ? JSON.parse(task.attachments) : []}
                  canEdit={user?.role === 'ADMIN' || task.ownerId === user?.id}
                  onAttachmentsChange={fetchTasks}
                />

                {/* Comments */}
                <CommentList taskId={task.id} />

                {/* Timeline */}
                <Timeline taskId={task.id} />

                {/* Footer */}
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E5E7EB' }}>
                  <p style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: '600' }}>
                    📅 {new Date(task.createdAt).toLocaleDateString('ar-SA')}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* New Task Modal */}
      {showNewTaskForm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          zIndex: 50,
          backdropFilter: 'blur(4px)'
        }}>
          <Card variant="elevated" style={{
            maxWidth: '700px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#111827', margin: 0 }}>
                📝 إنشاء مهمة جديدة
              </h2>
              <button
                onClick={() => setShowNewTaskForm(false)}
                style={{
                  fontSize: '32px',
                  color: '#9CA3AF',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  lineHeight: 1,
                  padding: 0
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Template Selector */}
              {templates.length > 0 && (
                <Select
                  label="استخدام قالب (اختياري)"
                  onChange={(e) => handleTemplateSelect(e.target.value)}
                  defaultValue=""
                >
                  <option value="">-- اختر قالباً --</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>{template.name}</option>
                  ))}
                </Select>
              )}

              <Input
                label="عنوان المهمة"
                required
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              />

              <Textarea
                label="الوصف"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                rows={3}
              />

              <Select
                label="القسم"
                required
                value={newTask.category}
                onChange={(e) => setNewTask({ ...newTask, category: e.target.value as any })}
              >
                <option value="TRANSACTIONS">معاملات</option>
                <option value="HR">شؤون الموظفين</option>
              </Select>

              <Select
                label="الأولوية"
                required
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
              >
                <option value="LOW">منخفضة 🟢</option>
                <option value="MEDIUM">متوسطة 🟡</option>
                <option value="HIGH">عالية 🔴</option>
              </Select>

              {/* Checklist */}
              <ChecklistEditor
                checklist={newTaskChecklist}
                onChange={setNewTaskChecklist}
              />

              {/* Assignees (Admin only) - Multi-Select */}
              {user?.role === 'ADMIN' && users.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    إحالة المهمة إلى (يمكن اختيار أكثر من موظف)
                  </label>
                  <ReactSelect
                    instanceId="new-task-assignees"
                    placeholder="اختر موظف أو أكثر..."
                    isMulti
                    isSearchable
                    options={users.map((u) => ({
                      value: u.id,
                      label: u.employee?.fullNameAr || u.displayName || u.username,
                      subtitle: u.employee ? `${u.employee.position} - ${u.employee.employeeNumber}` : u.username
                    }))}
                    value={users
                      .filter(u => newTaskAssignees.includes(u.id))
                      .map(u => ({
                        value: u.id,
                        label: u.employee?.fullNameAr || u.displayName || u.username,
                        subtitle: u.employee ? `${u.employee.position} - ${u.employee.employeeNumber}` : u.username
                      }))
                    }
                    onChange={(selected) => {
                      setNewTaskAssignees(selected ? selected.map((s: any) => s.value) : []);
                    }}
                    formatOptionLabel={({ value, label, subtitle }: any) => {
                      const isSelected = newTaskAssignees.includes(value);
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '4px 0' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            style={{
                              width: '18px',
                              height: '18px',
                              cursor: 'pointer',
                              accentColor: '#3B82F6'
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600', color: '#111827' }}>{label}</div>
                            {subtitle && <div style={{ fontSize: '12px', color: '#6B7280' }}>{subtitle}</div>}
                          </div>
                        </div>
                      );
                    }}
                    styles={{
                      control: (base) => ({
                        ...base,
                        minHeight: '44px',
                        borderRadius: '8px',
                        borderColor: '#D1D5DB',
                        '&:hover': { borderColor: '#9CA3AF' }
                      }),
                      menu: (base) => ({
                        ...base,
                        zIndex: 9999,
                        borderRadius: '8px',
                        overflow: 'hidden'
                      })
                    }}
                  />
                  <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '6px' }}>
                    💡 يمكنك اختيار موظف واحد أو عدة موظفين لتعيين المهمة لهم جميعاً
                  </div>
                </div>
              )}

              {/* Private checkbox */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                background: '#F9FAFB',
                borderRadius: '12px',
                border: '2px solid #E5E7EB'
              }}>
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={newTask.isPrivate}
                  onChange={(e) => setNewTask({ ...newTask, isPrivate: e.target.checked })}
                  style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#3B82F6' }}
                />
                <label htmlFor="isPrivate" style={{ fontSize: '15px', color: '#374151', fontWeight: '600', cursor: 'pointer' }}>
                  🔒 مهمة خاصة (للموظف فقط)
                </label>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
                <Button type="submit" variant="primary" size="lg" style={{ flex: 1 }}>
                  إنشاء المهمة
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => setShowNewTaskForm(false)}
                  style={{ flex: 1 }}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Edit Task Modal */}
      {showEditTaskForm && editingTask && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          zIndex: 50,
          backdropFilter: 'blur(4px)'
        }}>
          <Card variant="elevated" style={{
            maxWidth: '700px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#111827', margin: 0 }}>
                ✏️ تعديل المهمة
              </h2>
              <button
                onClick={() => {
                  setShowEditTaskForm(false);
                  setEditingTask(null);
                  setEditTaskChecklist([]);
                }}
                style={{
                  fontSize: '32px',
                  color: '#9CA3AF',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  lineHeight: 1,
                  padding: 0
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEditTask} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <Input
                label="عنوان المهمة"
                required
                value={editingTask.title}
                onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
              />

              <Textarea
                label="الوصف"
                value={editingTask.description || ''}
                onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                rows={3}
              />

              <Select
                label="القسم"
                required
                value={editingTask.category}
                onChange={(e) => setEditingTask({ ...editingTask, category: e.target.value as any })}
              >
                <option value="TRANSACTIONS">معاملات</option>
                <option value="HR">شؤون الموظفين</option>
              </Select>

              <Select
                label="الأولوية"
                required
                value={editingTask.priority}
                onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as any })}
              >
                <option value="LOW">منخفضة 🟢</option>
                <option value="MEDIUM">متوسطة 🟡</option>
                <option value="HIGH">عالية 🔴</option>
              </Select>

              {/* Checklist */}
              <ChecklistEditor
                checklist={editTaskChecklist}
                onChange={setEditTaskChecklist}
              />

              {/* Owner (Admin only) */}
              {user?.role === 'ADMIN' && users.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    إحالة المهمة إلى
                  </label>
                  <ReactSelect
                    instanceId="edit-task-owner"
                    placeholder="اختر موظف..."
                    isSearchable
                    options={users.map((u) => ({
                      value: u.id,
                      label: u.employee?.fullNameAr || u.displayName || u.username,
                      subtitle: u.employee ? `${u.employee.position} - ${u.employee.employeeNumber}` : u.username
                    }))}
                    value={{
                      value: editingTask.ownerId,
                      label: users.find(u => u.id === editingTask.ownerId)?.employee?.fullNameAr || 
                             users.find(u => u.id === editingTask.ownerId)?.displayName || 
                             users.find(u => u.id === editingTask.ownerId)?.username || 
                             editingTask.ownerId
                    }}
                    onChange={(selected) => {
                      if (selected) {
                        setEditingTask({ ...editingTask, ownerId: selected.value });
                      }
                    }}
                    formatOptionLabel={({ label, subtitle }: any) => (
                      <div>
                        <div style={{ fontWeight: '600', color: '#111827' }}>{label}</div>
                        {subtitle && <div style={{ fontSize: '12px', color: '#6B7280' }}>{subtitle}</div>}
                      </div>
                    )}
                    styles={{
                      control: (base) => ({
                        ...base,
                        minHeight: '44px',
                        borderRadius: '8px',
                        borderColor: '#D1D5DB',
                        '&:hover': { borderColor: '#9CA3AF' }
                      }),
                      menu: (base) => ({
                        ...base,
                        zIndex: 9999,
                        borderRadius: '8px',
                        overflow: 'hidden'
                      })
                    }}
                  />
                </div>
              )}

              {/* Private checkbox (Admin only) */}
              {user?.role === 'ADMIN' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  background: '#F9FAFB',
                  borderRadius: '12px',
                  border: '2px solid #E5E7EB'
                }}>
                  <input
                    type="checkbox"
                    id="editIsPrivate"
                    checked={editingTask.isPrivate}
                    onChange={(e) => setEditingTask({ ...editingTask, isPrivate: e.target.checked })}
                    style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#3B82F6' }}
                  />
                  <label htmlFor="editIsPrivate" style={{ fontSize: '15px', color: '#374151', fontWeight: '600', cursor: 'pointer' }}>
                    🔒 مهمة خاصة (للموظف فقط)
                  </label>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
                <Button type="submit" variant="primary" size="lg" style={{ flex: 1 }}>
                  حفظ التعديلات
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setShowEditTaskForm(false);
                    setEditingTask(null);
                    setEditTaskChecklist([]);
                  }}
                  style={{ flex: 1 }}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}
