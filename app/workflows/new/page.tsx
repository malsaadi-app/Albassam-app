'use client';
import { PageHeader } from '@/components/ui/PageHeader';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineArrowLeft,
  HiOutlineUserGroup,
  HiOutlineUser,
  HiOutlineShieldCheck,
  HiOutlineBriefcase
} from 'react-icons/hi';

interface Stage {
  id: string;
  name: string;
  order: number;
  approverType: 'SPECIFIC_USER' | 'ROLE' | 'DIRECT_MANAGER' | 'SYSTEM_ROLE';
  approverUserId?: string;
  approverRoleId?: string;
  approverSystemRole?: string;
  allowReject: boolean;
  autoEscalateDays?: number;
  notifyOnEntry: boolean;
  notifyOnApproval: boolean;
  notifyOnReject: boolean;
}

interface Branch {
  id: string;
  name: string;
  type: string;
}

interface SchoolStage {
  id: string;
  name: string;
  branchId: string;
  branch?: {
    id: string;
    name: string;
    type: string;
  };
}

interface WorkflowRole {
  id: string;
  slug: string;
  nameAr: string;
  level: string;
}

interface Employee {
  id: string;
  fullName: string;
  jobTitle?: string;
}

export default function NewWorkflowPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'HR',
    forSpecificTypes: [] as string[],
    isActive: true
  });
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [schoolStages, setSchoolStages] = useState<SchoolStage[]>([]);
  const [stages, setStages] = useState<Stage[]>([
    {
      id: '1',
      name: '',
      order: 1,
      approverType: 'ROLE',
      allowReject: true,
      notifyOnEntry: true,
      notifyOnApproval: true,
      notifyOnReject: true
    }
  ]);
  const [saving, setSaving] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [workflowRoles, setWorkflowRoles] = useState<WorkflowRole[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const workflowTypes = [
    { value: 'HR', label: 'موارد بشرية' },
    { value: 'PROCUREMENT', label: 'مشتريات' },
    { value: 'MAINTENANCE', label: 'صيانة' },
    { value: 'TASK', label: 'مهام' }
  ];

  const specificTypes: Record<string, { value: string; label: string }[]> = {
    HR: [
      { value: '', label: 'جميع طلبات الموارد البشرية' },
      { value: 'LEAVE_REQUEST', label: 'طلب إجازة' },
      { value: 'ATTENDANCE_CORRECTION', label: 'تصحيح حضور' },
      { value: 'EMPLOYEE_TRANSFER', label: 'نقل موظف' },
      { value: 'PROMOTION_REQUEST', label: 'طلب ترقية' },
      { value: 'RESIGNATION', label: 'استقالة' },
      { value: 'LOAN_REQUEST', label: 'طلب سلفة' },
      { value: 'TRAINING_REQUEST', label: 'طلب تدريب' }
    ],
    PROCUREMENT: [
      { value: '', label: 'جميع طلبات المشتريات' },
      { value: 'PURCHASE_NORMAL', label: 'طلب شراء عادي' },
      { value: 'PURCHASE_URGENT', label: 'طلب شراء عاجل' },
      { value: 'PURCHASE_CAPITAL', label: 'شراء أصول رأسمالية' },
      { value: 'SERVICE_CONTRACT', label: 'عقد خدمات' },
      { value: 'SUPPLIER_APPROVAL', label: 'اعتماد مورد جديد' }
    ],
    MAINTENANCE: [
      { value: '', label: 'جميع طلبات الصيانة' },
      { value: 'MAINTENANCE_NORMAL', label: 'صيانة عادية' },
      { value: 'MAINTENANCE_URGENT', label: 'صيانة عاجلة' },
      { value: 'MAINTENANCE_PREVENTIVE', label: 'صيانة وقائية' },
      { value: 'ASSET_REPLACEMENT', label: 'استبدال أصل' }
    ],
    TASK: [
      { value: '', label: 'جميع المهام' }
    ]
  };

  const approverTypes = [
    { value: 'ROLE', label: 'دور سير عمل', icon: <HiOutlineBriefcase size={18} /> },
    { value: 'SPECIFIC_USER', label: 'موظف محدد', icon: <HiOutlineUser size={18} /> },
    { value: 'DIRECT_MANAGER', label: 'المدير المباشر', icon: <HiOutlineUserGroup size={18} /> },
    { value: 'SYSTEM_ROLE', label: 'دور نظام', icon: <HiOutlineShieldCheck size={18} /> }
  ];

  const systemRoles = [
    { value: 'ADMIN', label: 'مدير النظام' },
    { value: 'HR_MANAGER', label: 'مدير الموارد البشرية' },
    { value: 'FINANCE_MANAGER', label: 'مدير المالية' },
    { value: 'PROCUREMENT_MANAGER', label: 'مدير المشتريات' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch branches
      const branchesRes = await fetch('/api/branches');
      if (branchesRes.ok) {
        const branchesData = await branchesRes.json();
        setBranches(Array.isArray(branchesData) ? branchesData : []);
      }

      // Fetch workflow roles
      const rolesRes = await fetch('/api/workflows/roles');
      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        setWorkflowRoles(rolesData.roles || []);
      }

      // Fetch employees
      const employeesRes = await fetch('/api/employees?limit=1000');
      if (employeesRes.ok) {
        const employeesData = await employeesRes.json();
        setEmployees(employeesData.employees || []);
      }

      // Fetch stages
      const stagesRes = await fetch('/api/stages');
      if (stagesRes.ok) {
        const stagesData = await stagesRes.json();
        setSchoolStages(stagesData.stages || []);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const addStage = () => {
    const newStage: Stage = {
      id: Date.now().toString(),
      name: '',
      order: stages.length + 1,
      approverType: 'ROLE',
      allowReject: true,
      notifyOnEntry: true,
      notifyOnApproval: true,
      notifyOnReject: true
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

  const updateStage = (id: string, field: keyof Stage, value: any) => {
    setStages(stages.map(s => {
      if (s.id === id) {
        const updated = { ...s, [field]: value };
        // Reset approver fields when type changes
        if (field === 'approverType') {
          updated.approverUserId = undefined;
          updated.approverRoleId = undefined;
          updated.approverSystemRole = undefined;
        }
        return updated;
      }
      return s;
    }));
  };

  const toggleBranch = (branchId: string) => {
    if (selectedBranches.includes(branchId)) {
      setSelectedBranches(selectedBranches.filter(id => id !== branchId));
    } else {
      setSelectedBranches([...selectedBranches, branchId]);
    }
  };

  const toggleStage = (stageId: string) => {
    if (selectedStages.includes(stageId)) {
      setSelectedStages(selectedStages.filter(id => id !== stageId));
    } else {
      setSelectedStages([...selectedStages, stageId]);
    }
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

    if (selectedBranches.length === 0) {
      alert('يرجى اختيار فرع واحد على الأقل');
      return;
    }

    const emptyStages = stages.filter(s => !s.name.trim());
    if (emptyStages.length > 0) {
      alert('يرجى تعبئة جميع أسماء المراحل');
      return;
    }

    // Validate approvers
    for (const stage of stages) {
      if (stage.approverType === 'SPECIFIC_USER' && !stage.approverUserId) {
        alert(`يرجى اختيار موظف للمرحلة: ${stage.name}`);
        return;
      }
      if (stage.approverType === 'ROLE' && !stage.approverRoleId) {
        alert(`يرجى اختيار دور للمرحلة: ${stage.name}`);
        return;
      }
      if (stage.approverType === 'SYSTEM_ROLE' && !stage.approverSystemRole) {
        alert(`يرجى اختيار دور نظام للمرحلة: ${stage.name}`);
        return;
      }
    }

    setSaving(true);
    
    try {
      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          type: formData.type,
          forSpecificType: formData.forSpecificTypes.length > 0 ? JSON.stringify(formData.forSpecificTypes) : null,
          isActive: formData.isActive,
          branches: selectedBranches,
          stages: selectedStages,
          steps: stages
        })
      });

      if (res.ok) {
        alert('تم إنشاء سير العمل بنجاح! ✅');
        router.push('/workflows');
      } else {
        const error = await res.json();
        alert(`حدث خطأ: ${error.message || 'فشل في حفظ سير العمل'}`);
      }
    } catch (error) {
      console.error('Error saving workflow:', error);
      alert('حدث خطأ أثناء حفظ سير العمل');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{ fontSize: '14px', color: '#6B7280' }}>جاري التحميل...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <PageHeader
          title="إضافة سير عمل جديد"
          breadcrumbs={['الرئيسية', 'سير العمل', 'إضافة جديد']}
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
              📋 المعلومات الأساسية
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

              {/* Specific Types - Multiple Selection */}
              {formData.type && specificTypes[formData.type] && specificTypes[formData.type].length > 1 && (
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    تخصيص أنواع الطلبات (اختياري - يمكن اختيار أكثر من نوع)
                  </label>
                  <div style={{
                    display: 'grid',
                    gap: '10px',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))'
                  }}>
                    {specificTypes[formData.type].filter(st => st.value !== '').map(st => (
                      <label
                        key={st.value}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '12px 14px',
                          border: formData.forSpecificTypes.includes(st.value) ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          background: formData.forSpecificTypes.includes(st.value) ? '#EFF6FF' : 'white',
                          transition: 'all 0.2s'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.forSpecificTypes.includes(st.value)}
                          onChange={(e) => {
                            const newTypes = e.target.checked
                              ? [...formData.forSpecificTypes, st.value]
                              : formData.forSpecificTypes.filter(t => t !== st.value);
                            setFormData({ ...formData, forSpecificTypes: newTypes });
                          }}
                          style={{
                            width: '18px',
                            height: '18px',
                            cursor: 'pointer'
                          }}
                        />
                        <span style={{ fontSize: '13px', color: '#374151' }}>
                          {st.label}
                        </span>
                      </label>
                    ))}
                  </div>
                  <p style={{
                    fontSize: '12px',
                    color: '#6B7280',
                    marginTop: '8px'
                  }}>
                    {formData.forSpecificTypes.length > 0
                      ? `✅ سير العمل سيطبق على ${formData.forSpecificTypes.length} نوع من الطلبات`
                      : '💡 سير العمل سيطبق على جميع طلبات هذا القسم'
                    }
                  </p>
                </div>
              )}

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
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
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

          {/* Branches Card */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            border: '1px solid #E5E7EB'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
              🏢 الفروع المستهدفة <span style={{ color: '#EF4444' }}>*</span>
            </h3>
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px' }}>
              اختر الفروع التي سيطبق عليها سير العمل
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '12px'
            }}>
              {branches.map(branch => (
                <label
                  key={branch.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 16px',
                    border: selectedBranches.includes(branch.id) ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: selectedBranches.includes(branch.id) ? '#EFF6FF' : 'white',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!selectedBranches.includes(branch.id)) {
                      e.currentTarget.style.borderColor = '#D1D5DB';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selectedBranches.includes(branch.id)) {
                      e.currentTarget.style.borderColor = '#E5E7EB';
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedBranches.includes(branch.id)}
                    onChange={() => toggleBranch(branch.id)}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer'
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#111827'
                    }}>
                      {branch.name}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6B7280',
                      marginTop: '2px'
                    }}>
                      {branch.type}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {branches.length === 0 && (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                color: '#6B7280',
                fontSize: '14px'
              }}>
                لا توجد فروع متاحة. يرجى إضافة فروع أولاً.
              </div>
            )}
          </div>

          {/* School Stages Card - Only show if selected branches include schools */}
          {(() => {
            const selectedBranchObjects = branches.filter(b => selectedBranches.includes(b.id));
            const hasSchools = selectedBranchObjects.some(b => b.type === 'SCHOOL');
            const filteredStages = schoolStages.filter(stage => 
              selectedBranches.length === 0 || 
              (selectedBranches.includes(stage.branchId) && stage.branch?.type === 'SCHOOL')
            );

            if (!hasSchools && selectedBranches.length > 0) {
              return null; // Don't show stages section if no schools selected
            }

            return (
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '24px',
                border: '1px solid #E5E7EB'
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
                  🎓 المراحل الدراسية (اختياري)
                </h3>
                <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px' }}>
                  اختر المراحل الدراسية المحددة (اترك فارغاً للتطبيق على جميع المراحل)
                </p>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: '12px'
                }}>
                  {filteredStages.map(stage => (
                <label
                  key={stage.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 16px',
                    border: selectedStages.includes(stage.id) ? '2px solid #10B981' : '1px solid #E5E7EB',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: selectedStages.includes(stage.id) ? '#ECFDF5' : 'white',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!selectedStages.includes(stage.id)) {
                      e.currentTarget.style.borderColor = '#D1D5DB';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selectedStages.includes(stage.id)) {
                      e.currentTarget.style.borderColor = '#E5E7EB';
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedStages.includes(stage.id)}
                    onChange={() => toggleStage(stage.id)}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer'
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: '4px'
                    }}>
                      {stage.name}
                      {stage.branch && (
                        <span style={{
                          fontSize: '12px',
                          fontWeight: '400',
                          color: '#6B7280',
                          marginRight: '8px'
                        }}>
                          {' • '}{stage.branch.name}
                        </span>
                      )}
                    </div>
                    {stage.branch && (
                      <div style={{
                        fontSize: '11px',
                        color: '#9CA3AF'
                      }}>
                        {stage.branch.type === 'SCHOOL' ? '🏫 مدرسة' : 
                         stage.branch.type === 'INSTITUTE' ? '🎓 معهد' : 
                         stage.branch.type === 'COMPANY' ? '🏢 شركة' : stage.branch.type}
                      </div>
                    )}
                  </div>
                </label>
                  ))}
                </div>

                {filteredStages.length === 0 && selectedBranches.length > 0 && (
                  <div style={{
                    padding: '20px',
                    textAlign: 'center',
                    background: '#F3F4F6',
                    borderRadius: '8px',
                    color: '#6B7280',
                    fontSize: '13px'
                  }}>
                    💡 لا توجد مراحل للفروع المختارة. سير العمل سيطبق على جميع أقسام المدارس المختارة.
                  </div>
                )}

                {schoolStages.length === 0 && (
                  <div style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: '#6B7280',
                    fontSize: '14px'
                  }}>
                    لا توجد مراحل متاحة.
                  </div>
                )}
              </div>
            );
          })()}

          {/* Workflow Steps Card */}
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
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>
                  🔄 المراحل <span style={{ color: '#EF4444' }}>*</span>
                </h3>
                <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
                  حدد مراحل سير العمل والمعتمدين لكل مرحلة
                </p>
              </div>
              <button
                type="button"
                onClick={addStage}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {stages.map((stage, index) => (
                <div
                  key={stage.id}
                  style={{
                    padding: '20px',
                    background: '#F9FAFB',
                    borderRadius: '12px',
                    border: '1px solid #E5E7EB'
                  }}
                >
                  {/* Stage Header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      fontWeight: '700',
                      flexShrink: 0
                    }}>
                      {index + 1}
                    </div>
                    <input
                      type="text"
                      value={stage.name}
                      onChange={(e) => updateStage(stage.id, 'name', e.target.value)}
                      placeholder={`اسم المرحلة ${index + 1}`}
                      required
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        outline: 'none',
                        background: 'white'
                      }}
                    />
                    {stages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStage(stage.id)}
                        style={{
                          width: '40px',
                          height: '40px',
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
                          e.currentTarget.style.background = '#FECACA';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#FEE2E2';
                        }}
                      >
                        <HiOutlineTrash size={18} />
                      </button>
                    )}
                  </div>

                  {/* Approver Type */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      نوع المعتمد
                    </label>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: '8px'
                    }}>
                      {approverTypes.map(type => (
                        <label
                          key={type.value}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 12px',
                            border: stage.approverType === type.value ? '2px solid #3B82F6' : '1px solid #D1D5DB',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            background: stage.approverType === type.value ? '#EFF6FF' : 'white',
                            transition: 'all 0.2s',
                            fontSize: '13px'
                          }}
                        >
                          <input
                            type="radio"
                            name={`approverType-${stage.id}`}
                            checked={stage.approverType === type.value}
                            onChange={() => updateStage(stage.id, 'approverType', type.value)}
                            style={{ display: 'none' }}
                          />
                          {type.icon}
                          <span style={{ fontWeight: stage.approverType === type.value ? '600' : '400' }}>
                            {type.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Approver Selection */}
                  {stage.approverType === 'ROLE' && (
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        الدور <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <select
                        value={stage.approverRoleId || ''}
                        onChange={(e) => updateStage(stage.id, 'approverRoleId', e.target.value)}
                        required
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1px solid #D1D5DB',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none',
                          background: 'white',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="">-- اختر الدور --</option>
                        {workflowRoles.map(role => (
                          <option key={role.id} value={role.id}>
                            {role.nameAr} ({role.level})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {stage.approverType === 'SPECIFIC_USER' && (
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        الموظف <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <select
                        value={stage.approverUserId || ''}
                        onChange={(e) => updateStage(stage.id, 'approverUserId', e.target.value)}
                        required
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1px solid #D1D5DB',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none',
                          background: 'white',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="">-- اختر الموظف --</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>
                            {emp.fullName} {emp.jobTitle ? `(${emp.jobTitle})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {stage.approverType === 'SYSTEM_ROLE' && (
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        دور النظام <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <select
                        value={stage.approverSystemRole || ''}
                        onChange={(e) => updateStage(stage.id, 'approverSystemRole', e.target.value)}
                        required
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1px solid #D1D5DB',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none',
                          background: 'white',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="">-- اختر دور النظام --</option>
                        {systemRoles.map(role => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {stage.approverType === 'DIRECT_MANAGER' && (
                    <div style={{
                      padding: '12px 16px',
                      background: '#DBEAFE',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: '#1E40AF',
                      marginBottom: '16px'
                    }}>
                      💡 سيتم اختيار المدير المباشر للموظف مقدم الطلب تلقائياً
                    </div>
                  )}

                  {/* Settings */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px',
                    marginBottom: '12px'
                  }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 12px',
                      background: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={stage.allowReject}
                        onChange={(e) => updateStage(stage.id, 'allowReject', e.target.checked)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <span>السماح بالرفض</span>
                    </label>

                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 12px',
                      background: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={stage.notifyOnEntry}
                        onChange={(e) => updateStage(stage.id, 'notifyOnEntry', e.target.checked)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <span>إشعار عند الوصول</span>
                    </label>

                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 12px',
                      background: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={stage.notifyOnApproval}
                        onChange={(e) => updateStage(stage.id, 'notifyOnApproval', e.target.checked)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <span>إشعار عند الاعتماد</span>
                    </label>

                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 12px',
                      background: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={stage.notifyOnReject}
                        onChange={(e) => updateStage(stage.id, 'notifyOnReject', e.target.checked)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <span>إشعار عند الرفض</span>
                    </label>
                  </div>

                  {/* Auto Escalate */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      التصعيد التلقائي (اختياري)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', color: '#6B7280' }}>تصعيد بعد</span>
                      <input
                        type="number"
                        min="1"
                        value={stage.autoEscalateDays || ''}
                        onChange={(e) => updateStage(stage.id, 'autoEscalateDays', e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="0"
                        style={{
                          width: '80px',
                          padding: '8px 12px',
                          border: '1px solid #D1D5DB',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none',
                          background: 'white',
                          textAlign: 'center'
                        }}
                      />
                      <span style={{ fontSize: '13px', color: '#6B7280' }}>يوم</span>
                    </div>
                  </div>
                </div>
              ))}
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
              {saving ? 'جاري الحفظ...' : 'حفظ سير العمل'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
