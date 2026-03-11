'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TableEnhanced, Badge, Column } from '@/components/ui/TableEnhanced';
import { FloatingSelect } from '@/components/ui/FormEnhanced';
import { ResponsiveContainer, ResponsiveGrid } from '@/components/layout/ResponsiveContainer';
import { CardEnhanced, CardBody } from '@/components/ui/CardEnhanced';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { COLORS } from '@/lib/colors';
import { generateEmployeeListExcel, downloadExcel, formatExcelFilename } from '@/lib/excel-generator';

interface Employee {
  id: string;
  fullNameAr: string;
  employeeNumber: string;
  department: string;
  position: string;
  phone: string;
  email: string;
  status: string;
  hireDate: string;
  basicSalary: number;
  userId: string | null;
}

export default function EmployeesPage() {
  const router = useRouter();
  const toast = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [branchId, setBranchId] = useState('');
  const [stageId, setStageId] = useState('');
  const [departments, setDepartments] = useState<string[]>([]);
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [stages, setStages] = useState<Array<{ id: string; name: string }>>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // Debounced search - wait 500ms after user stops typing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchEmployees();
    }, searchQuery ? 500 : 0); // Debounce only for search, instant for filters

    return () => clearTimeout(timeoutId);
  }, [searchQuery, department, status, branchId, stageId]);

  useEffect(() => {
    fetch('/api/branches')
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d) ? d : d.branches || d.data || [];
        setBranches((list || []).filter((b: any) => b.status === 'ACTIVE').map((b: any) => ({ id: b.id, name: b.name })));
      })
      .catch(() => setBranches([]));
  }, []);

  useEffect(() => {
    if (!branchId) {
      setStages([]);
      setStageId('');
      return;
    }

    fetch(`/api/branches/${branchId}/stages`)
      .then((r) => r.json())
      .then((d) => {
        const list = d.stages || d.data || d || [];
        setStages((list || []).map((s: any) => ({ id: s.id, name: s.name })));
      })
      .catch(() => setStages([]));
  }, [branchId]);

  // Note: Filters are now applied server-side in fetchEmployees()

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setCurrentUserRole(data.user.role);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);

      // Build query string with all filters
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (department) params.append('department', department);
      if (status) params.append('status', status);
      if (branchId) params.append('branchId', branchId);
      if (stageId) params.append('stageId', stageId);

      const queryString = params.toString();
      const url = `/api/hr/employees${queryString ? `?${queryString}` : ''}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees);

        // Get unique departments for filter dropdown
        const uniqueDepts = [...new Set(data.employees.map((e: Employee) => e.department))].filter(Boolean);
        setDepartments(uniqueDepts as string[]);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('حدث خطأ أثناء جلب الموظفين', 'خطأ');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginAs = async (userId: string, employeeName: string) => {
    if (!confirm(`هل تريد الدخول بحساب ${employeeName}؟`)) {
      return;
    }

    try {
      const res = await fetch('/api/auth/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId })
      });

      if (res.ok) {
        toast.success(`تم الدخول بحساب ${employeeName}`, 'نجاح');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      } else {
        const data = await res.json();
        toast.error(data.error || 'حدث خطأ أثناء تبديل الحساب', 'خطأ');
      }
    } catch (error) {
      console.error('Login as error:', error);
      toast.error('حدث خطأ أثناء تبديل الحساب', 'خطأ');
    }
  };

  const handleExportExcel = () => {
    try {
      const excelData = {
        employees: employees.map(emp => ({
          name: emp.fullNameAr,
          employeeNumber: emp.employeeNumber,
          nationalId: '', // Not available in current data
          email: emp.email,
          phone: emp.phone,
          department: emp.department,
          branch: '', // Could be added if available
          jobTitle: emp.position,
          status: emp.status,
          hireDate: new Date(emp.hireDate),
          basicSalary: emp.basicSalary
        }))
      };

      const blob = generateEmployeeListExcel(excelData);
      const filename = formatExcelFilename('employees-list');
      downloadExcel(blob, filename);

      toast.success('تم تصدير قائمة الموظفين بنجاح', 'نجاح');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('حدث خطأ أثناء التصدير', 'خطأ');
    }
  };

  const getStatusBadge = (statusValue: string) => {
    const map: Record<string, { type: 'success' | 'warning' | 'danger' | 'gray'; text: string }> = {
      ACTIVE: { type: 'success', text: 'نشط' },
      ON_LEAVE: { type: 'warning', text: 'إجازة' },
      RESIGNED: { type: 'danger', text: 'مستقيل' },
      TERMINATED: { type: 'gray', text: 'منتهي' }
    };

    const config = map[statusValue] || { type: 'gray' as const, text: statusValue };
    return <Badge type={config.type}>{config.text}</Badge>;
  };

  const columns: Column<Employee>[] = [
    {
      key: 'employeeNumber',
      label: 'رقم الموظف',
      sortable: true
    },
    {
      key: 'fullNameAr',
      label: 'الاسم',
      sortable: true
    },
    {
      key: 'department',
      label: 'القسم',
      sortable: true
    },
    {
      key: 'position',
      label: 'المسمى الوظيفي',
      sortable: true
    },
    {
      key: 'phone',
      label: 'الجوال',
      sortable: false
    },
    {
      key: 'basicSalary',
      label: 'الراتب الأساسي',
      sortable: true,
      render: (row) => (
        <span style={{ fontWeight: '700' }}>
          {row.basicSalary.toLocaleString('ar-SA')} ر.س
        </span>
      )
    },
    {
      key: 'status',
      label: 'الحالة',
      sortable: true,
      align: 'center',
      render: (row) => getStatusBadge(row.status)
    },
    {
      key: 'id',
      label: 'إجراءات',
      align: 'center',
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href={`/hr/employees/${row.id}`}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: '600',
              background: COLORS.primary,
              color: COLORS.white,
              border: 'none',
              display: 'inline-block'
            }}
          >
            عرض
          </Link>

          <Link
            href={`/hr/employees/${row.id}/files`}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: '600',
              background: COLORS.gray100,
              color: COLORS.gray900,
              border: `1px solid ${COLORS.gray200}`,
              display: 'inline-block'
            }}
          >
            📂 ملفات
          </Link>

          {currentUserRole === 'ADMIN' && row.userId && (
            <button
              type="button"
              onClick={() => handleLoginAs(row.userId!, row.fullNameAr)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: `1px solid ${COLORS.primary}`,
                background: COLORS.white,
                color: COLORS.primary,
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              🔄 دخول
            </button>
          )}
        </div>
      )
    }
  ];

  const handleClearFilters = () => {
    setSearchQuery('');
    setDepartment('');
    setStatus('');
    setBranchId('');
    setStageId('');
  };

  const hasActiveFilters = searchQuery || department || status || branchId || stageId;

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <ResponsiveContainer size="xl">
        <PageHeader
          title="إدارة الموظفين"
          breadcrumbs={['الرئيسية', 'شؤون الموظفين', 'الموظفين']}
          actions={
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={handleExportExcel}
                style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
                }}
              >
                📊 تصدير Excel
              </button>
              <Link href="/hr/employees/new">
                <Button variant="primary">➕ موظف جديد</Button>
              </Link>
              <Link href="/hr/employees/bulk-edit">
                <Button variant="outline">🔄 تعديل جماعي</Button>
              </Link>
              <Link href="/hr/dashboard">
                <Button variant="outline">📊 لوحة التحكم</Button>
              </Link>
            </div>
          }
        />

        {/* Search & Filters */}
        <CardEnhanced variant="default" style={{ marginBottom: '20px' }}>
          <CardBody compact>
            {/* Search Box */}
            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="🔍 ابحث بالاسم، رقم الموظف، رقم الهوية، الجوال..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '15px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = COLORS.primary}
                onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
              />
            </div>

            {/* Filters Grid */}
            <ResponsiveGrid columns={{ mobile: 1, tablet: 2, desktop: 5 }} gap="md">
              <FloatingSelect
                label="الفرع"
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                options={[
                  { value: '', label: 'كل الفروع' },
                  ...branches.map((b) => ({ value: b.id, label: b.name }))
                ]}
              />

              <FloatingSelect
                label="المرحلة"
                value={stageId}
                onChange={(e) => setStageId(e.target.value)}
                options={[
                  { value: '', label: 'كل المراحل' },
                  ...stages.map((s) => ({ value: s.id, label: s.name }))
                ]}
                helper={!branchId ? 'اختر الفرع أولاً' : undefined}
              />

              <FloatingSelect
                label="القسم"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                options={[
                  { value: '', label: 'كل الأقسام' },
                  ...departments.map((d) => ({ value: d, label: d }))
                ]}
              />

              <FloatingSelect
                label="الحالة"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={[
                  { value: '', label: 'كل الحالات' },
                  { value: 'ACTIVE', label: 'نشط' },
                  { value: 'ON_LEAVE', label: 'إجازة' },
                  { value: 'RESIGNED', label: 'مستقيل' },
                  { value: 'TERMINATED', label: 'منتهي' }
                ]}
              />

              {hasActiveFilters && (
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <Button
                    variant="outline"
                    onClick={handleClearFilters}
                    style={{ width: '100%' }}
                  >
                    ✖ مسح الفلاتر
                  </Button>
                </div>
              )}
            </ResponsiveGrid>
          </CardBody>
        </CardEnhanced>

        {/* Table */}
        <TableEnhanced
          data={employees}
          columns={columns}
          loading={loading}
          searchable={false}
          exportable={true}
          pageSize={25}
          emptyMessage="لا يوجد موظفين"
          rowKey="id"
        />
      </ResponsiveContainer>
    </div>
  );
}
