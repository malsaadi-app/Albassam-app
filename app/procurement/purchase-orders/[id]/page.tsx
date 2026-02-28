'use client';

import { COLORS } from '@/lib/colors';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getInitialLocale } from '@/lib/i18n';

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchOrder();
    }
  }, [params.id]);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/procurement/purchase-orders/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!confirm(`هل أنت متأكد من تغيير الحالة إلى "${statusLabels[newStatus]}"؟`)) return;

    try {
      const res = await fetch(`/api/procurement/purchase-orders/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        alert('✅ تم تحديث الحالة بنجاح');
        fetchOrder();
      } else {
        alert('❌ حدث خطأ أثناء التحديث');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('❌ حدث خطأ');
    }
  };

  const statusLabels: Record<string, string> = {
    PENDING: 'معلق',
    APPROVED: 'معتمد',
    SENT: 'تم الإرسال',
    CONFIRMED: 'مؤكد',
    IN_DELIVERY: 'قيد التوصيل',
    DELIVERED: 'تم التسليم',
    CANCELLED: 'ملغي',
    COMPLETED: 'مكتمل'
  };

  const statusColors: Record<string, string> = {
    PENDING: '#f59e0b',
    APPROVED: '#3b82f6',
    SENT: '#8b5cf6',
    CONFIRMED: '#06b6d4',
    IN_DELIVERY: '#f97316',
    DELIVERED: '#10b981',
    CANCELLED: '#ef4444',
    COMPLETED: '#22c55e'
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '40px 20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: COLORS.white,
        fontSize: '24px'
      }}>
        جاري التحميل...
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '40px 20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: COLORS.white,
        fontSize: '24px'
      }}>
        أمر الشراء غير موجود
      </div>
    );
  }

  const items = JSON.parse(order.items || '[]');

  return (
    <div dir="rtl" style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          gap: '20px',
          flexWrap: 'wrap'
        }}>
          <div>
            <h1 style={{ color: COLORS.white, fontSize: '32px', fontWeight: 'bold', margin: 0, marginBottom: '8px' }}>
              📦 {order.orderNumber}
            </h1>
            <span style={{
              background: statusColors[order.status] || '#6b7280',
              color: COLORS.white,
              padding: '6px 16px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              {statusLabels[order.status] || order.status}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                const locale = getInitialLocale();
                window.open(`/print/procurement/purchase-orders/${params.id}?locale=${locale}`, '_blank');
              }}
              style={{
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.3)',
                padding: '12px 24px',
                borderRadius: '12px',
                color: COLORS.white,
                textDecoration: 'none',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              🖨️ طباعة
            </button>

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
        </div>

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
            معلومات الطلب
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginBottom: '4px' }}>المورد</div>
              <div style={{ color: COLORS.white, fontSize: '16px', fontWeight: '600' }}>
                {order.supplier?.name || 'غير محدد'}
              </div>
            </div>

            <div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginBottom: '4px' }}>تاريخ الطلب</div>
              <div style={{ color: COLORS.white, fontSize: '16px', fontWeight: '600' }}>
                {new Date(order.orderDate).toLocaleDateString('en-US')}
              </div>
            </div>

            {order.expectedDelivery && (
              <div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginBottom: '4px' }}>التسليم المتوقع</div>
                <div style={{ color: COLORS.white, fontSize: '16px', fontWeight: '600' }}>
                  {new Date(order.expectedDelivery).toLocaleDateString('en-US')}
                </div>
              </div>
            )}

            {order.paymentTerms && (
              <div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginBottom: '4px' }}>شروط الدفع</div>
                <div style={{ color: COLORS.white, fontSize: '16px', fontWeight: '600' }}>
                  {order.paymentTerms}
                </div>
              </div>
            )}
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
          <h2 style={{ color: COLORS.white, fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
            العناصر
          </h2>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.2)' }}>
                  <th style={{ padding: '12px', textAlign: 'right', color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: '600' }}>العنصر</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: '600' }}>الكمية</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: '600' }}>السعر</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: '600' }}>الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any, index: number) => (
                  <tr key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <td style={{ padding: '12px', color: COLORS.white, fontSize: '14px' }}>{item.name}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: COLORS.white, fontSize: '14px' }}>
                      {item.quantity} {item.unit}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', color: COLORS.white, fontSize: '14px' }}>
                      {item.unitPrice} ريال
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', color: COLORS.white, fontSize: '14px', fontWeight: '600' }}>
                      {item.totalPrice} ريال
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>المجموع:</span>
              <span style={{ color: COLORS.white, fontSize: '16px', fontWeight: '600' }}>{order.totalAmount.toFixed(2)} ريال</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>الضريبة:</span>
              <span style={{ color: COLORS.white, fontSize: '16px', fontWeight: '600' }}>{order.tax.toFixed(2)} ريال</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>الخصم:</span>
              <span style={{ color: COLORS.white, fontSize: '16px', fontWeight: '600' }}>{order.discount.toFixed(2)} ريال</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '12px 0',
              borderTop: '2px solid rgba(255,255,255,0.3)',
              marginTop: '8px'
            }}>
              <span style={{ color: COLORS.white, fontSize: '16px', fontWeight: 'bold' }}>الإجمالي النهائي:</span>
              <span style={{ color: '#22c55e', fontSize: '20px', fontWeight: 'bold' }}>{order.finalAmount.toFixed(2)} ريال</span>
            </div>
          </div>
        </div>

        {/* Status Actions */}
        {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
          <div style={{
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255,255,255,0.25)'
          }}>
            <h2 style={{ color: COLORS.white, fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
              إجراءات
            </h2>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {order.status === 'PENDING' && (
                <button
                  onClick={() => updateStatus('APPROVED')}
                  style={{
                    background: '#3b82f6',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '10px',
                    color: COLORS.white,
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  ✅ اعتماد الطلب
                </button>
              )}

              {order.status === 'APPROVED' && (
                <button
                  onClick={() => updateStatus('SENT')}
                  style={{
                    background: '#8b5cf6',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '10px',
                    color: COLORS.white,
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  📤 إرسال للمورد
                </button>
              )}

              {order.status === 'SENT' && (
                <button
                  onClick={() => updateStatus('CONFIRMED')}
                  style={{
                    background: '#06b6d4',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '10px',
                    color: COLORS.white,
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  ✔️ تأكيد الطلب
                </button>
              )}

              {(order.status === 'CONFIRMED' || order.status === 'IN_DELIVERY') && (
                <button
                  onClick={() => updateStatus('DELIVERED')}
                  style={{
                    background: '#10b981',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '10px',
                    color: COLORS.white,
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  📦 تم التسليم
                </button>
              )}

              {order.status === 'DELIVERED' && (
                <button
                  onClick={() => updateStatus('COMPLETED')}
                  style={{
                    background: '#22c55e',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '10px',
                    color: COLORS.white,
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  🎉 إكمال الطلب
                </button>
              )}

              <button
                onClick={() => updateStatus('CANCELLED')}
                style={{
                  background: '#ef4444',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  color: COLORS.white,
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                ❌ إلغاء الطلب
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
