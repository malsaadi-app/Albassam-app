'use client';

import { useState } from 'react';

interface Permission {
  id: string;
  name: string;
  nameAr: string;
  nameEn: string;
  module: string;
}

interface Props {
  roleId: string;
  roleName: string;
  permissionsByModule: { [key: string]: Permission[] };
  currentPermissionIds: string[];
}

const moduleNames: { [key: string]: { ar: string; icon: string } } = {
  employees: { ar: 'الموظفون', icon: '👥' },
  hr: { ar: 'الموارد البشرية', icon: '📄' },
  attendance: { ar: 'الحضور والانصراف', icon: '⏰' },
  positions: { ar: 'الوظائف', icon: '🎯' },
  reports: { ar: 'التقارير', icon: '📊' },
  procurement: { ar: 'المشتريات', icon: '📦' },
  maintenance: { ar: 'الصيانة', icon: '🛠️' },
  settings: { ar: 'الإعدادات', icon: '⚙️' },
  tasks: { ar: 'المهام', icon: '📋' },
  branches: { ar: 'الفروع', icon: '🏢' },
};

export default function RolePermissionsManager({ roleId, roleName, permissionsByModule, currentPermissionIds }: Props) {
  // Only SUPER_ADMIN cannot be edited
  const isReadOnly = roleName === 'SUPER_ADMIN';
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set(currentPermissionIds));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(Object.keys(permissionsByModule)));

  const togglePermission = (permId: string) => {
    if (isReadOnly) return; // لا يمكن تعديل أدوار النظام
    
    const newSelected = new Set(selectedPermissions);
    if (newSelected.has(permId)) {
      newSelected.delete(permId);
    } else {
      newSelected.add(permId);
    }
    setSelectedPermissions(newSelected);
  };

  const selectAllInModule = (module: string) => {
    if (isReadOnly) return;
    
    const newSelected = new Set(selectedPermissions);
    permissionsByModule[module].forEach(perm => {
      newSelected.add(perm.id);
    });
    setSelectedPermissions(newSelected);
  };

  const deselectAllInModule = (module: string) => {
    if (isReadOnly) return;
    
    const newSelected = new Set(selectedPermissions);
    permissionsByModule[module].forEach(perm => {
      newSelected.delete(perm.id);
    });
    setSelectedPermissions(newSelected);
  };

  const toggleModule = (module: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(module)) {
      newExpanded.delete(module);
    } else {
      newExpanded.add(module);
    }
    setExpandedModules(newExpanded);
  };

  const savePermissions = async () => {
    if (isReadOnly) {
      setMessage({ type: 'error', text: 'لا يمكن تعديل أدوار النظام' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/settings/roles/${roleId}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permissionIds: Array.from(selectedPermissions)
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: '✅ تم حفظ الصلاحيات بنجاح' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error('فشل الحفظ');
      }
    } catch (error) {
      setMessage({ type: 'error', text: '❌ حدث خطأ أثناء الحفظ' });
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = JSON.stringify(Array.from(selectedPermissions).sort()) !== 
                     JSON.stringify(currentPermissionIds.sort());

  return (
    <div>
      {/* Save Button */}
      {!isReadOnly && hasChanges && (
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ color: 'white', fontWeight: 'bold' }}>
            📝 لديك تغييرات غير محفوظة
          </span>
          <button
            onClick={savePermissions}
            disabled={saving}
            style={{
              background: 'white',
              color: '#667eea',
              padding: '0.5rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontWeight: 'bold',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1
            }}
          >
            {saving ? '⏳ جاري الحفظ...' : '💾 حفظ التغييرات'}
          </button>
        </div>
      )}

      {/* Message */}
      {message && (
        <div style={{
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem',
          background: message.type === 'success' ? '#c6f6d5' : '#fed7d7',
          color: message.type === 'success' ? '#22543d' : '#742a2a',
          fontWeight: 'bold'
        }}>
          {message.text}
        </div>
      )}

      {/* System Role Warning */}
      {isReadOnly && (
        <div style={{
          background: '#fff5f5',
          border: '2px solid #fc8181',
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem',
          color: '#742a2a'
        }}>
          🔒 <strong>تحذير:</strong> دور المدير العام محمي ولا يمكن تعديل صلاحياته
        </div>
      )}

      {/* Permissions by Module */}
      {Object.keys(permissionsByModule).map(module => {
        const modulePerms = permissionsByModule[module];
        const selectedCount = modulePerms.filter(p => selectedPermissions.has(p.id)).length;
        const isExpanded = expandedModules.has(module);
        const moduleInfo = moduleNames[module] || { ar: module, icon: '📦' };

        return (
          <div key={module} style={{
            border: '1px solid #e2e8f0',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
            overflow: 'hidden'
          }}>
            {/* Module Header */}
            <div
              onClick={() => toggleModule(module)}
              style={{
                background: '#f7fafc',
                padding: '1rem',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{moduleInfo.icon}</span>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#1a202c' }}>
                    {moduleInfo.ar}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#718096' }}>
                    {selectedCount} من {modulePerms.length} صلاحية
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {!isReadOnly && isExpanded && (
                  <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => selectAllInModule(module)}
                      style={{
                        background: '#48bb78',
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.25rem',
                        border: 'none',
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      ✓ الكل
                    </button>
                    <button
                      onClick={() => deselectAllInModule(module)}
                      style={{
                        background: '#e2e8f0',
                        color: '#4a5568',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.25rem',
                        border: 'none',
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      ✗ لا شيء
                    </button>
                  </div>
                )}
                <span style={{ fontSize: '1.25rem', color: '#cbd5e0' }}>
                  {isExpanded ? '▼' : '◀'}
                </span>
              </div>
            </div>

            {/* Permissions List */}
            {isExpanded && (
              <div style={{ padding: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.75rem' }}>
                  {modulePerms.map(perm => {
                    const isSelected = selectedPermissions.has(perm.id);
                    
                    return (
                      <label
                        key={perm.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.75rem',
                          borderRadius: '0.5rem',
                          background: isSelected ? '#ebf8ff' : '#f7fafc',
                          border: `2px solid ${isSelected ? '#4299e1' : '#e2e8f0'}`,
                          cursor: isReadOnly ? 'not-allowed' : 'pointer',
                          opacity: isReadOnly ? 0.6 : 1,
                          transition: 'all 0.2s'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => togglePermission(perm.id)}
                          disabled={isReadOnly}
                          style={{
                            width: '1.25rem',
                            height: '1.25rem',
                            cursor: isReadOnly ? 'not-allowed' : 'pointer'
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 'bold', color: '#1a202c', fontSize: '0.9rem' }}>
                            {perm.nameAr}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#718096' }}>
                            {perm.name}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Summary */}
      <div style={{
        background: '#f7fafc',
        padding: '1rem',
        borderRadius: '0.5rem',
        marginTop: '1.5rem',
        textAlign: 'center',
        color: '#718096'
      }}>
        <strong style={{ color: '#667eea', fontSize: '1.25rem' }}>
          {selectedPermissions.size}
        </strong> صلاحية مختارة من أصل <strong>{Object.values(permissionsByModule).flat().length}</strong>
      </div>
    </div>
  );
}
