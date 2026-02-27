'use client';
import { PageHeader } from '@/components/ui/PageHeader';
import Link from 'next/link';
import {
  HiOutlineClipboardList,
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineDocumentDuplicate
} from 'react-icons/hi';
import { useState, useEffect } from 'react';

interface Workflow {
  id: string;
  name: string;
  description: string;
  type: string;
  stagesCount: number;
  active: boolean;
  createdAt: string;
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const res = await fetch('/api/workflows');
      if (res.ok) {
        const data = await res.json();
        const formattedWorkflows = data.workflows.map((w: any) => ({
          id: w.id,
          name: w.name,
          description: w.description || '',
          type: w.type,
          stagesCount: w.steps?.length || 0,
          active: w.isActive,
          createdAt: w.createdAt
        }));
        setWorkflows(formattedWorkflows);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching workflows:', error);
      setLoading(false);
    }
  };

  const handleDelete = async (workflowId: string, workflowName: string) => {
    if (!confirm(`هل أنت متأكد من حذف سير العمل:\n"${workflowName}"\n\nسيتم حذف جميع المراحل المرتبطة به.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/workflows/${workflowId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        alert('تم حذف سير العمل بنجاح! ✅');
        // Refresh list
        fetchWorkflows();
      } else {
        const error = await res.json();
        alert(`حدث خطأ: ${error.error || 'فشل في حذف سير العمل'}`);
      }
    } catch (error) {
      console.error('Error deleting workflow:', error);
      alert('حدث خطأ أثناء حذف سير العمل');
    }
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      HR: 'موارد بشرية',
      PROCUREMENT: 'مشتريات',
      MAINTENANCE: 'صيانة',
      TASK: 'مهام'
    };
    return types[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      HR: '#10B981',
      PROCUREMENT: '#3B82F6',
      MAINTENANCE: '#F59E0B',
      TASK: '#6366F1'
    };
    return colors[type] || '#6B7280';
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <PageHeader
          title="إدارة سير العمل"
          breadcrumbs={['الرئيسية', 'سير العمل']}
        />

        {/* Add Button */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <Link
            href="/workflows/new"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#3B82F6',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#2563EB'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#3B82F6'}
          >
            <HiOutlinePlus size={20} />
            إضافة سير عمل جديد
          </Link>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #E5E7EB'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <HiOutlineClipboardList size={20} />
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: '700', color: '#111827' }}>
                  {workflows.length}
                </div>
                <div style={{ fontSize: '13px', color: '#6B7280' }}>
                  إجمالي سير العمل
                </div>
              </div>
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #E5E7EB'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                ✓
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: '700', color: '#111827' }}>
                  {workflows.filter(w => w.active).length}
                </div>
                <div style={{ fontSize: '13px', color: '#6B7280' }}>
                  سير عمل نشط
                </div>
              </div>
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #E5E7EB'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '20px'
              }}>
                #
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: '700', color: '#111827' }}>
                  {workflows.reduce((sum, w) => sum + w.stagesCount, 0)}
                </div>
                <div style={{ fontSize: '13px', color: '#6B7280' }}>
                  إجمالي المراحل
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Workflows List */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>
              قائمة سير العمل
            </h2>
          </div>

          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: '#6B7280' }}>جاري التحميل...</div>
            </div>
          ) : workflows.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                لا يوجد سير عمل
              </h3>
              <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
                ابدأ بإنشاء سير عمل جديد لإدارة العمليات
              </p>
              <Link
                href="/workflows/new"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#3B82F6',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                <HiOutlinePlus size={20} />
                إضافة سير عمل جديد
              </Link>
            </div>
          ) : (
            <div style={{ padding: '0' }}>
              {workflows.map((workflow, index) => (
                <div
                  key={workflow.id}
                  style={{
                    padding: '20px 24px',
                    borderBottom: index < workflows.length - 1 ? '1px solid #E5E7EB' : 'none',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                          {workflow.name}
                        </h3>
                        <span style={{
                          background: getTypeColor(workflow.type),
                          color: 'white',
                          fontSize: '11px',
                          fontWeight: '600',
                          padding: '4px 10px',
                          borderRadius: '12px'
                        }}>
                          {getTypeLabel(workflow.type)}
                        </span>
                        {workflow.active && (
                          <span style={{
                            background: '#D1FAE5',
                            color: '#065F46',
                            fontSize: '11px',
                            fontWeight: '600',
                            padding: '4px 10px',
                            borderRadius: '12px'
                          }}>
                            نشط
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '12px' }}>
                        {workflow.description}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: '#6B7280' }}>
                        <span>
                          <strong>{workflow.stagesCount}</strong> مرحلة
                        </span>
                        <span>•</span>
                        <span>
                          تم الإنشاء في {new Date(workflow.createdAt).toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <Link
                        href={`/workflows/${workflow.id}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          border: '1px solid #E5E7EB',
                          background: 'white',
                          color: '#6B7280',
                          textDecoration: 'none',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#3B82F6';
                          e.currentTarget.style.color = '#3B82F6';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#E5E7EB';
                          e.currentTarget.style.color = '#6B7280';
                        }}
                        title="عرض"
                      >
                        <HiOutlineEye size={18} />
                      </Link>
                      <Link
                        href={`/workflows/${workflow.id}/edit`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          border: '1px solid #E5E7EB',
                          background: 'white',
                          color: '#6B7280',
                          textDecoration: 'none',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#F59E0B';
                          e.currentTarget.style.color = '#F59E0B';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#E5E7EB';
                          e.currentTarget.style.color = '#6B7280';
                        }}
                        title="تعديل"
                      >
                        <HiOutlinePencil size={18} />
                      </Link>
                      <button
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          border: '1px solid #E5E7EB',
                          background: 'white',
                          color: '#6B7280',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#EF4444';
                          e.currentTarget.style.color = '#EF4444';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#E5E7EB';
                          e.currentTarget.style.color = '#6B7280';
                        }}
                        title="حذف"
                        onClick={() => handleDelete(workflow.id, workflow.name)}
                      >
                        <HiOutlineTrash size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          marginTop: '24px',
          border: '1px solid #E5E7EB'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '16px' }}>
            إجراءات سريعة
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <Link
              href="/workflows/stages"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                textDecoration: 'none',
                color: '#111827',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3B82F6';
                e.currentTarget.style.background = '#EFF6FF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E5E7EB';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: '#EFF6FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3B82F6'
              }}>
                #
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>إدارة المراحل</div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>عرض وتعديل المراحل</div>
              </div>
            </Link>

            <Link
              href="/settings/roles"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                textDecoration: 'none',
                color: '#111827',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#10B981';
                e.currentTarget.style.background = '#ECFDF5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E5E7EB';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: '#ECFDF5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10B981',
                fontSize: '20px'
              }}>
                🔑
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>الصلاحيات</div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>إدارة الأدوار</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
