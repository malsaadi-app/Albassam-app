'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Input, Select, Textarea } from '@/components/ui/Input';

export default function NewEmployeePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [systemRoles, setSystemRoles] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  
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
    // Leave balance
    annualLeaveTotal: 30,
    casualLeaveTotal: 5,
    emergencyLeaveTotal: 0
  });

  useEffect(() => {
    checkPermission();
    fetchSystemRoles();
    fetchBranches();
  }, []);

  // Fetch stages when branch changes
  useEffect(() => {
    if (formData.branchId) {
      const selectedBranch = branches.find(b => b.id === formData.branchId);
      setStages(selectedBranch?.stages || []);
      // Reset stage selection if branch changed
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
          alert('غير مصرح لك بإضافة موظفين');
          router.push('/hr/employees');
        }
      }
    } catch (error) {
      console.error('Error checking permission:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.arabicName || !formData.nationalId || !formData.phone || !formData.employeeNumber) {
      alert('يرجى تعبئة الحقول المطلوبة (*)');
      return;
    }

    setSaving(true);
    try {
      // Map form data to API schema
      const payload = {
        ...formData,
        fullNameAr: formData.arabicName,
        fullNameEn: formData.englishName,
        branchId: formData.branchId || undefined,
        stageId: formData.stageId || undefined
      };

      const res = await fetch('/api/hr/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        alert('تم إضافة الموظف بنجاح');
        router.push(`/hr/employees/${data.employee.id}`);
      } else {
        const data = await res.json();
        alert(data.error || 'حدث خطأ');
      }
    } catch (error) {
      console.error('Error creating employee:', error);
      alert('حدث خطأ أثناء الإضافة');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
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
          <Card variant="default" style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', marginBottom: '20px' }}>
              📋 البيانات الأساسية
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <Input
                label="رقم الموظف *"
                value={formData.employeeNumber}
                onChange={(e) => setFormData({ ...formData, employeeNumber: e.target.value })}
                required
                helperText="رقم فريد للموظف"
              />
              <Input
                label="الاسم الكامل بالعربي *"
                value={formData.arabicName}
                onChange={(e) => setFormData({ ...formData, arabicName: e.target.value })}
                required
              />
              <Input
                label="الاسم الكامل بالإنجليزي"
                value={formData.englishName}
                onChange={(e) => setFormData({ ...formData, englishName: e.target.value })}
              />
              <Input
                label="رقم الهوية *"
                value={formData.nationalId}
                onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                required
              />
              <Input
                label="الجنسية"
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
              />
              <Input
                label="تاريخ الميلاد"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              />
              <Select
                label="الجنس"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="MALE">ذكر</option>
                <option value="FEMALE">أنثى</option>
              </Select>
              <Select
                label="الحالة الاجتماعية"
                value={formData.maritalStatus}
                onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value })}
              >
                <option value="SINGLE">أعزب</option>
                <option value="MARRIED">متزوج</option>
                <option value="DIVORCED">مطلق</option>
                <option value="WIDOWED">أرمل</option>
              </Select>
              <Input
                label="عدد الأفراد"
                type="number"
                value={formData.numberOfDependents}
                onChange={(e) => setFormData({ ...formData, numberOfDependents: parseInt(e.target.value) || 0 })}
              />
            </div>
          </Card>

          {/* Contact Info */}
          <Card variant="default" style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', marginBottom: '20px' }}>
              📞 معلومات الاتصال
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <Input
                label="رقم الجوال *"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
              <Input
                label="البريد الإلكتروني"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <Input
                label="المدينة"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
              <Input
                label="العنوان"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <Input
                label="جهة الاتصال في حالة الطوارئ"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
              />
              <Input
                label="رقم الطوارئ"
                value={formData.emergencyPhone}
                onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
              />
            </div>
          </Card>

          {/* Job Info */}
          <Card variant="default" style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', marginBottom: '20px' }}>
              💼 البيانات الوظيفية
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <Input
                label="القسم"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
              <Input
                label="المسمى الوظيفي"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              />
              <Input
                label="المدير المباشر"
                value={formData.directManager}
                onChange={(e) => setFormData({ ...formData, directManager: e.target.value })}
              />
              <Select
                label="الفرع 🏢"
                value={formData.branchId}
                onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
              >
                <option value="">بدون فرع</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </Select>
              <Select
                label="المرحلة 🎓"
                value={formData.stageId}
                onChange={(e) => setFormData({ ...formData, stageId: e.target.value })}
                disabled={!formData.branchId || stages.length === 0}
              >
                <option value="">بدون مرحلة</option>
                {stages.map((stage: any) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </Select>
              <Input
                label="تاريخ التوظيف"
                type="date"
                value={formData.hireDate}
                onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
              />
              <Select
                label="نوع التوظيف"
                value={formData.employmentType}
                onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
              >
                <option value="PERMANENT">دائم</option>
                <option value="CONTRACT">متعاقد</option>
                <option value="TEMPORARY">مؤقت</option>
              </Select>
              <Select
                label="الحالة"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="ACTIVE">نشط</option>
                <option value="ON_LEAVE">في إجازة</option>
                <option value="SUSPENDED">موقوف</option>
              </Select>
              {systemRoles.length > 0 && (
                <Select
                  label="صلاحيات النظام"
                  value={formData.systemRoleId}
                  onChange={(e) => setFormData({ ...formData, systemRoleId: e.target.value })}
                >
                  <option value="">اختر...</option>
                  {systemRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.nameAr}
                    </option>
                  ))}
                </Select>
              )}
            </div>
          </Card>

          {/* Financial Info */}
          <Card variant="default" style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', marginBottom: '20px' }}>
              💰 البيانات المالية
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              <Input
                label="الراتب الأساسي (ر.س)"
                type="number"
                value={formData.basicSalary}
                onChange={(e) => setFormData({ ...formData, basicSalary: parseFloat(e.target.value) || 0 })}
              />
              <Input
                label="بدل السكن (ر.س)"
                type="number"
                value={formData.housingAllowance}
                onChange={(e) => setFormData({ ...formData, housingAllowance: parseFloat(e.target.value) || 0 })}
              />
              <Input
                label="بدل النقل (ر.س)"
                type="number"
                value={formData.transportAllowance}
                onChange={(e) => setFormData({ ...formData, transportAllowance: parseFloat(e.target.value) || 0 })}
              />
              <Input
                label="بدلات أخرى (ر.س)"
                type="number"
                value={formData.otherAllowances}
                onChange={(e) => setFormData({ ...formData, otherAllowances: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div style={{
              marginTop: '20px',
              padding: '20px',
              background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)', fontWeight: '600', marginBottom: '8px' }}>
                إجمالي الراتب الشهري
              </p>
              <p style={{ fontSize: '32px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                {(
                  formData.basicSalary +
                  formData.housingAllowance +
                  formData.transportAllowance +
                  formData.otherAllowances
                ).toLocaleString('ar-SA')} ر.س
              </p>
            </div>
          </Card>

          {/* Bank Info */}
          <Card variant="default" style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', marginBottom: '20px' }}>
              🏦 البيانات البنكية
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <Input
                label="اسم البنك"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
              />
              <Input
                label="رقم الآيبان"
                value={formData.iban}
                onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                helperText="SA + 22 رقم"
              />
            </div>
          </Card>

          {/* Education */}
          <Card variant="default" style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', marginBottom: '20px' }}>
              🎓 المؤهلات العلمية
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
              <Input
                label="المؤهل العلمي"
                value={formData.education}
                onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                placeholder="مثال: بكالوريوس في إدارة الأعمال"
              />
              <Input
                label="الشهادات والدورات"
                value={formData.certifications}
                onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                placeholder="مثال: PMP, ITIL, إلخ"
              />
            </div>
          </Card>

          {/* Leave Balance */}
          <Card variant="default" style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', marginBottom: '20px' }}>
              🌴 رصيد الإجازات السنوي
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              <Input
                label="الإجازات السنوية (يوم)"
                type="number"
                value={formData.annualLeaveTotal}
                onChange={(e) => setFormData({ ...formData, annualLeaveTotal: parseInt(e.target.value) || 0 })}
              />
              <Input
                label="الإجازات العارضة (يوم)"
                type="number"
                value={formData.casualLeaveTotal}
                onChange={(e) => setFormData({ ...formData, casualLeaveTotal: parseInt(e.target.value) || 0 })}
              />
              <Input
                label="الإجازات الاضطرارية (يوم)"
                type="number"
                value={formData.emergencyLeaveTotal}
                onChange={(e) => setFormData({ ...formData, emergencyLeaveTotal: parseInt(e.target.value) || 0 })}
              />
            </div>
          </Card>

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
      </div>
    </div>
  );
}
