'use client';

import { useState, useEffect } from 'react';
import ReactSelect, { components } from 'react-select';

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
  const [searchValue, setSearchValue] = useState<string>('');
  const [filteredOptions, setFilteredOptions] = useState<any[]>([]);

  // Fetch all employees for selection
  useEffect(() => {
    fetchAllEmployees();
  }, []);

  const fetchAllEmployees = async () => {
    setLoading(true);
    try {
      // Fetch from dedicated endpoint with better error handling
      const res = await fetch('/api/hr/employees?limit=1000&status=ACTIVE&fields=id,fullNameAr,employeeNumber,position,department');
      if (res.ok) {
        const data = await res.json();
        console.log('✅ Fetched employees:', data.employees?.length || 0);
        setAllEmployees(data.employees || []);
      } else {
        console.error('❌ Failed to fetch employees:', res.status);
        // Fallback: try without query params
        const fallbackRes = await fetch('/api/hr/employees');
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          setAllEmployees(fallbackData.employees || []);
        }
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      alert('فشل تحميل قائمة الموظفين - يرجى المحاولة مرة أخرى');
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

  // Add "Select All" option at the beginning
  const selectAllOption = {
    value: '__select_all__',
    label: '✨ اختيار الكل'
  };
  
  const employeeOptions = [
    selectAllOption,
    ...availableEmployees.map(emp => ({
      value: emp.id,
      label: `${emp.fullNameAr} • ${emp.employeeNumber}${emp.position ? ` • ${emp.position}` : ''}`
    }))
  ];
  
  // Handle select/deselect all
  const handleSelectChange = (selected: any) => {
    if (!selected) {
      setSelectedEmployees([]);
      return;
    }
    
    const values = selected.map((s: any) => s.value);
    
    // If "Select All" was clicked
    if (values.includes('__select_all__')) {
      // If all are already selected, deselect all
      if (selectedEmployees.length === availableEmployees.length) {
        setSelectedEmployees([]);
      } else {
        // Select all available employees
        setSelectedEmployees(availableEmployees.map(emp => emp.id));
      }
    } else {
      // Normal selection
      setSelectedEmployees(values.filter((v: string) => v !== '__select_all__'));
    }
  };

  // Custom MenuList with Select Search Results button
  const MenuList = (props: any) => {
    const visibleOptions = props.children?.filter((child: any) => 
      child && child.props && child.props.data && child.props.data.value !== '__select_all__'
    ) || [];
    
    const visibleCount = visibleOptions.length;
    const hasSearch = searchValue && searchValue.trim().length > 0;
    
    return (
      <components.MenuList {...props}>
        {hasSearch && visibleCount > 0 && (
          <div style={{ 
            padding: '0.5rem 0.75rem',
            borderBottom: '2px solid #e2e8f0',
            marginBottom: '0.5rem',
            background: 'linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%)',
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const visibleIds = visibleOptions.map((opt: any) => opt.props.data.value);
                setSelectedEmployees(visibleIds);
              }}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.95rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span>⚡</span>
              <span>تحديد نتائج البحث ({visibleCount} موظف)</span>
            </button>
          </div>
        )}
        {props.children}
      </components.MenuList>
    );
  };

  // Custom Option component with checkbox
  const Option = (props: any) => {
    const isSelectAll = props.value === '__select_all__';
    
    if (isSelectAll) {
      return (
        <components.Option {...props}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            padding: '0.25rem 0',
            borderBottom: '2px solid #e2e8f0',
            marginBottom: '0.5rem',
            fontWeight: 'bold',
            color: '#667eea'
          }}>
            <input
              type="checkbox"
              checked={selectedEmployees.length === availableEmployees.length && availableEmployees.length > 0}
              readOnly
              style={{
                width: '18px',
                height: '18px',
                cursor: 'pointer',
                accentColor: '#667eea'
              }}
            />
            <span>✨ اختيار الكل ({availableEmployees.length} موظف)</span>
          </div>
        </components.Option>
      );
    }
    
    return (
      <components.Option {...props}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <input
            type="checkbox"
            checked={props.isSelected}
            readOnly
            style={{
              width: '18px',
              height: '18px',
              cursor: 'pointer',
              accentColor: '#667eea'
            }}
          />
          <span>{props.label}</span>
        </div>
      </components.Option>
    );
  };

  return (
    <div>
      <style>{`
        .employee-card {
          transition: all 0.2s ease;
        }
        .employee-card:hover {
          border-color: #667eea !important;
          background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%) !important;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15) !important;
          transform: translateY(-2px);
        }
        .employee-card:active {
          transform: translateY(0);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in {
          animation: fadeIn 0.3s ease;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .loading-skeleton {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: pulse 1.5s ease-in-out infinite;
          border-radius: 0.5rem;
        }
      `}</style>

      {/* Add Employees Section */}
      <div 
        className="fade-in"
        style={{ 
          background: 'linear-gradient(135deg, #f7fafc 0%, #ffffff 100%)', 
          border: '2px dashed #cbd5e0', 
          borderRadius: '1rem', 
          padding: '1.5rem', 
          marginBottom: '2rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1a202c', marginBottom: '0.5rem' }}>
                ➕ إضافة موظفين للدور
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
                💡 القائمة تبقى مفتوحة - اختر عدة موظفين ثم اضغط إضافة
              </p>
            </div>
            {selectedEmployees.length > 0 && (
              <button
                onClick={() => setSelectedEmployees([])}
                style={{
                  background: '#fff5f5',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  borderRadius: '0.5rem',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#fee2e2';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#fff5f5';
                }}
              >
                ✕ مسح الكل ({selectedEmployees.length})
              </button>
            )}
          </div>
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#4a5568' }}>
            اختر الموظفين (القائمة تبقى مفتوحة)
          </label>
          <ReactSelect
            isMulti
            components={{ Option, MenuList }}
            options={employeeOptions}
            value={employeeOptions.filter(opt => selectedEmployees.includes(opt.value) && opt.value !== '__select_all__')}
            onChange={handleSelectChange}
            onInputChange={(value, action) => {
              if (action.action === 'input-change') {
                setSearchValue(value);
              }
            }}
            filterOption={(option, searchText) => {
              if (option.value === '__select_all__') {
                return !searchText || searchText.trim().length === 0;
              }
              return option.label.toLowerCase().includes(searchText.toLowerCase());
            }}
            placeholder={loading ? '⏳ جاري تحميل الموظفين...' : '🔍 ابحث واختر عدة موظفين... (القائمة تبقى مفتوحة)'}
            noOptionsMessage={() => loading ? '⏳ جاري التحميل...' : availableEmployees.length === 0 ? '✅ كل الموظفين معينون لهذا الدور' : 'لا توجد نتائج'}
            loadingMessage={() => '⏳ جاري البحث...'}
            isLoading={loading}
            isDisabled={saving || loading}
            menuPlacement="auto"
            menuPosition="fixed"
            maxMenuHeight={450}
            hideSelectedOptions={false}
            closeMenuOnSelect={false}
            isSearchable={true}
            isClearable={false}
            styles={{
              control: (base, state) => ({
                ...base,
                borderRadius: '0.75rem',
                borderWidth: '2px',
                borderColor: state.isFocused ? '#667eea' : '#e2e8f0',
                padding: '0.5rem',
                fontSize: '1rem',
                minHeight: '56px',
                boxShadow: state.isFocused ? '0 0 0 3px rgba(102, 126, 234, 0.1)' : 'none',
                transition: 'all 0.2s',
                cursor: 'text',
                background: 'white'
              }),
              valueContainer: (base) => ({
                ...base,
                padding: '4px 8px',
                gap: '6px',
                maxHeight: '120px',
                overflowY: 'auto'
              }),
              multiValue: (base) => ({
                ...base,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '0.5rem',
                padding: '2px 6px'
              }),
              multiValueLabel: (base) => ({
                ...base,
                color: 'white',
                fontWeight: '600',
                fontSize: '0.9rem',
                padding: '4px 6px'
              }),
              multiValueRemove: (base) => ({
                ...base,
                color: 'white',
                borderRadius: '0 0.5rem 0.5rem 0',
                ':hover': {
                  background: 'rgba(0,0,0,0.2)',
                  color: 'white'
                }
              }),
              menu: (base) => ({
                ...base,
                borderRadius: '0.75rem',
                boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                border: '1px solid #e2e8f0',
                marginTop: '8px',
                overflow: 'hidden',
                zIndex: 9999
              }),
              menuList: (base) => ({
                ...base,
                padding: '8px',
                maxHeight: '300px'
              }),
              option: (base, state) => ({
                ...base,
                borderRadius: '0.5rem',
                padding: '12px 16px',
                margin: '2px 0',
                fontSize: '0.95rem',
                cursor: 'pointer',
                background: state.isSelected 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : state.isFocused
                  ? '#f0f4ff'
                  : 'white',
                color: state.isSelected ? 'white' : '#1a202c',
                transition: 'all 0.15s',
                ':active': {
                  background: '#667eea'
                }
              }),
              placeholder: (base) => ({
                ...base,
                color: '#a0aec0',
                fontSize: '0.95rem'
              }),
              input: (base) => ({
                ...base,
                fontSize: '1rem',
                color: '#1a202c'
              }),
              indicatorSeparator: () => ({ display: 'none' }),
              dropdownIndicator: (base, state) => ({
                ...base,
                color: state.isFocused ? '#667eea' : '#cbd5e0',
                transition: 'all 0.2s',
                ':hover': {
                  color: '#667eea'
                }
              }),
              clearIndicator: (base) => ({
                ...base,
                color: '#cbd5e0',
                ':hover': {
                  color: '#f56565'
                }
              })
            }}
          />
        </div>

        <button
          onClick={handleAddEmployees}
          disabled={selectedEmployees.length === 0 || saving}
          style={{
            background: selectedEmployees.length === 0 ? '#e2e8f0' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: selectedEmployees.length === 0 ? '#a0aec0' : 'white',
            padding: '1rem 2rem',
            borderRadius: '0.75rem',
            border: 'none',
            fontSize: '1.05rem',
            fontWeight: 'bold',
            cursor: selectedEmployees.length === 0 ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
            transition: 'all 0.2s',
            boxShadow: selectedEmployees.length > 0 ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none',
            transform: saving ? 'scale(0.98)' : 'scale(1)',
            width: '100%',
            maxWidth: '300px'
          }}
          onMouseEnter={(e) => {
            if (selectedEmployees.length > 0 && !saving) {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = selectedEmployees.length > 0 ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none';
          }}
        >
          {saving ? '⏳ جاري الحفظ...' : selectedEmployees.length > 0 ? `➕ إضافة ${selectedEmployees.length} موظف` : '➕ إضافة موظف'}
        </button>

        {selectedEmployees.length > 0 && (
          <div className="fade-in" style={{ 
            marginTop: '1rem', 
            padding: '1rem',
            background: 'linear-gradient(135deg, #e0e7ff 0%, #f0f4ff 100%)',
            borderRadius: '0.75rem',
            border: '1px solid #c7d2fe',
            fontSize: '0.95rem',
            color: '#4338ca'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>✨</span>
              <div>
                <strong>سيتم تعيين {selectedEmployees.length} موظف</strong>
                <div style={{ fontSize: '0.875rem', color: '#6366f1', marginTop: '0.25rem' }}>
                  للدور: {roleNameAr}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Current Employees List */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1a202c', margin: 0 }}>
          👥 الموظفون الحاليون
        </h3>
        <span style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '0.5rem 1rem',
          borderRadius: '2rem',
          fontSize: '0.9rem',
          fontWeight: 'bold'
        }}>
          {employees.length}
        </span>
      </div>

      {loading && employees.length === 0 ? (
        // Loading skeleton
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="loading-skeleton" style={{ height: '140px', borderRadius: '1rem' }} />
          ))}
        </div>
      ) : employees.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          background: 'linear-gradient(135deg, #f7fafc 0%, #ffffff 100%)',
          borderRadius: '1rem',
          border: '2px dashed #e2e8f0'
        }}>
          <div style={{ 
            fontSize: '4rem', 
            marginBottom: '1.5rem',
            filter: 'grayscale(1)',
            opacity: 0.5
          }}>👥</div>
          <p style={{ 
            fontSize: '1.125rem', 
            fontWeight: '600',
            color: '#475569',
            marginBottom: '0.5rem'
          }}>
            لا يوجد موظفون معينون لهذا الدور
          </p>
          <p style={{ 
            fontSize: '0.95rem', 
            color: '#94a3b8',
            marginTop: '0.75rem',
            lineHeight: '1.6'
          }}>
            استخدم القائمة أعلاه لإضافة موظفين<br />
            يمكنك إضافة عدة موظفين مرة واحدة
          </p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', 
          gap: '1rem'
        }}>
          {employees.map((emp, idx) => (
            <div
              key={emp.id}
              className="employee-card fade-in"
              style={{
                background: 'white',
                border: '2px solid #e2e8f0',
                borderRadius: '1rem',
                padding: '1.25rem',
                position: 'relative',
                animationDelay: `${idx * 50}ms`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    fontWeight: 'bold', 
                    color: '#1a202c', 
                    marginBottom: '0.75rem', 
                    fontSize: '1.1rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {emp.fullNameAr}
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '0.5rem',
                    fontSize: '0.9rem',
                    color: '#64748b'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ 
                        background: '#f1f5f9', 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '0.375rem',
                        fontWeight: '600',
                        color: '#475569'
                      }}>
                        {emp.employeeNumber}
                      </span>
                    </div>
                    {emp.position && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.375rem'
                      }}>
                        <span>💼</span>
                        <span>{emp.position}</span>
                      </div>
                    )}
                    {emp.department && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.375rem'
                      }}>
                        <span>🏢</span>
                        <span>{emp.department}</span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveEmployee(emp.id)}
                  disabled={removing === emp.id}
                  style={{
                    background: removing === emp.id ? '#e2e8f0' : '#fef2f2',
                    color: removing === emp.id ? '#94a3b8' : '#dc2626',
                    border: removing === emp.id ? '2px solid #cbd5e0' : '2px solid #fecaca',
                    borderRadius: '0.75rem',
                    padding: '0.75rem',
                    cursor: removing === emp.id ? 'not-allowed' : 'pointer',
                    fontSize: '1.25rem',
                    transition: 'all 0.2s',
                    flexShrink: 0,
                    width: '44px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="إزالة من الدور"
                  onMouseEnter={(e) => {
                    if (removing !== emp.id) {
                      e.currentTarget.style.background = '#fee2e2';
                      e.currentTarget.style.borderColor = '#fca5a5';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (removing !== emp.id) {
                      e.currentTarget.style.background = '#fef2f2';
                      e.currentTarget.style.borderColor = '#fecaca';
                      e.currentTarget.style.transform = 'scale(1)';
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
