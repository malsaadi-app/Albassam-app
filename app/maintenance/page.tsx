'use client';
import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import Link from 'next/link';
import { 
  HiOutlineClipboardCheck,
  HiOutlineCube,
  HiOutlineUsers,
  HiOutlinePlus,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineExclamation,
  HiOutlineX
} from 'react-icons/hi';

interface MaintenanceStats {
  totalRequests: number;
  pendingRequests: number;
  inProgressRequests: number;
  completedRequests: number;
  totalAssets: number;
  activeVendors: number;
}

interface RecentRequest {
  id: number;
  title: string;
  asset: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
}

export default function MaintenancePage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<MaintenanceStats>({
    totalRequests: 0,
    pendingRequests: 0,
    inProgressRequests: 0,
    completedRequests: 0,
    totalAssets: 0,
    activeVendors: 0
  });

  // Convert numbers to Western format
  const toWesternNum = (num: number): string => num.toLocaleString('en-US');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      // Mock data - replace with real API
      setTimeout(() => {
        setStats({
          totalRequests: 156,
          pendingRequests: 12,
          inProgressRequests: 8,
          completedRequests: 136,
          totalAssets: 45,
          activeVendors: 7
        });
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  // Mock recent requests
  const recentRequests: RecentRequest[] = [
    {
      id: 1,
      title: 'إصلاح نظام التكييف',
      asset: 'مكيف مركزي - الطابق الأول',
      status: 'in_progress',
      priority: 'high',
      createdAt: '2024-02-25'
    },
    {
      id: 2,
      title: 'صيانة طابعة',
      asset: 'طابعة HP LaserJet - قسم المحاسبة',
      status: 'pending',
      priority: 'medium',
      createdAt: '2024-02-24'
    },
    {
      id: 3,
      title: 'إصلاح باب الطوارئ',
      asset: 'باب الطوارئ الغربي',
      status: 'pending',
      priority: 'urgent',
      createdAt: '2024-02-24'
    },
    {
      id: 4,
      title: 'فحص دوري للمولد الكهربائي',
      asset: 'مولد كهربائي 500KVA',
      status: 'completed',
      priority: 'low',
      createdAt: '2024-02-23'
    }
  ];

  const quickLinks = [
    {
      title: 'طلبات الصيانة',
      description: 'عرض وإدارة جميع طلبات الصيانة',
      icon: <HiOutlineClipboardCheck size={32} />,
      href: '/maintenance/requests',
      color: '#3B82F6',
      bgColor: '#EFF6FF',
      count: stats.totalRequests
    },
    {
      title: 'الأصول',
      description: 'إدارة الأصول والمعدات',
      icon: <HiOutlineCube size={32} />,
      href: '/maintenance/assets',
      color: '#10B981',
      bgColor: '#D1FAE5',
      count: stats.totalAssets
    },
    {
      title: 'الموردين',
      description: 'إدارة موردي الصيانة',
      icon: <HiOutlineUsers size={32} />,
      href: '/maintenance/vendors',
      color: '#8B5CF6',
      bgColor: '#EDE9FE',
      count: stats.activeVendors
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'قيد الانتظار', color: '#F59E0B', bgColor: '#FEF3C7' },
      in_progress: { label: 'قيد التنفيذ', color: '#3B82F6', bgColor: '#EFF6FF' },
      completed: { label: 'مكتمل', color: '#10B981', bgColor: '#D1FAE5' }
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
        color: config.color,
        background: config.bgColor
      }}>
        {config.label}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { label: 'منخفضة', color: '#6B7280' },
      medium: { label: 'متوسطة', color: '#F59E0B' },
      high: { label: 'عالية', color: '#EF4444' },
      urgent: { label: 'عاجلة', color: '#DC2626' }
    };
    const config = priorityConfig[priority as keyof typeof priorityConfig];
    return (
      <span style={{
        fontSize: '12px',
        fontWeight: '600',
        color: config.color
      }}>
        ● {config.label}
      </span>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <PageHeader 
          title="إدارة الصيانة" 
          breadcrumbs={['الرئيسية', 'الصيانة']} 
        />

        {/* Hero Section */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '24px',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔧</div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
              مركز إدارة الصيانة
            </h1>
            <p style={{ fontSize: '16px', opacity: 0.9 }}>
              إدارة شاملة لطلبات الصيانة والأصول والموردين
            </p>
          </div>
          
          <Link href="/maintenance/requests/new">
            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: 'white',
              color: '#667eea',
              borderRadius: '8px',
              border: 'none',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <HiOutlinePlus size={20} />
              طلب صيانة جديد
            </button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          marginBottom: '24px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #E5E7EB'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#FEF3C7',
                color: '#F59E0B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <HiOutlineClock size={24} />
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#6B7280' }}>قيد الانتظار</p>
                <p style={{ 
                  fontSize: '24px', 
                  fontWeight: '700', 
                  color: '#F59E0B',
                  fontVariantNumeric: 'lining-nums'
                }}>
                  {toWesternNum(stats.pendingRequests)}
                </p>
              </div>
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #E5E7EB'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#EFF6FF',
                color: '#3B82F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <HiOutlineExclamation size={24} />
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#6B7280' }}>قيد التنفيذ</p>
                <p style={{ 
                  fontSize: '24px', 
                  fontWeight: '700', 
                  color: '#3B82F6',
                  fontVariantNumeric: 'lining-nums'
                }}>
                  {toWesternNum(stats.inProgressRequests)}
                </p>
              </div>
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #E5E7EB'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#D1FAE5',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <HiOutlineCheckCircle size={24} />
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#6B7280' }}>مكتملة</p>
                <p style={{ 
                  fontSize: '24px', 
                  fontWeight: '700', 
                  color: '#10B981',
                  fontVariantNumeric: 'lining-nums'
                }}>
                  {toWesternNum(stats.completedRequests)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px',
          marginBottom: '24px'
        }}>
          {quickLinks.map((link, index) => (
            <Link
              key={index}
              href={link.href}
              style={{ textDecoration: 'none', display: 'block' }}
            >
              <div
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '24px',
                  border: '1px solid #E5E7EB',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                  height: '100%'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.borderColor = link.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#E5E7EB';
                }}
              >
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '12px',
                  background: link.bgColor,
                  color: link.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  {link.icon}
                </div>

                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#111827',
                  marginBottom: '8px'
                }}>
                  {link.title}
                </h3>

                <p style={{
                  fontSize: '14px',
                  color: '#6B7280',
                  marginBottom: '16px'
                }}>
                  {link.description}
                </p>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: link.color,
                    fontVariantNumeric: 'lining-nums'
                  }}>
                    {toWesternNum(link.count)}
                  </span>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: link.color
                  }}>
                    عرض الكل ←
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Requests */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #E5E7EB'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
              أحدث الطلبات
            </h3>
            <Link 
              href="/maintenance/requests"
              style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#3B82F6',
                textDecoration: 'none'
              }}
            >
              عرض الكل ←
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentRequests.map((request) => (
              <div
                key={request.id}
                style={{
                  padding: '16px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '16px',
                  transition: 'background 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                      {request.title}
                    </h4>
                    {getPriorityBadge(request.priority)}
                  </div>
                  <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '4px' }}>
                    {request.asset}
                  </p>
                  <p style={{ 
                    fontSize: '12px', 
                    color: '#9CA3AF',
                    fontVariantNumeric: 'lining-nums'
                  }}>
                    {new Date(request.createdAt).toLocaleDateString('ar-SA').split('/').map(n => parseInt(n).toString()).join('/')}
                  </p>
                </div>
                {getStatusBadge(request.status)}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Tips */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          marginTop: '24px',
          border: '1px solid #E5E7EB'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '16px'
          }}>
            💡 نصائح سريعة
          </h3>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <li style={{ fontSize: '14px', color: '#6B7280', display: 'flex', gap: '8px' }}>
              <span>•</span>
              <span>استخدم نظام الأولويات لتصنيف طلبات الصيانة حسب الأهمية</span>
            </li>
            <li style={{ fontSize: '14px', color: '#6B7280', display: 'flex', gap: '8px' }}>
              <span>•</span>
              <span>قم بصيانة دورية للأصول لتقليل الأعطال المفاجئة</span>
            </li>
            <li style={{ fontSize: '14px', color: '#6B7280', display: 'flex', gap: '8px' }}>
              <span>•</span>
              <span>راجع تقارير الصيانة شهرياً لتحليل التكاليف والأداء</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
