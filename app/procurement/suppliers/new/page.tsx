'use client';

import { COLORS } from '@/lib/colors';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NewSupplierPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    category: '',
    taxNumber: '',
    rating: 0,
    notes: '',
    isActive: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      alert('الرجاء إدخال اسم المورد');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/procurement/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert('✅ تم إنشاء المورد بنجاح');
        router.push('/procurement/suppliers');
      } else {
        const data = await res.json();
        alert(`❌ ${data.error || 'حدث خطأ أثناء إنشاء المورد'}`);
      }
    } catch (error) {
      console.error('Error creating supplier:', error);
      alert('❌ حدث خطأ أثناء إنشاء المورد');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <Link 
            href="/procurement/suppliers"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: 'rgba(255, 255, 255, 0.9)',
              textDecoration: 'none',
              marginBottom: '16px',
              fontSize: '14px',
              padding: '8px 16px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '8px'
            }}
          >
            <span>←</span>
            <span>رجوع إلى الموردين</span>
          </Link>

          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 'bold', 
            color: COLORS.white,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '36px' }}>🏪</span>
            مورد جديد
          </h1>
          <p style={{ 
            color: 'rgba(255, 255, 255, 0.9)', 
            fontSize: '14px' 
          }}>
            إضافة مورد جديد للنظام
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            marginBottom: '20px'
          }}>
            
            {/* Supplier Name */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                color: COLORS.white, 
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                اسم المورد <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="مثال: شركة النجاح للتجارة"
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: COLORS.white,
                  fontSize: '14px'
                }}
              />
            </div>

            {/* Contact Person */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                color: COLORS.white, 
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                جهة الاتصال
              </label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="مثال: أحمد محمد"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: COLORS.white,
                  fontSize: '14px'
                }}
              />
            </div>

            {/* Email & Phone */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  color: COLORS.white, 
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="example@company.com"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: COLORS.white,
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  color: COLORS.white, 
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0501234567"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: COLORS.white,
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            {/* Address */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                color: COLORS.white, 
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                العنوان
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="مثال: الرياض، حي العليا"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: COLORS.white,
                  fontSize: '14px'
                }}
              />
            </div>

            {/* Category & Tax Number */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  color: COLORS.white, 
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  الفئة
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="مثال: قرطاسية، أثاث"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: COLORS.white,
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  color: COLORS.white, 
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  الرقم الضريبي
                </label>
                <input
                  type="text"
                  value={formData.taxNumber}
                  onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                  placeholder="300000000000003"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: COLORS.white,
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            {/* Rating */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                color: COLORS.white, 
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                التقييم (0-5)
              </label>
              <input
                type="number"
                min="0"
                max="5"
                step="0.5"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || 0 })}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: COLORS.white,
                  fontSize: '14px'
                }}
              />
            </div>

            {/* Notes */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                color: COLORS.white, 
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                ملاحظات
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="أي ملاحظات إضافية عن المورد..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: COLORS.white,
                  fontSize: '14px',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Is Active */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: COLORS.white,
                fontSize: '14px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer'
                  }}
                />
                <span>مورد نشط</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: loading ? 'rgba(156, 163, 175, 0.5)' : 'rgba(16, 185, 129, 0.9)',
                border: 'none',
                borderRadius: '10px',
                color: COLORS.white,
                fontSize: '15px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              <span style={{ fontSize: '20px' }}>💾</span>
              <span>{loading ? 'جاري الحفظ...' : 'حفظ المورد'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
