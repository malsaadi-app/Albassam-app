'use client';
import { PageHeader } from '@/components/ui/PageHeader';
import Link from 'next/link';
import { 
  HiOutlineChartBar, 
  HiOutlineUserGroup, 
  HiOutlineCalendar,
  HiOutlineClipboardList,
  HiOutlineShoppingCart,
  HiOutlineClipboardCheck,
  HiOutlineCurrencyDollar
} from 'react-icons/hi';

interface Report {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
  bgColor: string;
}

export default function ReportsPage() {
  const reports: Report[] = [
    {
      id: 'attendance',
      title: 'تقرير الحضور والانصراف',
      description: 'تقارير الحضور والانصراف للموظفين (يومي/شهري/سنوي)',
      icon: <HiOutlineChartBar size={32} />,
      href: '/reports/attendance',
      color: '#3B82F6',
      bgColor: '#EFF6FF'
    },
    {
      id: 'employees',
      title: 'تقرير الموظفين',
      description: 'معلومات الموظفين والأقسام والفروع',
      icon: <HiOutlineUserGroup size={32} />,
      href: '/hr/employees',
      color: '#10B981',
      bgColor: '#D1FAE5'
    },
    {
      id: 'leaves',
      title: 'تقرير الإجازات',
      description: 'إجازات الموظفين وأرصدة الإجازات',
      icon: <HiOutlineCalendar size={32} />,
      href: '/hr/leaves',
      color: '#F59E0B',
      bgColor: '#FEF3C7'
    },
    {
      id: 'tasks',
      title: 'تقرير المهام',
      description: 'حالة المهام والإنجاز والتأخيرات',
      icon: <HiOutlineClipboardList size={32} />,
      href: '/tasks',
      color: '#8B5CF6',
      bgColor: '#EDE9FE'
    },
    {
      id: 'procurement',
      title: 'تقرير المشتريات',
      description: 'طلبات الشراء والموردين والمصروفات',
      icon: <HiOutlineShoppingCart size={32} />,
      href: '/procurement/requests',
      color: '#EC4899',
      bgColor: '#FCE7F3'
    },
    {
      id: 'maintenance',
      title: 'تقرير الصيانة',
      description: 'طلبات الصيانة والأصول والتكاليف',
      icon: <HiOutlineClipboardCheck size={32} />,
      href: '/maintenance/requests',
      color: '#06B6D4',
      bgColor: '#CFFAFE'
    },
    {
      id: 'financial',
      title: 'التقارير المالية',
      description: 'المصروفات والإيرادات والميزانيات',
      icon: <HiOutlineCurrencyDollar size={32} />,
      href: '/reports/financial',
      color: '#EF4444',
      bgColor: '#FEE2E2'
    }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <PageHeader title="التقارير" breadcrumbs={['الرئيسية', 'التقارير']} />
        
        {/* Header Section */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '24px',
          color: 'white',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📊</div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
            مركز التقارير
          </h1>
          <p style={{ fontSize: '16px', opacity: 0.9 }}>
            تقارير شاملة لجميع أقسام النظام
          </p>
        </div>

        {/* Reports Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {reports.map((report) => (
            <Link
              key={report.id}
              href={report.href}
              style={{
                textDecoration: 'none',
                display: 'block'
              }}
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
                  e.currentTarget.style.borderColor = report.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#E5E7EB';
                }}
              >
                {/* Icon */}
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '12px',
                  background: report.bgColor,
                  color: report.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  {report.icon}
                </div>

                {/* Title */}
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#111827',
                  marginBottom: '8px'
                }}>
                  {report.title}
                </h3>

                {/* Description */}
                <p style={{
                  fontSize: '14px',
                  color: '#6B7280',
                  lineHeight: '1.5',
                  marginBottom: '16px'
                }}>
                  {report.description}
                </p>

                {/* Button */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: report.color
                }}>
                  <span>عرض التقرير</span>
                  <span>←</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Stats */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
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
              <span>يمكنك تصدير التقارير إلى Excel/PDF من داخل كل تقرير</span>
            </li>
            <li style={{ fontSize: '14px', color: '#6B7280', display: 'flex', gap: '8px' }}>
              <span>•</span>
              <span>استخدم الفلاتر لتخصيص التقارير حسب الفترة الزمنية أو القسم</span>
            </li>
            <li style={{ fontSize: '14px', color: '#6B7280', display: 'flex', gap: '8px' }}>
              <span>•</span>
              <span>يتم تحديث البيانات في الوقت الفعلي</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
