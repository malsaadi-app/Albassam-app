'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  roleId: string;
  roleName: string;
  roleNameAr: string;
  roleNameEn: string;
  description: string;
  isActive: boolean;
  isSystem: boolean;
  userCount: number;
}

export default function RoleEditButtons({ roleId, roleName, roleNameAr, roleNameEn, description, isActive, isSystem, userCount }: Props) {
  const router = useRouter();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [editNameAr, setEditNameAr] = useState(roleNameAr);
  const [editNameEn, setEditNameEn] = useState(roleNameEn);
  const [editDescription, setEditDescription] = useState(description);
  const [editIsActive, setEditIsActive] = useState(isActive);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const canEdit = roleName !== 'SUPER_ADMIN';
  const canDelete = !isSystem && userCount === 0;

  const handleEdit = async () => {
    if (!editNameAr.trim()) {
      setError('الاسم بالعربي مطلوب');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/settings/roles/${roleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nameAr: editNameAr.trim(),
          nameEn: editNameEn.trim() || null,
          description: editDescription.trim() || null,
          isActive: editIsActive
        })
      });

      if (response.ok) {
        setShowEditModal(false);
        router.refresh();
      } else {
        const data = await response.json();
        setError(data.error || 'حدث خطأ أثناء الحفظ');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError('');

    try {
      const response = await fetch(`/api/settings/roles/${roleId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        router.push('/settings/roles');
      } else {
        const data = await response.json();
        setError(data.error || 'حدث خطأ أثناء الحذف');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {canEdit && (
          <button
            onClick={() => setShowEditModal(true)}
            style={{
              padding: '0.5rem 1rem',
              background: '#edf2f7',
              border: '2px solid #cbd5e0',
              borderRadius: '0.5rem',
              color: '#4a5568',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e2e8f0';
              e.currentTarget.style.borderColor = '#a0aec0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#edf2f7';
              e.currentTarget.style.borderColor = '#cbd5e0';
            }}
          >
            ✏️ تعديل
          </button>
        )}
        
        {canDelete && (
          <button
            onClick={() => setShowDeleteModal(true)}
            style={{
              padding: '0.5rem 1rem',
              background: '#fff5f5',
              border: '2px solid #fc8181',
              borderRadius: '0.5rem',
              color: '#c53030',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fed7d7';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#fff5f5';
            }}
          >
            🗑️ حذف
          </button>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '2rem'
        }}
        onClick={() => setShowEditModal(false)}>
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1a202c', marginBottom: '1.5rem' }}>
              ✏️ تعديل الدور
            </h2>

            {error && (
              <div style={{
                background: '#fed7d7',
                color: '#742a2a',
                padding: '1rem',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
                fontWeight: 'bold'
              }}>
                ❌ {error}
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: 'bold', color: '#1a202c', marginBottom: '0.5rem' }}>
                الاسم بالعربي *
              </label>
              <input
                type="text"
                value={editNameAr}
                onChange={(e) => setEditNameAr(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: 'bold', color: '#1a202c', marginBottom: '0.5rem' }}>
                الاسم بالإنجليزي
              </label>
              <input
                type="text"
                value={editNameEn}
                onChange={(e) => setEditNameEn(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: 'bold', color: '#1a202c', marginBottom: '0.5rem' }}>
                الوصف
              </label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  style={{ width: '1.25rem', height: '1.25rem', marginLeft: '0.75rem', cursor: 'pointer' }}
                />
                <span style={{ fontWeight: 'bold', color: '#1a202c' }}>
                  تفعيل الدور
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowEditModal(false)}
                disabled={saving}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  background: 'white',
                  color: '#4a5568',
                  fontWeight: 'bold',
                  cursor: saving ? 'not-allowed' : 'pointer'
                }}
              >
                إلغاء
              </button>
              <button
                onClick={handleEdit}
                disabled={saving || !editNameAr.trim()}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '0.5rem',
                  background: saving || !editNameAr.trim() ? '#cbd5e0' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: saving || !editNameAr.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                {saving ? '⏳ جاري الحفظ...' : '💾 حفظ التعديلات'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '2rem'
        }}
        onClick={() => setShowDeleteModal(false)}>
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '500px',
            width: '100%'
          }}
          onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#c53030', marginBottom: '1rem' }}>
              ⚠️ تأكيد الحذف
            </h2>

            {error && (
              <div style={{
                background: '#fed7d7',
                color: '#742a2a',
                padding: '1rem',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
                fontWeight: 'bold'
              }}>
                ❌ {error}
              </div>
            )}

            <p style={{ color: '#4a5568', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              هل أنت متأكد من حذف الدور <strong>{roleNameAr}</strong>؟
              <br />
              <strong>هذا الإجراء لا يمكن التراجع عنه.</strong>
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  background: 'white',
                  color: '#4a5568',
                  fontWeight: 'bold',
                  cursor: deleting ? 'not-allowed' : 'pointer'
                }}
              >
                إلغاء
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '0.5rem',
                  background: deleting ? '#cbd5e0' : '#c53030',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: deleting ? 'not-allowed' : 'pointer'
                }}
              >
                {deleting ? '⏳ جاري الحذف...' : '🗑️ حذف نهائياً'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
