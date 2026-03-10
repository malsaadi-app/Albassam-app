'use client';

import { useState, useMemo } from 'react';

type User = {
  id: string;
  username: string;
  displayName: string;
  roleId: string | null;
  systemRole: {
    name: string;
    nameAr: string;
  } | null;
};

type Props = {
  roleId: string;
  roleName: string;
  roleNameAr: string;
  initialUsers: User[];
  allUsers: User[];
};

export default function RoleUsersManager({ roleId, roleName, roleNameAr, initialUsers, allUsers }: Props) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  // Get assigned user IDs
  const assignedUserIds = new Set(users.map(u => u.id));

  // Filter all users by search query (including assigned ones for visibility)
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) {
      // Show only available users when no search
      return allUsers.filter(u => !assignedUserIds.has(u.id));
    }
    
    // When searching, show ALL users (including assigned)
    const query = searchQuery.toLowerCase();
    return allUsers.filter(u =>
      u.displayName.toLowerCase().includes(query) ||
      u.username.toLowerCase().includes(query) ||
      u.systemRole?.nameAr?.includes(query) ||
      u.systemRole?.name?.toLowerCase().includes(query)
    );
  }, [allUsers, assignedUserIds, searchQuery]);

  const handleToggleUser = (userId: string) => {
    const newSelected = new Set(selectedUserIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUserIds(newSelected);
  };

  const handleSelectAll = () => {
    // Get only selectable users (not already assigned)
    const selectableUsers = filteredUsers.filter(u => !assignedUserIds.has(u.id));
    const selectableIds = selectableUsers.map(u => u.id);
    
    if (selectedUserIds.size === selectableIds.length && selectableIds.length > 0) {
      // Deselect all
      setSelectedUserIds(new Set());
    } else {
      // Select all selectable
      setSelectedUserIds(new Set(selectableIds));
    }
  };

  const handleAssignUsers = async () => {
    if (selectedUserIds.size === 0) {
      alert('الرجاء اختيار مستخدمين');
      return;
    }

    setSaving(true);
    try {
      const userIds = Array.from(selectedUserIds);
      const res = await fetch(`/api/settings/roles/${roleId}/users/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds })
      });

      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setSelectedUserIds(new Set());
        setSearchQuery('');
        alert(`✅ تم ربط ${userIds.length} مستخدمين بالدور بنجاح`);
      } else {
        const error = await res.json();
        alert(`❌ خطأ: ${error.error || 'فشلت العملية'}`);
      }
    } catch (error) {
      console.error('Error assigning users:', error);
      alert('❌ فشلت عملية الربط');
    } finally {
      setSaving(false);
    }
  };

  const handleUnassignUser = async (userId: string) => {
    if (!confirm('هل أنت متأكد من إلغاء ربط هذا المستخدم من الدور؟\n\nسيفقد المستخدم جميع الصلاحيات المرتبطة بهذا الدور.')) {
      return;
    }

    setRemoving(userId);
    try {
      const res = await fetch(`/api/settings/roles/${roleId}/users?userId=${userId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        alert(`✅ تم إلغاء الربط بنجاح`);
      } else {
        const error = await res.json();
        alert(`❌ خطأ: ${error.error || 'فشلت العملية'}`);
      }
    } catch (error) {
      console.error('Error unassigning user:', error);
      alert('❌ فشلت عملية الإلغاء');
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div>
      {/* Add Users Section */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
        padding: '1.5rem',
        borderRadius: '0.75rem',
        marginBottom: '1.5rem',
        border: '1px solid rgba(102, 126, 234, 0.1)'
      }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1a202c', marginBottom: '1.5rem' }}>
          ➕ ربط مستخدمين جدد
        </h3>
        
        {allUsers.filter(u => !assignedUserIds.has(u.id)).length === 0 ? (
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.8)',
            padding: '1rem',
            borderRadius: '0.5rem',
            color: '#718096',
            textAlign: 'center'
          }}>
            ✅ تم ربط جميع المستخدمين بهذا الدور
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Search Box */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#4a5568', marginBottom: '0.5rem' }}>
                🔍 ابحث عن مستخدم
              </label>
              <input
                type="text"
                placeholder="اكتب الاسم أو اسم المستخدم..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '2px solid #e2e8f0',
                  fontSize: '1rem',
                  background: 'white',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            {/* Select All Checkbox */}
            {(() => {
              const selectableUsers = filteredUsers.filter(u => !assignedUserIds.has(u.id));
              const selectableCount = selectableUsers.length;
              
              if (filteredUsers.length === 0) return null;
              
              return (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  background: 'rgba(102, 126, 234, 0.05)',
                  borderRadius: '0.5rem',
                  cursor: selectableCount > 0 ? 'pointer' : 'not-allowed',
                  opacity: selectableCount > 0 ? 1 : 0.6
                }}
                onClick={selectableCount > 0 ? handleSelectAll : undefined}
                >
                  <input
                    type="checkbox"
                    checked={selectedUserIds.size === selectableCount && selectableCount > 0}
                    onChange={handleSelectAll}
                    disabled={selectableCount === 0}
                    style={{
                      cursor: selectableCount > 0 ? 'pointer' : 'not-allowed',
                      width: '18px',
                      height: '18px'
                    }}
                  />
                  <span style={{ fontWeight: '600', color: '#4a5568' }}>
                    {selectableCount === 0 
                      ? `جميع النتائج مربوطة (${filteredUsers.length})`
                      : selectedUserIds.size === selectableCount && selectableCount > 0
                        ? `✅ تم تحديد الكل (${selectableCount})`
                        : `☐ تحديد جميع النتائج (${selectableCount})`
                    }
                  </span>
                </div>
              );
            })()}

            {/* Users List */}
            <div style={{
              maxHeight: '300px',
              overflowY: 'auto',
              border: '1px solid #e2e8f0',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              background: 'white'
            }}>
              {filteredUsers.length === 0 ? (
                <div style={{ color: '#a0aec0', textAlign: 'center', padding: '1rem' }}>
                  لا توجد نتائج بحث
                </div>
              ) : (
                filteredUsers.map(user => {
                  const isAlreadyAssigned = assignedUserIds.has(user.id);
                  const hasOtherRole = user.roleId && user.roleId !== roleId;
                  
                  return (
                    <div
                      key={user.id}
                      onClick={() => !isAlreadyAssigned && handleToggleUser(user.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        cursor: isAlreadyAssigned ? 'not-allowed' : 'pointer',
                        background: isAlreadyAssigned 
                          ? 'rgba(72, 187, 120, 0.1)' 
                          : selectedUserIds.has(user.id) 
                            ? 'rgba(102, 126, 234, 0.1)' 
                            : 'transparent',
                        transition: 'all 0.2s',
                        borderLeft: isAlreadyAssigned
                          ? '3px solid #48bb78'
                          : selectedUserIds.has(user.id) 
                            ? '3px solid #667eea' 
                            : '3px solid transparent',
                        opacity: isAlreadyAssigned ? 0.7 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!isAlreadyAssigned) {
                          e.currentTarget.style.background = 'rgba(102, 126, 234, 0.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isAlreadyAssigned) {
                          e.currentTarget.style.background = selectedUserIds.has(user.id) ? 'rgba(102, 126, 234, 0.1)' : 'transparent';
                        } else {
                          e.currentTarget.style.background = 'rgba(72, 187, 120, 0.1)';
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isAlreadyAssigned || selectedUserIds.has(user.id)}
                        disabled={isAlreadyAssigned}
                        onChange={() => !isAlreadyAssigned && handleToggleUser(user.id)}
                        style={{
                          cursor: isAlreadyAssigned ? 'not-allowed' : 'pointer',
                          width: '18px',
                          height: '18px'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontWeight: '600', 
                          color: '#1a202c',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          flexWrap: 'wrap'
                        }}>
                          <span>{user.displayName}</span>
                          {isAlreadyAssigned && (
                            <span style={{
                              fontSize: '0.75rem',
                              background: '#48bb78',
                              color: 'white',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontWeight: '600'
                            }}>
                              ✓ مربوط
                            </span>
                          )}
                          {hasOtherRole && user.systemRole && (
                            <span style={{
                              fontSize: '0.75rem',
                              background: '#ed8936',
                              color: 'white',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontWeight: '600'
                            }}>
                              {user.systemRole.nameAr || user.systemRole.name}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#718096' }}>
                          @{user.username}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Action Buttons */}
            {selectedUserIds.size > 0 && (
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={handleAssignUsers}
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1.5rem',
                    background: saving ? '#cbd5e0' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: saving ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    if (!saving) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = saving ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.3)';
                  }}
                >
                  {saving ? `⏳ جاري ربط ${selectedUserIds.size} مستخدمين...` : `✅ ربط ${selectedUserIds.size} مستخدمين`}
                </button>
                <button
                  onClick={() => setSelectedUserIds(new Set())}
                  disabled={saving}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#f0f0f0',
                    color: '#4a5568',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  ❌ إلغاء
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Current Users List */}
      <div>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1a202c', marginBottom: '1rem' }}>
          👤 المستخدمون المرتبطون ({users.length})
        </h3>
        
        {users.length === 0 ? (
          <div style={{ 
            background: '#fffbeb',
            border: '1px solid #fcd34d',
            padding: '1rem',
            borderRadius: '0.5rem',
            color: '#92400e',
            textAlign: 'center'
          }}>
            ⚠️ لا يوجد مستخدمون مرتبطون بهذا الدور
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {users.map(user => (
              <div
                key={user.id}
                style={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                  transition: 'all 0.2s',
                  position: 'relative' as any
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#667eea';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontWeight: 'bold', color: '#1a202c', fontSize: '1.05rem', marginBottom: '0.25rem' }}>
                    {user.displayName}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#718096' }}>
                    @{user.username}
                  </div>
                </div>
                
                <button
                  onClick={() => handleUnassignUser(user.id)}
                  disabled={removing === user.id}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: removing === user.id ? '#cbd5e0' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: removing === user.id ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (removing !== user.id) {
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {removing === user.id ? '⏳ جاري الإلغاء...' : '🗑️ إلغاء الربط'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
