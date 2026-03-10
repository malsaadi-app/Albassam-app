'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CardEnhanced, CardHeader, CardBody } from '@/components/ui/CardEnhanced';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { FloatingInput, FloatingSelect } from '@/components/ui/FormEnhanced';
import { useToast } from '@/components/ui/Toast';
import { ResponsiveContainer, ResponsiveGrid } from '@/components/layout/ResponsiveContainer';
import { HiOutlineUser, HiOutlinePhone, HiOutlineBriefcase, HiOutlineCurrencyDollar, HiOutlineAcademicCap, HiOutlineCalendar } from 'react-icons/hi';

export default function NewEmployeePage() {
  const router = useRouter();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [systemRoles, setSystemRoles] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  
  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    employeeNumber: '',
    arabicName: '',
    englishName: '',
    nationalId: '',
    email: '',
    phone: '',
    gender: 'MALE',
    nationality: 'سعودي',
    dateOfBirth: '',
    hireDate: new Date().toISOString().split('T')[0],
    position: '',
    department: '',
    directManager: '',
    systemRoleId: '',
    branchId: '',
    stageId: '',
    employmentType: 'PERMANENT',
    status: 'ACTIVE',
    basicSalary: 0,
    housingAllowance: 0,
    transportAllowance: 0,
    otherAllowances: 0,
    bankName: '',
    iban: '',
    address: '',
    city: '',
    education: '',
    certifications: '',
    maritalStatus: 'SINGLE',
    numberOfDependents: 0,
    emergencyContact: '',
    emergencyPhone: '',
    annualLeaveTotal: 30,
    casualLeaveTotal: 5,
    emergencyLeaveTotal: 0
  });

  useEffect(() => {
    checkPermission();
    fetchSystemRoles();
    fetchBranches();
  }, []);

  useEffect(() => {
    if (formData.branchId) {
      const selectedBranch = branches.find(b => b.id === formData.branchId);
      setStages(selectedBranch?.stages || []);
      if (formData.stageId && !selectedBranch?.stages?.find((s: any) => s.id === formData.stageId)) {
        setFormData(prev => ({ ...prev, stageId: '' }));
      }
    } else {
      setStages([]);
      setFormData(prev => ({ ...prev, stageId: '' }));
    }
  }, [formData.branchId, branches]);

  const fetchSystemRoles = async () => {
    try {
      const res = await fetch('/api/settings/roles');
      if (res.ok) {
        const data = await res.json();
        setSystemRoles(data.roles || []);
      }
    } catch (error) {
      console.error('Error fetching system roles:', error);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await fetch('/api/branches');
      if (res.ok) {
        const data = await res.json();
        setBranches(data || []);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const checkPermission = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        
        if (data.user.role !== 'ADMIN' && data.user.role !== 'HR_EMPLOYEE') {
          toast.error('غير مصرح لك بإضافة موظفين');
          router.push('/hr/employees');
        }
      }
    } catch (error) {
      console.error('Error checking permission:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.employeeNumber) newErrors.employeeNumber = 'رقم الموظف مطلوب';
    if (!formData.arabicName) newErrors.arabicName = 'الاسم بالعربي مطلوب';
    if (!formData.nationalId) newErrors.nationalId = 'رقم الهوية مطلوب';
    else if (formData.nationalId.length !== 10) newErrors.nationalId = 'رقم الهوية يجب أن يكون 10 أرقام';
    if (!formData.phone) newErrors.phone = 'رقم الجوال مطلوب';
    else if (!/^05\d{8}$/.test(formData.phone)) newErrors.phone = 'رقم جوال غير صحيح (مثال: 0512345678)';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صحيح';
    }
    if (formData.iban && !formData.iban.startsWith('SA')) {
      newErrors.iban = 'الآيبان يجب أن يبدأ بـ SA';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('يرجى تصحيح الأخطاء في النموذج');
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        ...formData,
        fullNameAr: formData.arabicName,
        fullNameEn: formData.englishName,
        branchId: formData.branchId || undefined,
        stageId: formData.stageId || undefined
      };

      if (payload.systemRoleId === '') delete payload.systemRoleId;

      const res = await fetch('/api/hr/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'same-origin'
      });

      if (res.ok) {
        const data = await res.json();
        toast.success('تم إضافة الموظف بنجاح', 'نجاح');
        router.push(`/hr/employees/${data.employee.id}`);
      } else {
        const data = await res.json();
        toast.error(data.error || 'حدث خطأ', 'خطأ');
      }
    } catch (error) {
      console.error('Error creating employee:', error);
      toast.error('حدث خطأ أثناء الإضافة', 'خطأ');
    } finally {
      setSaving(false);
    }
  };

  const totalSalary = formData.basicSalary + formData.housingAllowance + formData.transportAllowance + formData.otherAllowances;

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <ResponsiveContainer size="xl">
        <PageHeader
          title="➕ إضافة موظف جديد"
          breadcrumbs={['الرئيسية', 'شؤون الموظفين', 'الموظفين', 'إضافة']}
          actions={
            <Button variant="outline" onClick={() => router.push('/hr/employees')}>
              ← إلغاء
            </Button>
          }
        />

        <form onSubmit={handleSubmit}>
          {/* Basic Info */}
          <CardEnhanced variant="default" style={{ marginBottom: '24px' }}>
            <CardHeader
              icon={<HiOutlineUser size={24} />}
              title="البيانات الأساسية"
              subtitle="المعلومات الشخصية الأساسية للموظف"
            />
            <CardBody>
              <ResponsiveGrid columns={{ mobile: 1, tablet: 2, desktop: 3 }} gap="md">
                <FloatingInput
                  label="رقم الموظف *"
                  value={formData.employeeNumber}
                  onChange={(e) => {
                    setFormData({ ...formData, employeeNumber: e.target.value });
                    setErrors({ ...errors, employeeNumber: '' });
                  }}
                  error={errors.employeeNumber}
                  helper="رقم فريد للموظف"
                  clearable
                  onClear={() => setFormData({ ...formData, employeeNumber: '' })}
                />
                <FloatingInput
                  label="الاسم الكامل بالعربي *"
                  value={formData.arabicName}
                  onChange={(e) => {
                    setFormData({ ...formData, arabicName: e.target.value });
                    setErrors({ ...errors, arabicName: '' });
                  }}
                  error={errors.arabicName}
                  clearable
                  onClear={() => setFormData({ ...formData, arabicName: '' })}
                />
                <FloatingInput
                  label="الاسم الكامل بالإنجليزي"
                  value={formData.englishName}
                  onChange={(e) => setFormData({ ...formData, englishName: e.target.value })}
                  clearable
                  onClear={() => setFormData({ ...formData, englishName: '' })}
                />
                <FloatingInput
                  label="رقم الهوية *"
                  value={formData.nationalId}
                  onChange={(e) => {
                    setFormData({ ...formData, nationalId: e.target.value });
                    setErrors({ ...errors, nationalId: '' });
                  }}
                  error={errors.nationalId}
                  helper="10 أرقام"
                  clearable
                  onClear={() => setFormData({ ...formData, nationalId: '' })}
                />
                <FloatingInput
                  label="الجنسية"
                  value={formData.nationality}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  clearable
                  onClear={() => setFormData({ ...formData, nationality: '' })}
                />
                <FloatingInput
                  label="تاريخ الميلاد"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                />
                <FloatingSelect
                  label="الجنس"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  options={[
                    { value: 'MALE', label: 'ذكر' },
                    { value: 'FEMALE', label: 'أنثى' }
                  ]}
                />
                <FloatingSelect
                  label="الحالة الاجتماعية"
                  value={formData.maritalStatus}
                  onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value })}
                  options={[
                    { value: 'SINGLE', label: 'أعزب' },
                    { value: 'MARRIED', label: 'متزوج' },
                    { value: 'DIVORCED', label: 'مطلق' },
                    { value: 'WIDOWED', label: 'أرمل' }
                  ]}
                />
                <FloatingInput
                  label="عدد الأفراد"
                  type="number"
                  value={formData.numberOfDependents}
                  onChange={(e) => setFormData({ ...formData, numberOfDependents: parseInt(e.target.value) || 0 })}
                />
              </ResponsiveGrid>
            </CardBody>
          </CardEnhanced>

          {/* Contact Info */}
          <CardEnhanced variant="default" style={{ marginBottom: '24px' }}>
            <CardHeader
              icon={<HiOutlinePhone size={24} />}
              title="معلومات الاتصال"
              subtitle="بيانات الاتصال وجهات الطوارئ"
            />
            <CardBody>
              <ResponsiveGrid columns={{ mobile: 1, tablet: 2, desktop: 2 }} gap="md">
                <FloatingInput
                  label="رقم الجوال *"
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value });
                    setErrors({ ...errors, phone: '' });
                  }}
                  error={errors.phone}
                  helper="مثال: 0512345678"
                  clearable
                  onClear={() => setFormData({ ...formData, phone: '' })}
                />
                <FloatingInput
                  label="البريد الإلكتروني"
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    setErrors({ ...errors, email: '' });
                  }}
                  error={errors.email}
                  clearable
                  onClear={() => setFormData({ ...formData, email: '' })}
                />
                <FloatingInput
                  label="المدينة"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  clearable
                  onClear={() => setFormData({ ...formData, city: '' })}
                />
                <FloatingInput
                  label="العنوان"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  clearable
                  onClear={() => setFormData({ ...formData, address: '' })}
                />
                <FloatingInput
                  label="جهة الاتصال في حالة الطوارئ"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  clearable
                  onClear={() => setFormData({ ...formData, emergencyContact: '' })}
                />
                <FloatingInput
                  label="رقم الطوارئ"
                  value={formData.emergencyPhone}
                  onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                  clearable
                  onClear={() => setFormData({ ...formData, emergencyPhone: '' })}
                />
              </ResponsiveGrid>
            </CardBody>
          </CardEnhanced>

          {/* Job Info */}
          <CardEnhanced variant="default" style={{ marginBottom: '24px' }}>
            <CardHeader
              icon={<HiOutlineBriefcase size={24} />}
              title="البيانات الوظيفية"
              subtitle="المعلومات الوظيفية والتنظيمية"
            />
            <CardBody>
              <ResponsiveGrid columns={{ mobile: 1, tablet: 2, desktop: 3 }} gap="md">
                <FloatingInput
                  label="القسم"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  clearable
                  onClear={() => setFormData({ ...formData, department: '' })}
                />
                <FloatingInput
                  label="المسمى الوظيفي"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  clearable
                  onClear={() => setFormData({ ...formData, position: '' })}
                />
                <FloatingInput
                  label="المدير المباشر"
                  value={formData.directManager}
                  onChange={(e) => setFormData({ ...formData, directManager: e.target.value })}
                  clearable
                  onClear={() => setFormData({ ...formData, directManager: '' })}
                />
                <FloatingSelect
                  label="الفرع"
                  value={formData.branchId}
                  onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                  options={[
                    { value: '', label: 'بدون فرع' },
                    ...branches.map((branch) => ({ value: branch.id, label: branch.name }))
                  ]}
                />
                <FloatingSelect
                  label="المرحلة"
                  value={formData.stageId}
                  onChange={(e) => setFormData({ ...formData, stageId: e.target.value })}
                  options={[
                    { value: '', label: 'بدون مرحلة' },
                    ...stages.map((stage: any) => ({ value: stage.id, label: stage.name }))
                  ]}
                  helper={!formData.branchId ? 'اختر الفرع أولاً' : undefined}
                />
                <FloatingInput
                  label="تاريخ التوظيف"
                  type="date"
                  value={formData.hireDate}
                  onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                />
                <FloatingSelect
                  label="نوع التوظيف"
                  value={formData.employmentType}
                  onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                  options={[
                    { value: 'PERMANENT', label: 'دائم' },
                    { value: 'CONTRACT', label: 'متعاقد' },
                    { value: 'TEMPORARY', label: 'مؤقت' }
                  ]}
                />
                <FloatingSelect
                  label="الحالة"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  options={[
                    { value: 'ACTIVE', label: 'نشط' },
                    { value: 'ON_LEAVE', label: 'في إجازة' },
                    { value: 'SUSPENDED', label: 'موقوف' }
                  ]}
                />
                {systemRoles.length > 0 && (
                  <FloatingSelect
                    label="صلاحيات النظام"
                    value={formData.systemRoleId}
                    onChange={(e) => setFormData({ ...formData, systemRoleId: e.target.value })}
                    options={[
                      { value: '', label: 'اختر...' },
                      ...systemRoles.map((role) => ({ value: role.id, label: role.nameAr }))
                    ]}
                  />
                )}
              </ResponsiveGrid>
            </CardBody>
          </CardEnhanced>

          {/* Financial Info */}
          <CardEnhanced variant="default" style={{ marginBottom: '24px' }}>
            <CardHeader
              icon={<HiOutlineCurrencyDollar size={24} />}
              title="البيانات المالية"
              subtitle="الراتب والبدلات"
            />
            <CardBody>
              <ResponsiveGrid columns={{ mobile: 1, tablet: 2, desktop: 4 }} gap="md">
                <FloatingInput
                  label="الراتب الأساسي (ر.س)"
                  type="number"
                  value={formData.basicSalary}
                  onChange={(e) => setFormData({ ...formData, basicSalary: parseFloat(e.target.value) || 0 })}
                />
                <FloatingInput
                  label="بدل السكن (ر.س)"
                  type="number"
                  value={formData.housingAllowance}
                  onChange={(e) => setFormData({ ...formData, housingAllowance: parseFloat(e.target.value) || 0 })}
                />
                <FloatingInput
                  label="بدل النقل (ر.س)"
                  type="number"
                  value={formData.transportAllowance}
                  onChange={(e) => setFormData({ ...formData, transportAllowance: parseFloat(e.target.value) || 0 })}
                />
                <FloatingInput
                  label="بدلات أخرى (ر.س)"
                  type="number"
                  value={formData.otherAllowances}
                  onChange={(e) => setFormData({ ...formData, otherAllowances: parseFloat(e.target.value) || 0 })}
                />
              </ResponsiveGrid>

              <div style={{
                marginTop: '20px',
                padding: '24px',
                background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)', fontWeight: '600', marginBottom: '8px' }}>
                  💰 إجمالي الراتب الشهري
                </p>
                <p style={{ fontSize: '36px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                  {totalSalary.toLocaleString('ar-SA')} ر.س
                </p>
              </div>

              <div style={{ marginTop: '20px' }}>
                <ResponsiveGrid columns={{ mobile: 1, tablet: 2, desktop: 2 }} gap="md">
                  <FloatingInput
                    label="اسم البنك"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    clearable
                    onClear={() => setFormData({ ...formData, bankName: '' })}
                  />
                  <FloatingInput
                    label="رقم الآيبان"
                    value={formData.iban}
                    onChange={(e) => {
                      setFormData({ ...formData, iban: e.target.value });
                      setErrors({ ...errors, iban: '' });
                    }}
                    error={errors.iban}
                    helper="SA + 22 رقم"
                    clearable
                    onClear={() => setFormData({ ...formData, iban: '' })}
                  />
                </ResponsiveGrid>
              </div>
            </CardBody>
          </CardEnhanced>

          {/* Education */}
          <CardEnhanced variant="default" style={{ marginBottom: '24px' }}>
            <CardHeader
              icon={<HiOutlineAcademicCap size={24} />}
              title="المؤهلات العلمية"
              subtitle="الشهادات والدورات التدريبية"
            />
            <CardBody>
              <ResponsiveGrid columns={{ mobile: 1, tablet: 2, desktop: 2 }} gap="md">
                <FloatingInput
                  label="المؤهل العلمي"
                  value={formData.education}
                  onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                  helper="مثال: بكالوريوس في إدارة الأعمال"
                  clearable
                  onClear={() => setFormData({ ...formData, education: '' })}
                />
                <FloatingInput
                  label="الشهادات والدورات"
                  value={formData.certifications}
                  onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                  helper="مثال: PMP, ITIL, إلخ"
                  clearable
                  onClear={() => setFormData({ ...formData, certifications: '' })}
                />
              </ResponsiveGrid>
            </CardBody>
          </CardEnhanced>

          {/* Leave Balance */}
          <CardEnhanced variant="default" style={{ marginBottom: '24px' }}>
            <CardHeader
              icon={<HiOutlineCalendar size={24} />}
              title="رصيد الإجازات السنوي"
              subtitle="الأرصدة الافتتاحية للإجازات"
            />
            <CardBody>
              <ResponsiveGrid columns={{ mobile: 1, tablet: 2, desktop: 3 }} gap="md">
                <FloatingInput
                  label="الإجازات السنوية (يوم)"
                  type="number"
                  value={formData.annualLeaveTotal}
                  onChange={(e) => setFormData({ ...formData, annualLeaveTotal: parseInt(e.target.value) || 0 })}
                />
                <FloatingInput
                  label="الإجازات العارضة (يوم)"
                  type="number"
                  value={formData.casualLeaveTotal}
                  onChange={(e) => setFormData({ ...formData, casualLeaveTotal: parseInt(e.target.value) || 0 })}
                />
                <FloatingInput
                  label="الإجازات الاضطرارية (يوم)"
                  type="number"
                  value={formData.emergencyLeaveTotal}
                  onChange={(e) => setFormData({ ...formData, emergencyLeaveTotal: parseInt(e.target.value) || 0 })}
                />
              </ResponsiveGrid>
            </CardBody>
          </CardEnhanced>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/hr/employees')}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="success"
              loading={saving}
            >
              ✓ إضافة الموظف
            </Button>
          </div>
        </form>
      </ResponsiveContainer>
    </div>
  );
}
