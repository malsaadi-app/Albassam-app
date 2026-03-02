'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { COLORS } from '@/lib/colors';

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
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [branchId, setBranchId] = useState('');
  const [stageId, setStageId] = useState('');
  const [departments, setDepartments] = useState<string[]>([]);
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [stages, setStages] = useState<Array<{ id: string; name: string }>>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');

  useEffect(() => {
    fetchEmployees();
    fetchCurrentUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, department, status, branchId, stageId]);

  useEffect(() => {
    fetch('/api/branches')
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d) ? d : d.branches || d.data || []
        setBranches((list || []).filter((b: any) => b.status === 'ACTIVE').map((b: any) => ({ id: b.id, name: b.name })))
      })
      .catch(() => setBranches([]))
  }, [])

  useEffect(() => {
    if (!branchId) {
      setStages([])
      setStageId('')
      return
    }

    fetch(`/api/branches/${branchId}/stages`)
      .then((r) => r.json())
      .then((d) => {
        const list = d.stages || d.data || d || []
        setStages((list || []).map((s: any) => ({ id: s.id, name: s.name })))
      })
      .catch(() => setStages([]))
  }, [branchId])

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
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (department) params.append('department', department);
      if (status) params.append('status', status);
      if (branchId) params.append('branchId', branchId);
      if (stageId) params.append('stageId', stageId);

      const res = await fetch(`/api/hr/employees?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees);

        const uniqueDepts = [...new Set(data.employees.map((e: Employee) => e.department))];
        setDepartments(uniqueDepts as string[]);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
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
        // Force full page reload to update Sidebar state
        window.location.href = '/dashboard';
      } else {
        const data = await res.json();
        alert(data.error || 'حدث خطأ أثناء تبديل الحساب');
      }
    } catch (error) {
      console.error('Login as error:', error);
      alert('حدث خطأ أثناء تبديل الحساب');
    }
  };

  const getStatusBadge = (statusValue: string) => {
    const map: Record<string, { bg: string; text: string }> = {
      ACTIVE: { bg: COLORS.success, text: 'نشط' },
      ON_LEAVE: { bg: COLORS.warning, text: 'إجازة' },
      RESIGNED: { bg: COLORS.danger, text: 'مستقيل' },
      TERMINATED: { bg: COLORS.gray500, text: 'منتهي' }
    };

    const style = map[statusValue] || { bg: COLORS.gray500, text: statusValue };

    return (
      <span
        style={{
          background: style.bg,
          color: COLORS.white,
          padding: '6px 12px',
          borderRadius: '999px',
          fontSize: '13px',
          fontWeight: '700',
          display: 'inline-block'
        }}
      >
        {style.text}
      </span>
    );
  };

  const cardStyle: CSSProperties = {
    background: COLORS.white,
    border: `1px solid ${COLORS.gray200}`,
    borderRadius: '16px'
  };

  const buttonBase: CSSProperties = {
    padding: '12px 16px',
    borderRadius: '12px',
    textDecoration: 'none',
    fontWeight: '700',
    border: `1px solid ${COLORS.gray200}`
  };

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        background: COLORS.background,
        padding: '24px 16px'
      }}
    >
      {/* Header */}
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}
      >
        <h1
          style={{
            color: COLORS.gray900,
            fontSize: '28px',
            fontWeight: '800',
            margin: 0
          }}
        >
          إدارة الموظفين
        </h1>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link
            href="/hr/employees/new"
            style={{
              ...buttonBase,
              background: COLORS.primary,
              color: COLORS.white,
              borderColor: COLORS.primary
            }}
          >
            ➕ موظف جديد
          </Link>

          <Link
            href="/hr/employees/bulk-edit"
            style={{
              ...buttonBase,
              background: COLORS.white,
              color: COLORS.primary,
              borderColor: COLORS.primary
            }}
          >
            🔄 تعديل جماعي
          </Link>

          <Link
            href="/hr/dashboard"
            style={{
              ...buttonBase,
              background: COLORS.gray100,
              color: COLORS.gray900
            }}
          >
            📊 لوحة التحكم
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Filters */}
        <div
          style={{
            ...cardStyle,
            padding: '16px',
            marginBottom: '16px'
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '12px'
            }}
          >
            <input
              type="text"
              placeholder="بحث (اسم، رقم، هوية، جوال)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: COLORS.white,
                border: `1px solid ${COLORS.gray200}`,
                borderRadius: '12px',
                padding: '12px 14px',
                color: COLORS.gray900,
                fontSize: '15px',
                outline: 'none'
              }}
            />

            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              style={{
                background: COLORS.white,
                border: `1px solid ${COLORS.gray200}`,
                borderRadius: '12px',
                padding: '12px 14px',
                color: COLORS.gray900,
                fontSize: '15px',
                outline: 'none'
              }}
            >
              <option value="">كل الفروع</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            <select
              value={stageId}
              onChange={(e) => setStageId(e.target.value)}
              disabled={!branchId}
              style={{
                background: COLORS.white,
                border: `1px solid ${COLORS.gray200}`,
                borderRadius: '12px',
                padding: '12px 14px',
                color: COLORS.gray900,
                fontSize: '15px',
                outline: 'none',
                opacity: branchId ? 1 : 0.6
              }}
            >
              <option value="">كل المراحل</option>
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              style={{
                background: COLORS.white,
                border: `1px solid ${COLORS.gray200}`,
                borderRadius: '12px',
                padding: '12px 14px',
                color: COLORS.gray900,
                fontSize: '15px',
                outline: 'none'
              }}
            >
              <option value="">كل الأقسام</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{
                background: COLORS.white,
                border: `1px solid ${COLORS.gray200}`,
                borderRadius: '12px',
                padding: '12px 14px',
                color: COLORS.gray900,
                fontSize: '15px',
                outline: 'none'
              }}
            >
              <option value="">كل الحالات</option>
              <option value="ACTIVE">نشط</option>
              <option value="ON_LEAVE">إجازة</option>
              <option value="RESIGNED">مستقيل</option>
              <option value="TERMINATED">منتهي</option>
            </select>
          </div>
        </div>

        {/* Employees List */}
        {loading ? (
          <div
            style={{
              ...cardStyle,
              padding: '28px',
              textAlign: 'center',
              color: COLORS.gray500,
              fontSize: '16px'
            }}
          >
            جاري التحميل...
          </div>
        ) : employees.length === 0 ? (
          <div
            style={{
              ...cardStyle,
              padding: '28px',
              textAlign: 'center',
              color: COLORS.gray500,
              fontSize: '16px'
            }}
          >
            لا يوجد موظفين
          </div>
        ) : (
          <div
            style={{
              ...cardStyle,
              padding: '0px',
              overflowX: 'auto'
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                color: COLORS.gray900
              }}
            >
              <thead>
                <tr style={{ background: COLORS.gray100 }}>
                  <th style={{ padding: '14px', textAlign: 'right', fontWeight: '800' }}>رقم الموظف</th>
                  <th style={{ padding: '14px', textAlign: 'right', fontWeight: '800' }}>الاسم</th>
                  <th style={{ padding: '14px', textAlign: 'right', fontWeight: '800' }}>القسم</th>
                  <th style={{ padding: '14px', textAlign: 'right', fontWeight: '800' }}>المسمى الوظيفي</th>
                  <th style={{ padding: '14px', textAlign: 'right', fontWeight: '800' }}>الجوال</th>
                  <th style={{ padding: '14px', textAlign: 'right', fontWeight: '800' }}>الراتب الأساسي</th>
                  <th style={{ padding: '14px', textAlign: 'center', fontWeight: '800' }}>الحالة</th>
                  <th style={{ padding: '14px', textAlign: 'center', fontWeight: '800' }}>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr
                    key={emp.id}
                    style={{
                      borderBottom: `1px solid ${COLORS.gray200}`
                    }}
                  >
                    <td style={{ padding: '14px', color: COLORS.gray500 }}>{emp.employeeNumber}</td>
                    <td style={{ padding: '14px', fontWeight: '800' }}>{emp.fullNameAr}</td>
                    <td style={{ padding: '14px', color: COLORS.gray500 }}>{emp.department}</td>
                    <td style={{ padding: '14px', color: COLORS.gray500 }}>{emp.position}</td>
                    <td style={{ padding: '14px', color: COLORS.gray500 }}>{emp.phone}</td>
                    <td style={{ padding: '14px', fontWeight: '800' }}>{emp.basicSalary.toLocaleString()} ر.س</td>
                    <td style={{ padding: '14px', textAlign: 'center' }}>{getStatusBadge(emp.status)}</td>
                    <td style={{ padding: '14px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link
                          href={`/hr/employees/${emp.id}`}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '10px',
                            textDecoration: 'none',
                            fontSize: '13px',
                            fontWeight: '800',
                            background: COLORS.primary,
                            color: COLORS.white,
                            border: `1px solid ${COLORS.primary}`
                          }}
                        >
                          عرض
                        </Link>

                        <Link
                          href={`/hr/employees/${emp.id}/files`}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '10px',
                            textDecoration: 'none',
                            fontSize: '13px',
                            fontWeight: '800',
                            background: COLORS.gray100,
                            color: COLORS.gray900,
                            border: `1px solid ${COLORS.gray200}`
                          }}
                        >
                          📂 ملفات
                        </Link>

                        {currentUserRole === 'ADMIN' && emp.userId && (
                          <button
                            type="button"
                            onClick={() => handleLoginAs(emp.userId!, emp.fullNameAr)}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '10px',
                              border: `1px solid ${COLORS.primary}`,
                              background: COLORS.white,
                              color: COLORS.primary,
                              fontSize: '13px',
                              fontWeight: '800',
                              cursor: 'pointer'
                            }}
                          >
                            🔄 دخول
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
