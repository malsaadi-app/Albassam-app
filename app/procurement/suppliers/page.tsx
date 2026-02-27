'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Stats } from '@/components/ui/Stats';
import { Badge } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';

interface Supplier {
  id: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  category: string | null;
  taxNumber: string | null;
  rating: number;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function SuppliersPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchSuppliers();
  }, [search, categoryFilter, statusFilter]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter) params.append('category', categoryFilter);
      if (statusFilter !== 'all') params.append('isActive', statusFilter);

      const res = await fetch(`/api/procurement/suppliers?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data.suppliers);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRatingStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const stars = [];
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push('⭐');
      } else {
        stars.push('☆');
      }
    }
    
    return stars.join('');
  };

  const avgRating = suppliers.length > 0 
    ? (suppliers.reduce((sum, s) => sum + s.rating, 0) / suppliers.length).toFixed(1)
    : '0.0';

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
          title="🏪 الموردين"
          breadcrumbs={['الرئيسية', 'المشتريات', 'الموردين']}
          actions={
            <Button variant="primary" onClick={() => router.push('/procurement/suppliers/new')}>
              + مورد جديد
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
          <Stats label="إجمالي الموردين" value={suppliers.length} variant="blue" icon="🏪" />
          <Stats 
            label="الموردين النشطين" 
            value={suppliers.filter(s => s.isActive).length} 
            variant="green" 
            icon="✅" 
          />
          <Stats label="متوسط التقييم" value={avgRating} variant="yellow" icon="⭐" />
        </div>

        {/* Filters */}
        <Card variant="default" className="mb-6">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ flex: '1 1 250px' }}>
              <Input
                label="بحث"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="اسم المورد، جهة الاتصال، البريد..."
              />
            </div>

            <div style={{ flex: '1 1 200px' }}>
              <Input
                label="الفئة"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                placeholder="قرطاسية، أثاث، إلخ..."
              />
            </div>

            <div style={{ flex: '1 1 200px' }}>
              <Select
                label="الحالة"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">الكل</option>
                <option value="true">نشط</option>
                <option value="false">غير نشط</option>
              </Select>
            </div>
          </div>
        </Card>

        {/* Suppliers List */}
        {suppliers.length === 0 ? (
          <Card variant="default">
            <div style={{ padding: '60px 40px', textAlign: 'center' }}>
              <div style={{ fontSize: '80px', marginBottom: '24px' }}>🏪</div>
              <h3 style={{ fontSize: '24px', color: '#111827', fontWeight: '800', marginBottom: '12px' }}>
                لا يوجد موردين
              </h3>
              <p style={{ fontSize: '16px', color: '#6B7280', marginBottom: '24px' }}>
                ابدأ بإضافة مورد جديد
              </p>
              <Button variant="primary" onClick={() => router.push('/procurement/suppliers/new')}>
                + إضافة مورد
              </Button>
            </div>
          </Card>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
            gap: '20px' 
          }}>
            {suppliers.map((supplier) => (
              <Card
                key={supplier.id}
                variant="default"
                hover
                onClick={() => router.push(`/procurement/suppliers/${supplier.id}`)}
                style={{ 
                  cursor: 'pointer',
                  opacity: supplier.isActive ? 1 : 0.7,
                  position: 'relative'
                }}
              >
                {/* Status Badge */}
                {!supplier.isActive && (
                  <div style={{ 
                    position: 'absolute', 
                    top: '16px', 
                    left: '16px' 
                  }}>
                    <Badge variant="red" dot>غير نشط</Badge>
                  </div>
                )}

                {/* Supplier Name */}
                <div style={{ 
                  paddingTop: !supplier.isActive ? '32px' : '0',
                  marginBottom: '12px'
                }}>
                  <h3 style={{ 
                    fontSize: '18px', 
                    fontWeight: '800', 
                    color: '#111827',
                    marginBottom: '8px'
                  }}>
                    {supplier.name}
                  </h3>

                  {/* Rating */}
                  <div style={{ 
                    fontSize: '16px',
                    color: '#F59E0B',
                    marginBottom: '12px'
                  }}>
                    {getRatingStars(supplier.rating)} 
                    {supplier.rating > 0 && (
                      <span style={{ 
                        fontSize: '14px', 
                        color: '#6B7280',
                        marginRight: '6px'
                      }}>
                        ({supplier.rating.toFixed(1)})
                      </span>
                    )}
                  </div>

                  {/* Category Badge */}
                  {supplier.category && (
                    <Badge variant="blue">{supplier.category}</Badge>
                  )}
                </div>

                {/* Contact Info */}
                <div style={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  fontSize: '14px',
                  color: '#6B7280',
                  fontWeight: '600'
                }}>
                  {supplier.contactPerson && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>👤</span>
                      <span>{supplier.contactPerson}</span>
                    </div>
                  )}
                  {supplier.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>📞</span>
                      <span>{supplier.phone}</span>
                    </div>
                  )}
                  {supplier.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>📧</span>
                      <span style={{ 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {supplier.email}
                      </span>
                    </div>
                  )}
                  {supplier.address && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>📍</span>
                      <span style={{ 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {supplier.address}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
