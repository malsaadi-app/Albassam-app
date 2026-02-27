'use client';
import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { 
  HiOutlineCurrencyDollar,
  HiOutlineTrendingUp,
  HiOutlineTrendingDown,
  HiOutlineShoppingCart,
  HiOutlineReceiptTax,
  HiOutlineChartBar,
  HiOutlineDownload,
  HiOutlineCalendar
} from 'react-icons/hi';

interface FinancialStats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  procurementCosts: number;
  maintenanceCosts: number;
  payrollCosts: number;
}

interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export default function FinancialReportPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<FinancialStats>({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    procurementCosts: 0,
    maintenanceCosts: 0,
    payrollCosts: 0
  });
  const [period, setPeriod] = useState('month');

  // Convert numbers to Western format with currency
  const toWesternNum = (num: number): string => num.toLocaleString('en-US');
  const formatCurrency = (num: number): string => `${toWesternNum(num)} ريال`;

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      // Mock data - replace with real API call
      setTimeout(() => {
        setStats({
          totalRevenue: 850000,
          totalExpenses: 620000,
          netProfit: 230000,
          procurementCosts: 280000,
          maintenanceCosts: 85000,
          payrollCosts: 255000
        });
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  const exportReport = () => {
    alert('تصدير التقرير المالي - سيتم التنفيذ قريباً');
  };

  // Mock monthly data
  const last6Months: MonthlyData[] = [
    { month: 'سبتمبر', revenue: 780000, expenses: 580000, profit: 200000 },
    { month: 'أكتوبر', revenue: 820000, expenses: 590000, profit: 230000 },
    { month: 'نوفمبر', revenue: 750000, expenses: 610000, profit: 140000 },
    { month: 'ديسمبر', revenue: 890000, expenses: 600000, profit: 290000 },
    { month: 'يناير', revenue: 830000, expenses: 620000, profit: 210000 },
    { month: 'فبراير', revenue: 850000, expenses: 620000, profit: 230000 }
  ];

  const profitMargin = ((stats.netProfit / stats.totalRevenue) * 100).toFixed(1);
  const expenseRatio = ((stats.totalExpenses / stats.totalRevenue) * 100).toFixed(1);

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <PageHeader 
          title="التقارير المالية الشاملة" 
          breadcrumbs={['الرئيسية', 'التقارير', 'المالية']} 
        />

        {/* Header Controls */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
          border: '1px solid #E5E7EB',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <HiOutlineCalendar size={20} style={{ color: '#6B7280' }} />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              <option value="week">هذا الأسبوع</option>
              <option value="month">هذا الشهر</option>
              <option value="quarter">هذا الربع</option>
              <option value="year">هذا العام</option>
            </select>
          </div>

          <button
            onClick={exportReport}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: '#10B981',
              color: 'white',
              borderRadius: '8px',
              border: 'none',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <HiOutlineDownload size={18} />
            تصدير PDF
          </button>
        </div>

        {/* Main Financial Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          marginBottom: '24px'
        }}>
          {/* Revenue Card */}
          <div style={{
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            borderRadius: '12px',
            padding: '24px',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <HiOutlineTrendingUp size={24} />
                <h3 style={{ fontSize: '16px', fontWeight: '600', opacity: 0.9 }}>
                  إجمالي الإيرادات
                </h3>
              </div>
              <p style={{ 
                fontSize: '32px', 
                fontWeight: '700',
                fontVariantNumeric: 'lining-nums'
              }}>
                {formatCurrency(stats.totalRevenue)}
              </p>
              <p style={{ fontSize: '14px', opacity: 0.8, marginTop: '8px' }}>
                ↑ 12% عن الشهر السابق
              </p>
            </div>
            <div style={{
              position: 'absolute',
              top: '-20px',
              left: '-20px',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)'
            }} />
          </div>

          {/* Expenses Card */}
          <div style={{
            background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
            borderRadius: '12px',
            padding: '24px',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <HiOutlineTrendingDown size={24} />
                <h3 style={{ fontSize: '16px', fontWeight: '600', opacity: 0.9 }}>
                  إجمالي المصروفات
                </h3>
              </div>
              <p style={{ 
                fontSize: '32px', 
                fontWeight: '700',
                fontVariantNumeric: 'lining-nums'
              }}>
                {formatCurrency(stats.totalExpenses)}
              </p>
              <p style={{ fontSize: '14px', opacity: 0.8, marginTop: '8px' }}>
                ↑ 5% عن الشهر السابق
              </p>
            </div>
            <div style={{
              position: 'absolute',
              bottom: '-20px',
              right: '-20px',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)'
            }} />
          </div>

          {/* Net Profit Card */}
          <div style={{
            background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
            borderRadius: '12px',
            padding: '24px',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <HiOutlineCurrencyDollar size={24} />
                <h3 style={{ fontSize: '16px', fontWeight: '600', opacity: 0.9 }}>
                  صافي الربح
                </h3>
              </div>
              <p style={{ 
                fontSize: '32px', 
                fontWeight: '700',
                fontVariantNumeric: 'lining-nums'
              }}>
                {formatCurrency(stats.netProfit)}
              </p>
              <p style={{ fontSize: '14px', opacity: 0.8, marginTop: '8px' }}>
                هامش ربح {profitMargin}%
              </p>
            </div>
            <div style={{
              position: 'absolute',
              top: '50%',
              right: '-30px',
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              transform: 'translateY(-50%)'
            }} />
          </div>
        </div>

        {/* Expense Breakdown */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          border: '1px solid #E5E7EB'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '20px' }}>
            تفصيل المصروفات
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Procurement */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <HiOutlineShoppingCart size={20} style={{ color: '#EC4899' }} />
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                    المشتريات
                  </span>
                </div>
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#EC4899',
                  fontVariantNumeric: 'lining-nums'
                }}>
                  {formatCurrency(stats.procurementCosts)}
                </span>
              </div>
              <div style={{ 
                height: '8px', 
                background: '#FCE7F3', 
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${(stats.procurementCosts / stats.totalExpenses) * 100}%`,
                  height: '100%',
                  background: '#EC4899',
                  borderRadius: '4px'
                }} />
              </div>
            </div>

            {/* Payroll */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <HiOutlineReceiptTax size={20} style={{ color: '#8B5CF6' }} />
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                    الرواتب والأجور
                  </span>
                </div>
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#8B5CF6',
                  fontVariantNumeric: 'lining-nums'
                }}>
                  {formatCurrency(stats.payrollCosts)}
                </span>
              </div>
              <div style={{ 
                height: '8px', 
                background: '#EDE9FE', 
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${(stats.payrollCosts / stats.totalExpenses) * 100}%`,
                  height: '100%',
                  background: '#8B5CF6',
                  borderRadius: '4px'
                }} />
              </div>
            </div>

            {/* Maintenance */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <HiOutlineChartBar size={20} style={{ color: '#F59E0B' }} />
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                    الصيانة والتشغيل
                  </span>
                </div>
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#F59E0B',
                  fontVariantNumeric: 'lining-nums'
                }}>
                  {formatCurrency(stats.maintenanceCosts)}
                </span>
              </div>
              <div style={{ 
                height: '8px', 
                background: '#FEF3C7', 
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${(stats.maintenanceCosts / stats.totalExpenses) * 100}%`,
                  height: '100%',
                  background: '#F59E0B',
                  borderRadius: '4px'
                }} />
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Trend Chart */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #E5E7EB'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '20px' }}>
            الاتجاه الشهري (آخر 6 أشهر)
          </h3>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', height: '300px' }}>
            {last6Months.map((month, index) => {
              const maxValue = 900000;
              const revenueHeight = (month.revenue / maxValue) * 100;
              const expensesHeight = (month.expenses / maxValue) * 100;
              
              return (
                <div 
                  key={index}
                  style={{ 
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <div style={{ 
                    width: '100%',
                    display: 'flex',
                    gap: '4px',
                    alignItems: 'flex-end',
                    height: '100%'
                  }}>
                    {/* Revenue Bar */}
                    <div style={{
                      flex: 1,
                      height: `${revenueHeight}%`,
                      minHeight: '20px',
                      background: 'linear-gradient(180deg, #10B981, #059669)',
                      borderRadius: '8px 8px 0 0',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'center',
                      padding: '4px',
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: '600'
                    }}>
                      {/* Label removed for cleaner look */}
                    </div>
                    
                    {/* Expenses Bar */}
                    <div style={{
                      flex: 1,
                      height: `${expensesHeight}%`,
                      minHeight: '20px',
                      background: 'linear-gradient(180deg, #EF4444, #DC2626)',
                      borderRadius: '8px 8px 0 0',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'center',
                      padding: '4px',
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: '600'
                    }}>
                      {/* Label removed for cleaner look */}
                    </div>
                  </div>
                  
                  {/* Month Label */}
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#6B7280',
                    textAlign: 'center',
                    fontWeight: '600'
                  }}>
                    {month.month}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '24px',
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: '1px solid #E5E7EB'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#10B981' }} />
              <span style={{ fontSize: '14px', color: '#6B7280' }}>الإيرادات</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#EF4444' }} />
              <span style={{ fontSize: '14px', color: '#6B7280' }}>المصروفات</span>
            </div>
          </div>
        </div>

        {/* Financial Health Summary */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '12px',
          padding: '24px',
          marginTop: '24px',
          color: 'white'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
            💰 الصحة المالية
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
            <p>• هامش الربح الصافي: <span style={{ 
              fontWeight: '700',
              fontVariantNumeric: 'lining-nums'
            }}>{profitMargin}%</span> (جيد جداً)</p>
            <p>• نسبة المصروفات: <span style={{ 
              fontWeight: '700',
              fontVariantNumeric: 'lining-nums'
            }}>{expenseRatio}%</span> من الإيرادات</p>
            <p>• أكبر بند مصروفات: المشتريات (<span style={{ 
              fontWeight: '700',
              fontVariantNumeric: 'lining-nums'
            }}>{toWesternNum(Math.round((stats.procurementCosts / stats.totalExpenses) * 100))}%</span>)</p>
            <p>• التوقعات: نمو مستقر مع إمكانية تحسين كفاءة المشتريات</p>
          </div>
        </div>
      </div>
    </div>
  );
}
