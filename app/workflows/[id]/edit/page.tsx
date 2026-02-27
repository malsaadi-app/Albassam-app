'use client';
import { PageHeader } from '@/components/ui/PageHeader';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineArrowLeft
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
  stages: Stage[];
}

export default function EditWorkflowPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'HR',
    active: true
  });
  const [stages, setStages] = useState<Stage[]>([]);
  const [saving, setSaving] = useState(false);

  const workflowTypes = [
    { value: 'HR', label: 'موارد بشرية' },
    { value: 'PROCUREMENT', label: 'مشتريات' },
    { value: 'MAINTENANCE', label: 'صيانة' },
    { value: 'TASK', label: 'مهام' }
  ];

  useEffect(() => {
    fetchWorkflow();
  }, [params.id]);

  const fetchWorkflow = async () => {
    try {
      // Mock data
      const mockWorkflows: Record<string, Workflow> = {
        '1': {
          id: '1',
          name: 'سير عمل طلبات الموارد البشرية',
          description: 'إدارة طلبات الإجازات والتعديلات والتظلمات',
          type: 'HR',
          active: true,
          stages: [
            { id: 's1', name: 'تقديم الطلب', order: 1 },
            { id: 's2', name: 'مراجعة المدير المباشر', order: 2 },
            { id: 's3', name: 'مراجعة الموارد البشرية', order: 3 },
            { id: 's4', name: 'اعتماد مدير الموارد البشرية', order: 4 },
            { id: 's5', name: 'اعتماد نهائي', order: 5 }
          ]
        },
        '2': {
          id: '2',
          name: 'سير عمل طلبات الشراء',
          description: 'إدارة طلبات الشراء والاعتمادات',
          type: 'PROCUREMENT',
          active: true,
          stages: [
            { id: 's1', name: 'تقديم طلب الشراء', order: 1 },
            { id: 's2', name: 'مراجعة المدير', order: 2 },
            { id: 's3', name: 'تقييم المشتريات', order: 3 },
            { id: 's4', name: 'طلب عروض أسعار', order: 4 },
            { id: 's5', name: 'المقارنة والترسية', order: 5 },
            { id: 's6', name: 'اعتماد مدير المشتريات', order: 6 },
            { id: 's7', name: 'اعتماد الإدارة العليا', order: 7 }
          ]
        },
        '3': {
          id: '3',
          name: 'سير عمل طلبات الصيانة',
          description: 'إدارة طلبات الصيانة والإصلاح',
          type: 'MAINTENANCE',
          active: true,
          stages: [
            { id: 's1', name: 'تقديم طلب الصيانة', order: 1 },
            { id: 's2', name: 'فحص الطلب', order: 2 },
            { id: 's3', name: 'تعيين فني', order: 3 },
            { id: 's4', name: 'إكمال الصيانة', order: 4 }
          ]
        }
      };

      const workflow = mockWorkflows[params.id as string];
      if (workflow) {
        setFormData({
          name: workflow.name,
          description: workflow.description,
          type: workflow.type,
          active: workflow.active
        });
        setStages(workflow.stages);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching workflow:', error);
      setLoading(false);
    }
  };

  const addStage = () => {
    const newStage: Stage = {
      id: `new-${Date.now()}`,
      name: '',
      order: stages.length + 1
    };
    setStages([...stages, newStage]);
  };

  const removeStage = (id: string) => {
    if (stages.length === 1) {
      alert('يجب أن يحتوي سير العمل على مرحلة واحدة على الأقل');
      return;
    }
    setStages(stages.filter(s => s.id !== id).map((s, idx) => ({ ...s, order: idx + 1 })));
  };

  const updateStage = (id: string, name: string) => {
    setStages(stages.map(s => s.id === id ? { ...s, name } : s));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      alert('يرجى إدخال اسم سير العمل');
      return;
    }
    
    if (!formData.description.trim()) {
      alert('يرجى إدخال وصف سير العمل');
      return;
    }

    const emptyStages = stages.filter(s => !s.name.trim());
    if (emptyStages.length > 0) {
      alert('يرجى تعبئة جميع أسماء المراحل');
      return;
    }

    setSaving(true);
    
    try {
      // TODO: إرسال البيانات للـ API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('تم تحديث سير العمل بنجاح! ✅\n\nملاحظة: هذه نسخة تجريبية، سيتم ربطها بقاعدة البيانات قريباً.');
      router.push(`/workflows/${params.id}`);
    } catch (error) {
      console.error('Error updating workflow:', error);
      alert('حدث خطأ أثناء تحديث سير العمل');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{ fontSize: '14px', color: '#6B7280' }}>جاري التحميل...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!formData.name) {
    return (
      <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
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
            <button
              onClick={() => router.push('/workflows')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <HiOutlineArrowLeft size={18} />
              العودة للقائمة
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <PageHeader
          title="تعديل سير العمل"
          breadcrumbs={['الرئيسية', 'سير العمل', formData.name, 'تعديل']}
        />

        <form onSubmit={handleSubmit}>
          {/* Basic Info Card */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            border: '1px solid #E5E7EB'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '20px' }}>
              المعلومات الأساسية
            </h3>

            {/* Name */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px'
              }}>
                اسم سير العمل <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="مثال: سير عمل طلبات الإجازات"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px'
              }}>
                الوصف <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="وصف مختصر عن سير العمل والغرض منه..."
                required
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'vertical',
                  transition: 'border 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
              />
            </div>

            {/* Type and Active */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Type */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  نوع سير العمل <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  {workflowTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Active */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  الحالة
                </label>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: 'white'
                }}>
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    style={{
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer'
                    }}
                  />
                  <span style={{ fontSize: '14px', color: '#374151' }}>
                    نشط
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Stages Card */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            border: '1px solid #E5E7EB'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>
                المراحل <span style={{ color: '#EF4444' }}>*</span>
              </h3>
              <button
                type="button"
                onClick={addStage}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  background: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#2563EB'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#3B82F6'}
              >
                <HiOutlinePlus size={18} />
                إضافة مرحلة
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stages.map((stage, index) => (
                <div
                  key={stage.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px',
                    background: '#F9FAFB',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB'
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#3B82F6',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: '700',
                    flexShrink: 0
                  }}>
                    {index + 1}
                  </div>
                  <input
                    type="text"
                    value={stage.name}
                    onChange={(e) => updateStage(stage.id, e.target.value)}
                    placeholder={`المرحلة ${index + 1}`}
                    required
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      background: 'white'
                    }}
                  />
                  {stages.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStage(stage.id)}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        border: '1px solid #FCA5A5',
                        background: '#FEE2E2',
                        color: '#DC2626',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flexShrink: 0,
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#FEE2E2';
                        e.currentTarget.style.borderColor = '#DC2626';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#FEE2E2';
                        e.currentTarget.style.borderColor = '#FCA5A5';
                      }}
                    >
                      <HiOutlineTrash size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div style={{
              marginTop: '16px',
              padding: '12px 16px',
              background: '#FEF3C7',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#92400E'
            }}>
              💡 <strong>ملاحظة:</strong> يمكنك إضافة أو حذف المراحل. الترتيب يحدد تسلسل المراحل في سير العمل.
            </div>
          </div>

          {/* Actions */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={() => router.back()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: 'white',
                color: '#6B7280',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
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
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 32px',
                background: saving ? '#9CA3AF' : '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!saving) e.currentTarget.style.background = '#2563EB';
              }}
              onMouseLeave={(e) => {
                if (!saving) e.currentTarget.style.background = '#3B82F6';
              }}
            >
              {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
