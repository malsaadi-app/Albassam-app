'use client';

import { COLORS } from '@/lib/colors';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([{ name: '', quantity: 1, unit: '', unitPrice: 0, totalPrice: 0, specifications: '' }]);

  const [formData, setFormData] = useState({
    supplierId: '',
    expectedDelivery: '',
    paymentTerms: '',
    deliveryTerms: '',
    notes: '',
    tax: 15, // ضريبة 15%
    discount: 0
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/procurement/suppliers');
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data.suppliers || []);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const addItem = () => {
    setItems([...items, { name: '', quantity: 1, unit: '', unitPrice: 0, totalPrice: 0, specifications: '' }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // حساب السعر الإجمالي لكل عنصر
    if (field === 'quantity' || field === 'unitPrice') {
      const qty = field === 'quantity' ? parseFloat(value) || 0 : newItems[index].quantity;
      const price = field === 'unitPrice' ? parseFloat(value) || 0 : newItems[index].unitPrice;
      newItems[index].totalPrice = qty * price;
    }

    setItems(newItems);
  };

  const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const taxAmount = (totalAmount * formData.tax) / 100;
  const finalAmount = totalAmount + taxAmount - formData.discount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.supplierId) {
      alert('الرجاء اختيار المورد');
      return;
    }

    if (items.some(item => !item.name || !item.quantity || !item.unitPrice)) {
      alert('الرجاء إكمال بيانات جميع العناصر');
      return;
    }

    try {
      setLoading(true);

      const res = await fetch('/api/procurement/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          items,
          totalAmount,
          finalAmount
        })
      });

      if (res.ok) {
        const order = await res.json();
        alert('✅ تم إنشاء أمر الشراء بنجاح');
        router.push(`/procurement/purchase-orders/${order.id}`);
      } else {
        const error = await res.json();
        alert(`❌ ${error.error || 'حدث خطأ'}`);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('❌ حدث خطأ أثناء الإنشاء');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <h1 style={{ color: COLORS.white, fontSize: '32px', fontWeight: 'bold', margin: 0 }}>
            ➕ أمر شراء جديد
          </h1>
          <Link href="/procurement/purchase-orders" style={{
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.3)',
            padding: '12px 24px',
            borderRadius: '12px',
            color: COLORS.white,
            textDecoration: 'none',
            fontWeight: '600'
          }}>
            ← رجوع
          </Link>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic Info */}
          <div style={{
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
            border: '1px solid rgba(255,255,255,0.25)'
          }}>
            <h2 style={{ color: COLORS.white, fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
              معلومات أساسية
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', color: COLORS.white, marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                  المورد <span style={{ color: '#ff6b6b' }}>*</span>
                </label>
                <select
                  value={formData.supplierId}
                  onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.3)',
                    background: 'rgba(255,255,255,0.1)',
                    color: COLORS.white,
                    fontSize: '14px'
                  }}
                >
                  <option value="" style={{ color: 'black' }}>-- اختر المورد --</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id} style={{ color: 'black' }}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: COLORS.white, marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                  التسليم المتوقع
                </label>
                <input
                  type="date"
                  value={formData.expectedDelivery}
                  onChange={(e) => setFormData({ ...formData, expectedDelivery: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.3)',
                    background: 'rgba(255,255,255,0.1)',
                    color: COLORS.white,
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: COLORS.white, marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                  شروط الدفع
                </label>
                <input
                  type="text"
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                  placeholder="مثال: 30 يوم"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.3)',
                    background: 'rgba(255,255,255,0.1)',
                    color: COLORS.white,
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: COLORS.white, marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                  شروط التسليم
                </label>
                <input
                  type="text"
                  value={formData.deliveryTerms}
                  onChange={(e) => setFormData({ ...formData, deliveryTerms: e.target.value })}
                  placeholder="مثال: توصيل مجاني"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.3)',
                    background: 'rgba(255,255,255,0.1)',
                    color: COLORS.white,
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Items */}
          <div style={{
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
            border: '1px solid rgba(255,255,255,0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: COLORS.white, fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
                العناصر
              </h2>
              <button
                type="button"
                onClick={addItem}
                style={{
                  background: 'rgba(34,197,94,0.8)',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  color: COLORS.white,
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                + إضافة عنصر
              </button>
            </div>

            {items.map((item, index) => (
              <div key={index} style={{
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', color: COLORS.white, marginBottom: '6px', fontSize: '12px' }}>
                      الاسم *
                    </label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(index, 'name', e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.3)',
                        background: 'rgba(255,255,255,0.1)',
                        color: COLORS.white,
                        fontSize: '13px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', color: COLORS.white, marginBottom: '6px', fontSize: '12px' }}>
                      الكمية *
                    </label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      required
                      min="0.01"
                      step="0.01"
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.3)',
                        background: 'rgba(255,255,255,0.1)',
                        color: COLORS.white,
                        fontSize: '13px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', color: COLORS.white, marginBottom: '6px', fontSize: '12px' }}>
                      الوحدة
                    </label>
                    <input
                      type="text"
                      value={item.unit}
                      onChange={(e) => updateItem(index, 'unit', e.target.value)}
                      placeholder="مثال: صندوق"
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.3)',
                        background: 'rgba(255,255,255,0.1)',
                        color: COLORS.white,
                        fontSize: '13px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', color: COLORS.white, marginBottom: '6px', fontSize: '12px' }}>
                      سعر الوحدة *
                    </label>
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                      required
                      min="0"
                      step="0.01"
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.3)',
                        background: 'rgba(255,255,255,0.1)',
                        color: COLORS.white,
                        fontSize: '13px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', color: COLORS.white, marginBottom: '6px', fontSize: '12px' }}>
                      الإجمالي
                    </label>
                    <div style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.3)',
                      background: 'rgba(255,255,255,0.05)',
                      color: COLORS.white,
                      fontSize: '13px',
                      fontWeight: '600'
                    }}>
                      {item.totalPrice.toFixed(2)} ريال
                    </div>
                  </div>

                  {items.length > 1 && (
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        style={{
                          background: 'rgba(239,68,68,0.8)',
                          border: 'none',
                          padding: '10px',
                          borderRadius: '8px',
                          color: COLORS.white,
                          fontSize: '16px',
                          cursor: 'pointer',
                          width: '100%'
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div style={{
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
            border: '1px solid rgba(255,255,255,0.25)'
          }}>
            <h2 style={{ color: COLORS.white, fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
              الملخص المالي
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '16px',
                borderRadius: '12px'
              }}>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginBottom: '4px' }}>المجموع</div>
                <div style={{ color: COLORS.white, fontSize: '20px', fontWeight: 'bold' }}>
                  {totalAmount.toFixed(2)} ريال
                </div>
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '16px',
                borderRadius: '12px'
              }}>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginBottom: '4px' }}>الضريبة ({formData.tax}%)</div>
                <div style={{ color: COLORS.white, fontSize: '20px', fontWeight: 'bold' }}>
                  {taxAmount.toFixed(2)} ريال
                </div>
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '16px',
                borderRadius: '12px'
              }}>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginBottom: '4px' }}>الخصم</div>
                <input
                  type="number"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.3)',
                    background: 'rgba(255,255,255,0.1)',
                    color: COLORS.white,
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                />
              </div>

              <div style={{
                background: 'rgba(34,197,94,0.3)',
                padding: '16px',
                borderRadius: '12px',
                border: '2px solid rgba(34,197,94,0.5)'
              }}>
                <div style={{ color: COLORS.white, fontSize: '12px', marginBottom: '4px', fontWeight: '600' }}>الإجمالي النهائي</div>
                <div style={{ color: COLORS.white, fontSize: '24px', fontWeight: 'bold' }}>
                  {finalAmount.toFixed(2)} ريال
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', color: COLORS.white, marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                ملاحظات
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.1)',
                  color: COLORS.white,
                  fontSize: '14px',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
            <Link
              href="/procurement/purchase-orders"
              style={{
                padding: '14px 32px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '12px',
                color: COLORS.white,
                fontSize: '16px',
                fontWeight: '600',
                textDecoration: 'none',
                display: 'inline-block'
              }}
            >
              إلغاء
            </Link>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '14px 32px',
                background: loading ? 'rgba(156,163,175,0.5)' : 'rgba(34,197,94,0.9)',
                border: 'none',
                borderRadius: '12px',
                color: COLORS.white,
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'جاري الحفظ...' : '💾 حفظ أمر الشراء'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
