'use client';

import { useState } from 'react';

type User = {
  id: string;
  username: string;
  displayName: string;
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
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  // Get available users (not already assigned to this role)
  const assignedUserIds = new Set(users.map(u => u.id));
  const availableUsers = allUsers.filter(u => !assignedUserIds.has(u.id));

  const handleAssignUser = async () => {
    if (!selectedUserId) {
      alert('الرجاء اختيار مستخدم');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/settings/roles/${roleId}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId })
      });

      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setSelectedUserId('');
        alert(`✅ تم ربط المستخدم بالدور بنجاح`);
      } else {
        const error = await res.json();
        alert(`❌ خطأ: ${error.error || 'فشلت العملية'}`);
      }
    } catch (error) {
      console.error('Error assigning user:', error);
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
      {/* Add User Section */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
        padding: '1.5rem',
        borderRadius: '0.75rem',
        marginBottom: '1.5rem',
        border: '1px solid rgba(102, 126, 234, 0.1)'
      }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1a202c', marginBottom: '1rem' }}>
          ➕ ربط مستخدم جديد
        </h3>
        
        {availableUsers.length === 0 ? (
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
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: '250px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#4a5568', marginBottom: '0.5rem' }}>
                اختر المستخدم
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '2px solid #e2e8f0',
                  fontSize: '1rem',
                  background: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              >
                <option value="">-- اختر مستخدم --</option>
                {availableUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.displayName} (@{user.username})
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={handleAssignUser}
              disabled={!selectedUserId || saving}
              style={{
                padding: '0.75rem 1.5rem',
                background: selectedUserId && !saving ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#cbd5e0',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: selectedUserId && !saving ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                boxShadow: selectedUserId && !saving ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (selectedUserId && !saving) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = selectedUserId && !saving ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none';
              }}
            >
              {saving ? '⏳ جاري الربط...' : '✅ ربط المستخدم'}
            </button>
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
