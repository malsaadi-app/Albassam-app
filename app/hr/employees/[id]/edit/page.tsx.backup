'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Input, Select } from '@/components/ui/Input';

export default function EditEmployeePage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [systemRoles, setSystemRoles] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [jobTitles, setJobTitles] = useState<any[]>([]);

  // قوائم ثابتة
  const educationLevels = [
    'ثانوية عامة',
    'دبلوم',
    'بكالوريوس',
    'ماجستير',
    'دكتوراه'
  ];

  const specializations = [
    'إدارة أعمال',
    'محاسبة',
    'تقنية معلومات',
    'هندسة',
    'طب',
    'تمريض',
    'علوم',
    'رياضيات',
    'لغة عربية',
    'لغة إنجليزية',
    'تربية خاصة',
    'علم نفس',
    'قانون',
    'إعلام',
    'تسويق',
    'موارد بشرية',
    'اقتصاد',
    'علوم حاسب'
  ];
  
  const [formData, setFormData] = useState({
    employeeNumber: '',
    arabicName: '',
    englishName: '',
    nationalId: '',
    email: '',
    phone: '',
    gender: 'MALE',
    nationality: '',
    dateOfBirth: '',
    hireDate: '',
    position: '',
    department: '',
    departmentId: '',
    jobTitleId: '',
    branchId: '',
    stageId: '',
    systemRoleId: '',
    status: 'ACTIVE',
    basicSalary: 0,
    housingAllowance: 0,
    transportAllowance: 0,
    otherAllowances: 0,
    bankName: '',
    bankAccountNumber: '',
    iban: '',
    education: '',
    specialization: '',
    certifications: '',
    emergencyLeaveBalance: 0,
    annualLeaveTotal: 30,
    annualLeaveUsed: 0
  });

  useEffect(() => {
    checkPermission();
    fetchSystemRoles();
    fetchBranches();
    fetchDepartments();
    fetchJobTitles();
    if (params.id) {
      fetchEmployee();
    }
  }, [params.id]);

  useEffect(() => {
    if (formData.branchId) {
      fetchStages(formData.branchId);
    } else {
      setStages([]);
      setFormData(prev => ({ ...prev, stageId: '' }));
    }
  }, [formData.branchId]);

  // determine selected branch type (SCHOOL / COMPANY)
  const selectedBranchType = branches.find(b => b.id === formData.branchId)?.type || '';


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
        setBranches(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchStages = async (branchId: string) => {
    try {
      const res = await fetch(`/api/branches/${branchId}/stages`);
      if (res.ok) {
        const data = await res.json();
        setStages(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching stages:', error);
      setStages([]);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/hr/master-data/departments');
      if (res.ok) {
        const data = await res.json();
        setDepartments(data.departments || []);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchJobTitles = async () => {
    try {
      const res = await fetch('/api/hr/master-data/job-titles');
      if (res.ok) {
        const data = await res.json();
        setJobTitles(data.jobTitles || []);
      }
    } catch (error) {
      console.error('Error fetching job titles:', error);
    }
  };

  const checkPermission = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        
        if (data.user.role !== 'ADMIN' && data.user.role !== 'HR_EMPLOYEE') {
          alert('غير مصرح لك بتعديل بيانات الموظفين');
          router.push('/hr/employees');
        }
      }
    } catch (error) {
      console.error('Error checking permission:', error);
    }
  };

  const fetchEmployee = async () => {
    try {
      const res = await fetch(`/api/hr/employees/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        
        setFormData({
          employeeNumber: data.employeeNumber || '',
          arabicName: data.fullNameAr || data.arabicName || '',
          englishName: data.fullNameEn || data.englishName || '',
          nationalId: data.nationalId || '',
          email: data.email || '',
          phone: data.phone || '',
          gender: data.gender || 'MALE',
          nationality: data.nationality || '',
          dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split('T')[0] : '',
          hireDate: data.hireDate ? data.hireDate.split('T')[0] : '',
          position: data.jobTitleRef?.nameAr || data.position || '',
          department: data.department || '',
          departmentId: data.departmentId || data.departmentRef?.id || '',
          jobTitleId: data.jobTitleId || data.jobTitleRef?.id || '',
          branchId: data.branchId || '',
          stageId: data.stageId || '',
          systemRoleId: data.systemRoleId || '',
          status: data.status || 'ACTIVE',
          basicSalary: data.basicSalary || 0,
          housingAllowance: data.housingAllowance || 0,
          transportAllowance: data.transportAllowance || 0,
          otherAllowances: data.otherAllowances || 0,
          bankName: data.bankName || '',
          bankAccountNumber: data.bankAccountNumber || '',
          iban: data.iban || '',
          education: (() => {
            // Handle old JSON format: {"degree":"بكالوريوس","institution":"..."}
            if (data.education && typeof data.education === 'string' && data.education.startsWith('{')) {
              try {
                const parsed = JSON.parse(data.education);
                return parsed.degree || '';
              } catch (e) {
                return data.education || '';
              }
            }
            return data.education || '';
          })(),
          specialization: data.specialization || '',
          certifications: data.certifications || '',
          emergencyLeaveBalance: data.leaveBalance?.emergencyRemaining || 0,
          annualLeaveTotal: data.leaveBalance?.annualTotal || 30,
          annualLeaveUsed: data.leaveBalance?.annualUsed || 0
        });
      }
    } catch (error) {
      console.error('Error fetching employee:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.arabicName || !formData.nationalId || !formData.phone) {
      alert('يرجى تعبئة الحقول المطلوبة');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/hr/employees/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert('تم تحديث بيانات الموظف بنجاح');
        router.push(`/hr/employees/${params.id}`);
      } else {
        const data = await res.json();
        alert(data.error || 'حدث خطأ');
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      alert('حدث خطأ أثناء التحديث');
    } finally {
      setSaving(false);
    }
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
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <PageHeader
          title="✏️ تعديل بيانات الموظف"
          breadcrumbs={['الرئيسية', 'شؤون الموظفين', 'الموظفين', 'تعديل']}
          actions={
            <Button variant="outline" onClick={() => router.push(`/hr/employees/${params.id}`)}>
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
              />
              <Input
                label="الاسم بالعربي *"
                value={formData.arabicName}
                onChange={(e) => setFormData({ ...formData, arabicName: e.target.value })}
                required
              />
              <Input
                label="الاسم بالإنجليزي"
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
            </div>
          </Card>

          {/* Contact Info */}
          <Card variant="default" style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', marginBottom: '20px' }}>
              📞 معلومات الاتصال
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <Input
                label="الجوال *"
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
            </div>
          </Card>

          {/* Job Info */}
          <Card variant="default" style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', marginBottom: '20px' }}>
              💼 البيانات الوظيفية
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <Select
                label="القسم"
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
              >
                <option value="">اختر القسم...</option>
                {departments.filter(d => d.isActive).map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.nameAr}
                  </option>
                ))}
              </Select>
              <Select
                label="المسمى الوظيفي"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              >
                <option value="">اختر المسمى الوظيفي...</option>
                {jobTitles.filter(j => j.isActive).map((job) => (
                  <option key={job.id} value={job.nameAr}>
                    {job.nameAr}
                  </option>
                ))}
              </Select>
              <Input
                label="تاريخ المباشرة"
                type="date"
                value={formData.hireDate}
                onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
              />
              <Select
                label="الفرع"
                value={formData.branchId}
                onChange={(e) => setFormData({ ...formData, branchId: e.target.value, stageId: '' })}
              >
                <option value="">اختر الفرع...</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </Select>
              {selectedBranchType === 'SCHOOL' && stages.length > 0 && (
                <Select
                  label="المرحلة الدراسية"
                  value={formData.stageId}
                  onChange={(e) => setFormData({ ...formData, stageId: e.target.value })}
                >
                  <option value="">اختر المرحلة...</option>
                  {stages.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </Select>
              )}

              {/* If branch is COMPANY, show department picker (legacy department field) */}
              {selectedBranchType === 'COMPANY' && (
                <Select
                  label="القسم (للشركات)"
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                >
                  <option value="">اختر القسم...</option>
                  {departments.filter(d => d.isActive).map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.nameAr}
                    </option>
                  ))}
                </Select>
              )}
              <Select
                label="الحالة"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="ACTIVE">نشط</option>
                <option value="ON_LEAVE">في إجازة</option>
                <option value="SUSPENDED">موقوف</option>
                <option value="RESIGNED">مستقيل</option>
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
              padding: '16px',
              background: '#D1FAE5',
              border: '1px solid #6EE7B7',
              borderRadius: '12px'
            }}>
              <p style={{ fontSize: '14px', color: '#065F46', fontWeight: '600', marginBottom: '4px' }}>
                إجمالي الراتب
              </p>
              <p style={{ fontSize: '28px', fontWeight: '800', color: '#059669', margin: 0 }}>
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
                label="رقم الحساب البنكي"
                value={formData.bankAccountNumber}
                onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
              />
              <Input
                label="رقم الآيبان"
                value={formData.iban}
                onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
              />
            </div>
          </Card>

          {/* Education */}
          <Card variant="default" style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', marginBottom: '20px' }}>
              🎓 المؤهلات
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <Select
                label="المؤهل العلمي"
                value={formData.education}
                onChange={(e) => setFormData({ ...formData, education: e.target.value })}
              >
                <option value="">اختر المؤهل العلمي...</option>
                {educationLevels.map((level, idx) => (
                  <option key={idx} value={level}>
                    {level}
                  </option>
                ))}
              </Select>

              <Select
                label="التخصص"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              >
                <option value="">اختر التخصص...</option>
                {specializations.map((spec, idx) => (
                  <option key={idx} value={spec}>
                    {spec}
                  </option>
                ))}
              </Select>

              <Input
                label="الشهادات"
                value={formData.certifications}
                onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
              />
            </div>
          </Card>

          {/* Leave Balance */}
          <Card variant="default" style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', marginBottom: '20px' }}>
              🧾 رصيد الإجازات
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              <Input
                label="إجمالي الإجازات السنوية (يوم)"
                type="number"
                value={formData.annualLeaveTotal}
                onChange={(e) => setFormData({ ...formData, annualLeaveTotal: parseInt(e.target.value || '0', 10) })}
              />
              <Input
                label="المستهلَكة من الإجازة السنوية (يوم)"
                type="number"
                value={formData.annualLeaveUsed}
                onChange={(e) => setFormData({ ...formData, annualLeaveUsed: parseInt(e.target.value || '0', 10) })}
              />
              <Input
                label="إجمالي الإجازات الطارئة المتبقية (يوم)"
                type="number"
                value={formData.emergencyLeaveBalance}
                onChange={(e) => setFormData({ ...formData, emergencyLeaveBalance: parseInt(e.target.value || '0', 10) })}
              />
            </div>
          </Card>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/hr/employees/${params.id}`)}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="success"
              loading={saving}
            >
              💾 حفظ التعديلات
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
