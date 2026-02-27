'use client';
import { PageHeader } from '@/components/ui/PageHeader';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineArrowLeft,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineDocumentDuplicate
} from 'react-icons/hi';

interface Stage {
  id: string;
  name: string;
  order: number;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  type: string;
  active: boolean;
  createdAt: string;
  stages: Stage[];
}

export default function ViewWorkflowPage() {
  const params = useParams();
  const router = useRouter();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkflow();
  }, [params.id]);

  const fetchWorkflow = async () => {
    try {
      const res = await fetch(`/api/workflows/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        const w = data.workflow;
        setWorkflow({
          id: w.id,
          name: w.name,
          description: w.description || '',
          type: w.type,
          active: w.isActive,
          createdAt: w.createdAt,
          stages: w.steps.map((step: any, index: number) => ({
            id: step.id,
            name: step.name,
            order: step.order
          }))
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching workflow:', error);
      setLoading(false);
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

  const handleClone = async () => {
    if (!confirm('هل تريد نسخ سير العمل هذا؟\n\nسيتم إنشاء نسخة طبق الأصل يمكنك تعديلها.')) {
      return;
    }

    try {
      const res = await fetch(`/api/workflows/${params.id}/clone`, {
        method: 'POST'
      });

      if (res.ok) {
        const data = await res.json();
        alert('تم نسخ سير العمل بنجاح! ✅\n\nسيتم نقلك لصفحة التعديل.');
        router.push(`/workflows/${data.workflow.id}/edit`);
      } else {
        const error = await res.json();
        alert(`حدث خطأ: ${error.error || 'فشل في نسخ سير العمل'}`);
      }
    } catch (error) {
      console.error('Error cloning workflow:', error);
      alert('حدث خطأ أثناء نسخ سير العمل');
    }
  };

  const handleDelete = async () => {
    if (!confirm('هل أنت متأكد من حذف سير العمل هذا؟\n\nسيتم حذف جميع المراحل المرتبطة به.')) {
      return;
    }

    try {
      // TODO: إرسال طلب حذف للـ API
      alert('تم حذف سير العمل بنجاح! ✅\n\nملاحظة: هذه نسخة تجريبية.');
      router.push('/workflows');
    } catch (error) {
      console.error('Error deleting workflow:', error);
      alert('حدث خطأ أثناء حذف سير العمل');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{ fontSize: '14px', color: '#6B7280' }}>جاري التحميل...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '60px 24px',
            textAlign: 'center',
            border: '1px solid #E5E7EB'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>❌</div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '12px' }}>
              سير العمل غير موجود
            </h2>
            <p style={{ fontSize: '16px', color: '#6B7280', marginBottom: '24px' }}>
              عذراً، لم يتم العثور على سير العمل المطلوب
            </p>
            <Link
              href="/workflows"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: '#3B82F6',
                color: 'white',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              <HiOutlineArrowLeft size={18} />
              العودة للقائمة
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <PageHeader
          title={workflow.name}
          breadcrumbs={['الرئيسية', 'سير العمل', workflow.name]}
        />

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
          justifyContent: 'flex-end',
          flexWrap: 'wrap'
        }}>
          <Link
            href="/workflows"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: 'white',
              color: '#6B7280',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F9FAFB';
              e.currentTarget.style.borderColor = '#9CA3AF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.borderColor = '#D1D5DB';
            }}
          >
            <HiOutlineArrowLeft size={18} />
            العودة للقائمة
          </Link>
          <Link
            href={`/workflows/${workflow.id}/edit`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#2563EB'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#3B82F6'}
          >
            <HiOutlinePencil size={18} />
            تعديل
          </Link>
          <button
            onClick={handleClone}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: '#10B981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#10B981'}
          >
            <HiOutlineDocumentDuplicate size={18} />
            نسخ
          </button>
          <button
            onClick={handleDelete}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: '#EF4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#DC2626'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#EF4444'}
          >
            <HiOutlineTrash size={18} />
            حذف
          </button>
        </div>

        {/* Workflow Info */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          border: '1px solid #E5E7EB'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '20px' }}>
            معلومات سير العمل
          </h3>

          <div style={{ display: 'grid', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '6px' }}>
                الاسم
              </div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>
                {workflow.name}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '6px' }}>
                الوصف
              </div>
              <div style={{ fontSize: '15px', color: '#111827' }}>
                {workflow.description}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '6px' }}>
                  النوع
                </div>
                <div style={{ display: 'inline-block' }}>
                  <span style={{
                    background: getTypeColor(workflow.type),
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: '600',
                    padding: '6px 14px',
                    borderRadius: '8px'
                  }}>
                    {getTypeLabel(workflow.type)}
                  </span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '6px' }}>
                  الحالة
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {workflow.active ? (
                    <>
                      <HiOutlineCheck size={20} style={{ color: '#10B981' }} />
                      <span style={{ fontSize: '15px', color: '#10B981', fontWeight: '600' }}>
                        نشط
                      </span>
                    </>
                  ) : (
                    <>
                      <HiOutlineX size={20} style={{ color: '#EF4444' }} />
                      <span style={{ fontSize: '15px', color: '#EF4444', fontWeight: '600' }}>
                        غير نشط
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '6px' }}>
                  تاريخ الإنشاء
                </div>
                <div style={{ fontSize: '15px', color: '#111827' }}>
                  {new Date(workflow.createdAt).toLocaleDateString('ar-SA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '6px' }}>
                  عدد المراحل
                </div>
                <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>
                  {workflow.stages.length} مرحلة
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stages */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #E5E7EB'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '20px' }}>
            المراحل ({workflow.stages.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {workflow.stages.map((stage, index) => (
              <div
                key={stage.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '20px',
                  background: '#F9FAFB',
                  borderRadius: '12px',
                  border: '1px solid #E5E7EB'
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: '700',
                  flexShrink: 0
                }}>
                  {stage.order}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                    {stage.name}
                  </div>
                  <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
                    المرحلة رقم {stage.order}
                  </div>
                </div>
                {index < workflow.stages.length - 1 && (
                  <div style={{
                    fontSize: '24px',
                    color: '#D1D5DB'
                  }}>
                    ←
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
