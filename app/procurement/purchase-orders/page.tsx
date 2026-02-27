'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Stats } from '@/components/ui/Stats';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Input';

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplier: {
    name: string;
    contactPerson?: string;
    phone?: string;
  };
  status: string;
  totalAmount: number;
  deliveryDate?: string;
  paymentTerms?: string;
  createdAt: string;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    unitPrice: number;
  }>;
}

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

const getStatusVariant = (status: string): 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray' => {
  switch (status) {
    case 'PENDING': return 'yellow';
    case 'APPROVED': return 'blue';
    case 'SENT': return 'purple';
    case 'CONFIRMED': return 'blue';
    case 'IN_DELIVERY': return 'yellow';
    case 'DELIVERED': return 'green';
    case 'CANCELLED': return 'red';
    case 'COMPLETED': return 'green';
    default: return 'gray';
  }
};

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/procurement/purchase-orders');
      if (res.status === 401) {
        router.push('/');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (statusFilter !== 'ALL' && order.status !== statusFilter) return false;
    return true;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'PENDING').length,
    approved: orders.filter(o => o.status === 'APPROVED').length,
    inDelivery: orders.filter(o => o.status === 'IN_DELIVERY').length,
    delivered: orders.filter(o => o.status === 'DELIVERED' || o.status === 'COMPLETED').length,
    totalValue: orders.reduce((sum, o) => sum + o.totalAmount, 0)
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB' }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #E5E7EB',
          borderTop: '4px solid #3B82F6',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}></div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Page Header */}
        <PageHeader
          title="📄 أوامر الشراء"
          breadcrumbs={['الرئيسية', 'المشتريات', 'أوامر الشراء']}
          actions={
            <Button variant="primary" onClick={() => router.push('/procurement/purchase-orders/new')}>
              + أمر شراء جديد
            </Button>
          }
        />

        {/* Statistics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          <Stats label="إجمالي الأوامر" value={stats.total} variant="blue" icon="📄" />
          <Stats label="معلقة" value={stats.pending} variant="yellow" icon="⏳" />
          <Stats label="معتمدة" value={stats.approved} variant="blue" icon="✅" />
          <Stats label="قيد التوصيل" value={stats.inDelivery} variant="purple" icon="🚚" />
          <Stats label="مكتملة" value={stats.delivered} variant="green" icon="🏁" />
        </div>

        {/* Total Value Card */}
        {stats.totalValue > 0 && (
          <Card variant="elevated" className="mb-6" style={{ background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)' }}>
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.9)', fontWeight: '600', marginBottom: '8px' }}>
                القيمة الإجمالية للأوامر
              </p>
              <p style={{ fontSize: '40px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                {stats.totalValue.toLocaleString('ar-SA')} ر.س
              </p>
            </div>
          </Card>
        )}

        {/* Filters */}
        <Card variant="default" className="mb-6">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ flex: '1 1 250px' }}>
              <Select
                label="الحالة"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">كل الحالات</option>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </Select>
            </div>
          </div>
        </Card>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <Card variant="default">
            <div style={{ padding: '60px 40px', textAlign: 'center' }}>
              <div style={{ fontSize: '80px', marginBottom: '24px' }}>📋</div>
              <h3 style={{ fontSize: '24px', color: '#111827', fontWeight: '800', marginBottom: '12px' }}>
                لا توجد أوامر شراء
              </h3>
              <p style={{ fontSize: '16px', color: '#6B7280', marginBottom: '24px' }}>
                ابدأ بإنشاء أمر شراء جديد
              </p>
              <Button variant="primary" onClick={() => router.push('/procurement/purchase-orders/new')}>
                + إنشاء أمر
              </Button>
            </div>
          </Card>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {filteredOrders.map((order) => (
              <Card 
                key={order.id} 
                variant="default" 
                hover
                onClick={() => router.push(`/procurement/purchase-orders/${order.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', gap: '20px', alignItems: 'start', flexWrap: 'wrap' }}>
                  {/* Left Section */}
                  <div style={{ flex: '1 1 300px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', margin: 0 }}>
                        {order.orderNumber}
                      </h3>
                      <Badge variant={getStatusVariant(order.status)}>
                        {statusLabels[order.status]}
                      </Badge>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                      <p style={{ fontSize: '14px', color: '#6B7280', fontWeight: '600', margin: 0 }}>
                        <span style={{ fontWeight: '700', color: '#374151' }}>المورد:</span> {order.supplier.name}
                      </p>
                      {order.supplier.contactPerson && (
                        <p style={{ fontSize: '14px', color: '#6B7280', fontWeight: '600', margin: 0 }}>
                          <span style={{ fontWeight: '700', color: '#374151' }}>جهة الاتصال:</span> {order.supplier.contactPerson}
                        </p>
                      )}
                      {order.supplier.phone && (
                        <p style={{ fontSize: '14px', color: '#6B7280', fontWeight: '600', margin: 0 }}>
                          <span style={{ fontWeight: '700', color: '#374151' }}>الهاتف:</span> {order.supplier.phone}
                        </p>
                      )}
                    </div>

                    <div style={{ fontSize: '13px', color: '#9CA3AF', fontWeight: '600' }}>
                      📅 {new Date(order.createdAt).toLocaleDateString('ar-SA')}
                      {order.deliveryDate && ` • 🚚 التوصيل: ${new Date(order.deliveryDate).toLocaleDateString('ar-SA')}`}
                    </div>
                  </div>

                  {/* Right Section */}
                  <div style={{ flex: '1 1 300px' }}>
                    <div style={{
                      background: '#F9FAFB',
                      padding: '16px',
                      borderRadius: '12px',
                      marginBottom: '12px'
                    }}>
                      <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600', marginBottom: '4px' }}>
                        القيمة الإجمالية
                      </p>
                      <p style={{ fontSize: '24px', fontWeight: '800', color: '#059669', margin: 0 }}>
                        {order.totalAmount.toLocaleString('ar-SA')} ر.س
                      </p>
                    </div>

                    {order.items.length > 0 && (
                      <div>
                        <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: '700', marginBottom: '8px' }}>
                          الأصناف ({order.items.length}):
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {order.items.slice(0, 3).map((item, idx) => (
                            <p key={idx} style={{ fontSize: '13px', color: '#374151', fontWeight: '600', margin: 0 }}>
                              • {item.name} ({item.quantity} {item.unit} × {item.unitPrice.toLocaleString('ar-SA')} ر.س)
                            </p>
                          ))}
                          {order.items.length > 3 && (
                            <p style={{ fontSize: '13px', color: '#9CA3AF', fontWeight: '600', margin: 0 }}>
                              + {order.items.length - 3} أصناف أخرى
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
