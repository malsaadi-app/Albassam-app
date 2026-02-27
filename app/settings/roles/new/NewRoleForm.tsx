'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewRoleForm() {
  const router = useRouter();
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nameAr.trim()) {
      setError('الاسم بالعربي مطلوب');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/settings/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nameAr: nameAr.trim(),
          nameEn: nameEn.trim() || null,
          description: description.trim() || null,
          isActive
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to the new role page
        router.push(`/settings/roles/${data.id}`);
      } else {
        setError(data.error || 'حدث خطأ أثناء الحفظ');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: 'rgba(255, 255, 255, 0.95)', borderRadius: '1rem', padding: '2rem', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
      <form onSubmit={handleSubmit}>
        {/* Error Message */}
        {error && (
          <div style={{
            background: '#fed7d7',
            color: '#742a2a',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            fontWeight: 'bold'
          }}>
            ❌ {error}
          </div>
        )}

        {/* Name Arabic */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontWeight: 'bold', color: '#1a202c', marginBottom: '0.5rem' }}>
            الاسم بالعربي <span style={{ color: '#e53e3e' }}>*</span>
          </label>
          <input
            type="text"
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
            placeholder="مثال: مدير القسم"
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '2px solid #e2e8f0',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#667eea'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>

        {/* Name English */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontWeight: 'bold', color: '#1a202c', marginBottom: '0.5rem' }}>
            الاسم بالإنجليزي <span style={{ color: '#718096', fontSize: '0.875rem' }}>(اختياري)</span>
          </label>
          <input
            type="text"
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            placeholder="Example: Department Manager"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '2px solid #e2e8f0',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#667eea'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontWeight: 'bold', color: '#1a202c', marginBottom: '0.5rem' }}>
            الوصف <span style={{ color: '#718096', fontSize: '0.875rem' }}>(اختياري)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="وصف مختصر للدور وصلاحياته..."
            rows={3}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '2px solid #e2e8f0',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              outline: 'none',
              transition: 'border-color 0.2s',
              resize: 'vertical'
            }}
            onFocus={(e) => e.target.style.borderColor = '#667eea'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>

        {/* Is Active */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              style={{ width: '1.25rem', height: '1.25rem', marginLeft: '0.75rem', cursor: 'pointer' }}
            />
            <span style={{ fontWeight: 'bold', color: '#1a202c' }}>
              تفعيل الدور (يمكن للمستخدمين استخدامه)
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => router.back()}
            disabled={saving}
            style={{
              padding: '0.75rem 1.5rem',
              border: '2px solid #e2e8f0',
              borderRadius: '0.5rem',
              background: 'white',
              color: '#4a5568',
              fontWeight: 'bold',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.5 : 1,
              transition: 'all 0.2s'
            }}
          >
            إلغاء
          </button>
          
          <button
            type="submit"
            disabled={saving || !nameAr.trim()}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '0.5rem',
              background: saving || !nameAr.trim() ? '#cbd5e0' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontWeight: 'bold',
              cursor: saving || !nameAr.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 6px rgba(102, 126, 234, 0.4)'
            }}
          >
            {saving ? '⏳ جاري الحفظ...' : '💾 حفظ وإضافة الصلاحيات'}
          </button>
        </div>

        {/* Info */}
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          background: '#ebf8ff',
          borderRight: '4px solid #4299e1',
          borderRadius: '0.5rem',
          color: '#2c5282',
          fontSize: '0.875rem'
        }}>
          💡 <strong>ملاحظة:</strong> بعد إنشاء الدور، ستتمكن من إضافة الصلاحيات له في الصفحة التالية.
        </div>
      </form>
    </div>
  );
}
