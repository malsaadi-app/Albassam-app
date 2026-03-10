'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function WorkflowAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<any>(null)
  const [dateRange, setDateRange] = useState('30') // 7, 30, 90, all
  const [workflowFilter, setWorkflowFilter] = useState('all')

  const load = async () => {
    setLoading(true)
    
    // Calculate date range
    const params = new URLSearchParams()
    if (dateRange !== 'all') {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - parseInt(dateRange))
      params.set('startDate', startDate.toISOString().split('T')[0])
    }
    if (workflowFilter !== 'all') {
      params.set('workflowId', workflowFilter)
    }

    const res = await fetch(`/api/settings/workflow-builder/analytics?${params}`)
    const data = await res.json().catch(() => ({}))
    
    if (res.ok) {
      setAnalytics(data.analytics)
    }
    
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [dateRange, workflowFilter])

  const summary = analytics?.summary || {}
  const statusBreakdown = analytics?.statusBreakdown || []
  const typeBreakdown = analytics?.typeBreakdown || []
  const timeline = analytics?.timeline || []
  const topWorkflows = analytics?.topWorkflows || []
  const recentRequests = analytics?.recentRequests || []

  // Get status counts
  const pendingCount = statusBreakdown.find((s: any) => s.status === 'PENDING_REVIEW')?.count || 0
  const approvedCount = statusBreakdown.find((s: any) => s.status === 'APPROVED')?.count || 0
  const rejectedCount = statusBreakdown.find((s: any) => s.status === 'REJECTED')?.count || 0

  // Export to CSV
  const exportCSV = () => {
    if (!analytics) return

    const rows = [
      ['Workflow Analytics Report'],
      ['Generated:', new Date().toLocaleString('ar-SA')],
      [''],
      ['Summary'],
      ['Total Requests', summary.totalCount],
      ['Avg Approval Time (hours)', summary.avgApprovalTimeHours],
      ['Approval Rate (%)', summary.approvalRate],
      [''],
      ['Status Breakdown'],
      ['Status', 'Count'],
      ...statusBreakdown.map((s: any) => [s.status, s.count]),
      [''],
      ['Type Breakdown'],
      ['Type', 'Count'],
      ...typeBreakdown.map((t: any) => [t.type, t.count]),
    ]

    const csv = rows.map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `workflow-analytics-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '24px 16px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* Enhanced Header */}
        <div style={{ marginBottom: 24, background: 'rgba(255,255,255,0.95)', borderRadius: 20, padding: 24, boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: '900', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 8 }}>
                📊 Workflow Analytics
              </div>
              <div style={{ color: '#6B7280', fontSize: 14 }}>
                الرئيسية / الإعدادات / Workflow Builder / Analytics
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="outline" onClick={() => window.location.href = '/settings/workflow-builder'} style={{ borderRadius: 12 }}>
                ← العودة
              </Button>
              <Button 
                variant="primary" 
                onClick={exportCSV}
                disabled={!analytics}
                style={{ 
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
                }}
              >
                📥 تصدير CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card variant="default" style={{ marginBottom: 20, borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: 'none' }}>
          <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '700', marginBottom: 8, color: '#374151' }}>
                  الفترة الزمنية
                </label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    border: '2px solid rgba(102, 126, 234, 0.2)',
                    fontSize: 14,
                    fontWeight: '600',
                    minWidth: 180,
                    cursor: 'pointer'
                  }}
                >
                  <option value="7">آخر 7 أيام</option>
                  <option value="30">آخر 30 يوم</option>
                  <option value="90">آخر 90 يوم</option>
                  <option value="all">كل الفترات</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'white' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <div style={{ fontSize: 18, fontWeight: '600' }}>جاري التحميل...</div>
          </div>
        ) : !analytics ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'white' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <div style={{ fontSize: 18, fontWeight: '600' }}>فشل في تحميل البيانات</div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 20 }}>
              {/* Total Requests */}
              <Card variant="default" style={{ borderRadius: 20, border: 'none', overflow: 'hidden', position: 'relative' }}>
                <div style={{ 
                  padding: 24, 
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
                }}>
                  <div style={{ fontSize: 14, fontWeight: '700', color: '#6B7280', marginBottom: 8 }}>
                    إجمالي الطلبات
                  </div>
                  <div style={{ 
                    fontSize: 36, 
                    fontWeight: '900',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    {summary.totalCount || 0}
                  </div>
                  <div style={{ position: 'absolute', top: 20, right: 20, fontSize: 40, opacity: 0.2 }}>
                    📊
                  </div>
                </div>
              </Card>

              {/* Pending */}
              <Card variant="default" style={{ borderRadius: 20, border: 'none', overflow: 'hidden', position: 'relative' }}>
                <div style={{ 
                  padding: 24, 
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)'
                }}>
                  <div style={{ fontSize: 14, fontWeight: '700', color: '#6B7280', marginBottom: 8 }}>
                    معلقة
                  </div>
                  <div style={{ 
                    fontSize: 36, 
                    fontWeight: '900',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    {pendingCount}
                  </div>
                  <div style={{ position: 'absolute', top: 20, right: 20, fontSize: 40, opacity: 0.2 }}>
                    ⏳
                  </div>
                </div>
              </Card>

              {/* Approved */}
              <Card variant="default" style={{ borderRadius: 20, border: 'none', overflow: 'hidden', position: 'relative' }}>
                <div style={{ 
                  padding: 24, 
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)'
                }}>
                  <div style={{ fontSize: 14, fontWeight: '700', color: '#6B7280', marginBottom: 8 }}>
                    مقبولة
                  </div>
                  <div style={{ 
                    fontSize: 36, 
                    fontWeight: '900',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    {approvedCount}
                  </div>
                  <div style={{ position: 'absolute', top: 20, right: 20, fontSize: 40, opacity: 0.2 }}>
                    ✅
                  </div>
                </div>
              </Card>

              {/* Rejected */}
              <Card variant="default" style={{ borderRadius: 20, border: 'none', overflow: 'hidden', position: 'relative' }}>
                <div style={{ 
                  padding: 24, 
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)'
                }}>
                  <div style={{ fontSize: 14, fontWeight: '700', color: '#6B7280', marginBottom: 8 }}>
                    مرفوضة
                  </div>
                  <div style={{ 
                    fontSize: 36, 
                    fontWeight: '900',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    {rejectedCount}
                  </div>
                  <div style={{ position: 'absolute', top: 20, right: 20, fontSize: 40, opacity: 0.2 }}>
                    ❌
                  </div>
                </div>
              </Card>

              {/* Avg Approval Time */}
              <Card variant="default" style={{ borderRadius: 20, border: 'none', overflow: 'hidden', position: 'relative' }}>
                <div style={{ 
                  padding: 24, 
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)'
                }}>
                  <div style={{ fontSize: 14, fontWeight: '700', color: '#6B7280', marginBottom: 8 }}>
                    متوسط وقت الموافقة
                  </div>
                  <div style={{ 
                    fontSize: 36, 
                    fontWeight: '900',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    {summary.avgApprovalTimeHours || 0}
                  </div>
                  <div style={{ fontSize: 13, color: '#6B7280', fontWeight: '600', marginTop: 4 }}>
                    ساعة
                  </div>
                  <div style={{ position: 'absolute', top: 20, right: 20, fontSize: 40, opacity: 0.2 }}>
                    ⏱️
                  </div>
                </div>
              </Card>

              {/* Approval Rate */}
              <Card variant="default" style={{ borderRadius: 20, border: 'none', overflow: 'hidden', position: 'relative' }}>
                <div style={{ 
                  padding: 24, 
                  background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(219, 39, 119, 0.1) 100%)'
                }}>
                  <div style={{ fontSize: 14, fontWeight: '700', color: '#6B7280', marginBottom: 8 }}>
                    معدل القبول
                  </div>
                  <div style={{ 
                    fontSize: 36, 
                    fontWeight: '900',
                    background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    {summary.approvalRate || 0}%
                  </div>
                  <div style={{ position: 'absolute', top: 20, right: 20, fontSize: 40, opacity: 0.2 }}>
                    📈
                  </div>
                </div>
              </Card>
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20, marginBottom: 20 }}>
              {/* Type Breakdown */}
              <Card variant="default" style={{ borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: 'none' }}>
                <div style={{ padding: 24 }}>
                  <div style={{ 
                    fontSize: 18, 
                    fontWeight: '900', 
                    marginBottom: 20,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    📋 توزيع حسب النوع
                  </div>
                  {typeBreakdown.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>
                      لا توجد بيانات
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: 12 }}>
                      {typeBreakdown.map((item: any, idx: number) => (
                        <div key={idx} style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          padding: 12,
                          background: 'rgba(102, 126, 234, 0.05)',
                          borderRadius: 12
                        }}>
                          <span style={{ fontWeight: '700', color: '#374151' }}>{item.type}</span>
                          <span style={{ 
                            fontWeight: '900',
                            fontSize: 18,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                          }}>
                            {item.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              {/* Top Workflows */}
              <Card variant="default" style={{ borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: 'none' }}>
                <div style={{ padding: 24 }}>
                  <div style={{ 
                    fontSize: 18, 
                    fontWeight: '900', 
                    marginBottom: 20,
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    🏆 الأكثر استخداماً
                  </div>
                  {topWorkflows.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>
                      لا توجد بيانات
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: 12 }}>
                      {topWorkflows.map((item: any, idx: number) => (
                        <div key={idx} style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          padding: 12,
                          background: 'rgba(16, 185, 129, 0.05)',
                          borderRadius: 12
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: 'white',
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 14,
                              fontWeight: '900'
                            }}>
                              {idx + 1}
                            </span>
                            <span style={{ fontWeight: '700', color: '#374151' }}>{item.type}</span>
                          </div>
                          <span style={{ 
                            fontWeight: '900',
                            fontSize: 18,
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                          }}>
                            {item.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Recent Requests */}
            <Card variant="default" style={{ borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: 'none' }}>
              <div style={{ padding: 24 }}>
                <div style={{ 
                  fontSize: 18, 
                  fontWeight: '900', 
                  marginBottom: 20,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  🕐 آخر الطلبات
                </div>
                {recentRequests.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>
                    لا توجد طلبات
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: 12 }}>
                    {recentRequests.map((req: any) => (
                      <div key={req.id} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: 16,
                        background: 'rgba(102, 126, 234, 0.05)',
                        borderRadius: 12
                      }}>
                        <div>
                          <div style={{ fontWeight: '700', color: '#374151', marginBottom: 4 }}>
                            {req.employee?.displayName || 'غير معروف'}
                          </div>
                          <div style={{ fontSize: 13, color: '#6B7280' }}>
                            {req.type} • {new Date(req.createdAt).toLocaleString('ar-SA', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                        <span style={{
                          padding: '6px 14px',
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: '700',
                          background: req.status === 'APPROVED' 
                            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                            : req.status === 'REJECTED'
                            ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                            : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                          color: 'white'
                        }}>
                          {req.status === 'APPROVED' ? '✅ مقبول' : req.status === 'REJECTED' ? '❌ مرفوض' : '⏳ معلق'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
