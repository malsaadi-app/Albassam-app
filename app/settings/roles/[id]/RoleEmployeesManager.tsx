'use client';

import { useState, useEffect } from 'react';
import ReactSelect from 'react-select';

type Employee = {
  id: string;
  fullNameAr: string;
  employeeNumber: string;
  position: string;
  department: string;
};

type Props = {
  roleId: string;
  roleName: string;
  roleNameAr: string;
  initialEmployees: Employee[];
};

export default function RoleEmployeesManager({ roleId, roleName, roleNameAr, initialEmployees }: Props) {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  // Fetch all employees for selection
  useEffect(() => {
    fetchAllEmployees();
  }, []);

  const fetchAllEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hr/employees?status=ACTIVE');
      if (res.ok) {
        const data = await res.json();
        setAllEmployees(data.employees || []);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      alert('فشل تحميل قائمة الموظفين');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployees = async () => {
    if (selectedEmployees.length === 0) {
      alert('الرجاء اختيار موظف واحد على الأقل');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/settings/roles/${roleId}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeIds: selectedEmployees })
      });

      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees);
        setSelectedEmployees([]);
        alert(`✅ تمت إضافة ${selectedEmployees.length} موظف بنجاح`);
      } else {
        const error = await res.json();
        alert(`❌ خطأ: ${error.error || 'فشلت العملية'}`);
      }
    } catch (error) {
      console.error('Error adding employees:', error);
      alert('❌ فشلت عملية الإضافة');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveEmployee = async (employeeId: string) => {
    if (!confirm('هل أنت متأكد من إزالة هذا الموظف من الدور؟')) {
      return;
    }

    setRemoving(employeeId);
    try {
      const res = await fetch(`/api/settings/roles/${roleId}/employees`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeIds: [employeeId] })
      });

      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees);
        alert('✅ تمت إزالة الموظف بنجاح');
      } else {
        const error = await res.json();
        alert(`❌ خطأ: ${error.error || 'فشلت العملية'}`);
      }
    } catch (error) {
      console.error('Error removing employee:', error);
      alert('❌ فشلت عملية الإزالة');
    } finally {
      setRemoving(null);
    }
  };

  // Filter out employees already assigned to this role
  const availableEmployees = allEmployees.filter(
    emp => !employees.some(e => e.id === emp.id)
  );

  const employeeOptions = availableEmployees.map(emp => ({
    value: emp.id,
    label: `${emp.fullNameAr} (${emp.employeeNumber}) - ${emp.position || 'غير محدد'}`
  }));

  return (
    <div>
      <style>{`
        .employee-card:hover {
          border-color: #667eea !important;
          background: #edf2f7 !important;
        }
      `}</style>

      {/* Add Employees Section */}
      <div style={{ 
        background: '#f7fafc', 
        border: '2px dashed #cbd5e0', 
        borderRadius: '0.75rem', 
        padding: '1.5rem', 
        marginBottom: '1.5rem' 
      }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1a202c', marginBottom: '1rem' }}>
          ➕ إضافة موظفين للدور
        </h3>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#4a5568' }}>
            اختر الموظفين (يمكن اختيار أكثر من موظف)
          </label>
          <ReactSelect
            isMulti
            options={employeeOptions}
            value={employeeOptions.filter(opt => selectedEmployees.includes(opt.value))}
            onChange={(selected) => setSelectedEmployees(selected ? selected.map(s => s.value) : [])}
            placeholder="ابحث واختر الموظفين..."
            noOptionsMessage={() => loading ? 'جاري التحميل...' : 'لا توجد موظفين متاحين'}
            isLoading={loading}
            isDisabled={saving}
            styles={{
              control: (base) => ({
                ...base,
                borderRadius: '0.5rem',
                borderColor: '#cbd5e0',
                padding: '0.25rem',
                fontSize: '0.95rem'
              }),
              multiValue: (base) => ({
                ...base,
                background: '#667eea',
                borderRadius: '0.25rem'
              }),
              multiValueLabel: (base) => ({
                ...base,
                color: 'white',
                fontWeight: '600'
              }),
              multiValueRemove: (base) => ({
                ...base,
                color: 'white',
                ':hover': {
                  background: '#5568d3',
                  color: 'white'
                }
              })
            }}
          />
        </div>

        <button
          onClick={handleAddEmployees}
          disabled={selectedEmployees.length === 0 || saving}
          style={{
            background: selectedEmployees.length === 0 ? '#cbd5e0' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: selectedEmployees.length === 0 ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
            transition: 'all 0.2s'
          }}
        >
          {saving ? '⏳ جاري الحفظ...' : `➕ إضافة ${selectedEmployees.length > 0 ? `(${selectedEmployees.length})` : ''} موظف`}
        </button>

        {selectedEmployees.length > 0 && (
          <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#718096' }}>
            ✨ سيتم تعيين <strong>{selectedEmployees.length}</strong> موظف للدور: <strong>{roleNameAr}</strong>
          </p>
        )}
      </div>

      {/* Current Employees List */}
      <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1a202c', marginBottom: '1rem' }}>
        👥 الموظفون الحاليون ({employees.length})
      </h3>

      {employees.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem 1rem',
          color: '#a0aec0',
          fontSize: '1rem'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👤</div>
          <p>لا يوجد موظفون معينون لهذا الدور حالياً</p>
          <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
            قم بإضافة موظفين من القائمة أعلاه
          </p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '1rem' 
        }}>
          {employees.map(emp => (
            <div
              key={emp.id}
              className="employee-card"
              style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '0.75rem',
                padding: '1.25rem',
                transition: 'all 0.2s',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', color: '#1a202c', marginBottom: '0.5rem', fontSize: '1.05rem' }}>
                    {emp.fullNameAr}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#718096', marginBottom: '0.25rem' }}>
                    📋 {emp.employeeNumber}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#718096', marginBottom: '0.25rem' }}>
                    💼 {emp.position || 'غير محدد'}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#718096' }}>
                    🏢 {emp.department || 'غير محدد'}
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveEmployee(emp.id)}
                  disabled={removing === emp.id}
                  style={{
                    background: removing === emp.id ? '#cbd5e0' : '#fff5f5',
                    color: removing === emp.id ? '#718096' : '#f56565',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.5rem',
                    cursor: removing === emp.id ? 'not-allowed' : 'pointer',
                    fontSize: '1.25rem',
                    transition: 'all 0.2s',
                    marginRight: '0.5rem'
                  }}
                  title="إزالة من الدور"
                  onMouseEnter={(e) => {
                    if (removing !== emp.id) {
                      e.currentTarget.style.background = '#fed7d7';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (removing !== emp.id) {
                      e.currentTarget.style.background = '#fff5f5';
                    }
                  }}
                >
                  {removing === emp.id ? '⏳' : '🗑️'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
