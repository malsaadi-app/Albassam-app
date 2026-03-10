'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function WorkflowBuilderHome() {
  const [defs, setDefs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  
  // Edit modal state
  const [editModal, setEditModal] = useState<{ open: boolean; workflow: any | null }>({ open: false, workflow: null })
  const [editName, setEditName] = useState('')

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/settings/workflow-builder')
    const data = await res.json().catch(() => ({}))
    setDefs(data.defs || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const create = async () => {
    const n = name.trim()
    if (!n) return
    const res = await fetch('/api/settings/workflow-builder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module: 'HR', name: n }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      alert(data.error || `فشل (HTTP ${res.status})`)
      return
    }
    setName('')
    await load()
  }

  const createSchoolTemplates = async () => {
    if (!confirm('إنشاء قوالب المدارس (HR)؟')) return
    const res = await fetch('/api/settings/workflow-builder/templates/schools', { method: 'POST' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      alert(data.error || `فشل (HTTP ${res.status})`)
      return
    }
    await load()
    alert(`تم. تم إنشاء: ${data.created?.length || 0} — موجود مسبقاً: ${data.ensured?.length || 0}`)
  }

  const publishAllSchoolTemplates = async () => {
    if (!confirm('نشر جميع قوالب المدارس (HR)؟')) return
    const res = await fetch('/api/settings/workflow-builder/templates/schools/publish-all', { method: 'POST' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      alert(data.error || `فشل (HTTP ${res.status})`)
      return
    }
    await load()
    const okCount = (data.results || []).filter((r: any) => r.published).length
    alert(`✅ تم نشر: ${okCount} من ${data.count || 0}`)
  }

  // Edit workflow name
  const openEditModal = (workflow: any) => {
    setEditModal({ open: true, workflow })
    setEditName(workflow.name || '')
  }

  const closeEditModal = () => {
    setEditModal({ open: false, workflow: null })
    setEditName('')
  }

  const saveEdit = async () => {
    const n = editName.trim()
    if (!n || !editModal.workflow) return

    const res = await fetch('/api/settings/workflow-builder', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editModal.workflow.id, name: n }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      alert(data.error || `فشل (HTTP ${res.status})`)
      return
    }

    alert('✅ تم تحديث الاسم')
    closeEditModal()
    await load()
  }

  // Delete workflow
  const deleteWorkflow = async (workflow: any) => {
    const confirmed = confirm(`⚠️ هل أنت متأكد من حذف "${workflow.name}"؟\n\nسيتم حذف جميع الإصدارات والخطوات المرتبطة بهذا الـ workflow.`)
    if (!confirmed) return

    const res = await fetch(`/api/settings/workflow-builder?id=${workflow.id}`, {
      method: 'DELETE',
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      alert(data.error || `فشل (HTTP ${res.status})`)
      return
    }

    alert('✅ تم الحذف')
    await load()
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '24px 16px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Enhanced Header */}
        <div style={{ marginBottom: 24, background: 'rgba(255,255,255,0.95)', borderRadius: 20, padding: 24, boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: '900', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 8 }}>
                ⚙️ Workflow Builder
              </div>
              <div style={{ color: '#6B7280', fontSize: 14 }}>
                الرئيسية / الإعدادات / Workflow Builder
              </div>
            </div>
            <Button
              variant="primary"
              onClick={() => window.location.href = '/settings/workflow-builder/analytics'}
              style={{
                borderRadius: 12,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                padding: '12px 24px',
                fontSize: 15,
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              📊 Analytics
            </Button>
          </div>
        </div>

        <Card variant="default" style={{ marginBottom: 20, borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: 'none' }}>
          <div style={{ 
            padding: 24,
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%)'
          }}>
            <div style={{ 
              fontSize: 18, 
              fontWeight: '900', 
              marginBottom: 16,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}>
              📋 قوالب جاهزة
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
              <Button 
                variant="outline" 
                onClick={publishAllSchoolTemplates}
                style={{ borderRadius: 12 }}
              >
                🚀 نشر جميع قوالب المدارس (HR)
              </Button>
              <Button 
                variant="primary" 
                onClick={createSchoolTemplates}
                style={{ 
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
                }}
              >
                ✨ إنشاء قوالب المدارس (HR)
              </Button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
              <Button
                variant="outline"
                onClick={async () => {
                  if (!confirm('إنشاء قالب المشتريات (طلب شراء)؟')) return
                  const res = await fetch('/api/settings/workflow-builder/templates/procurement/purchase-requests', { method: 'POST' })
                  const data = await res.json().catch(() => ({}))
                  if (!res.ok) return alert(data.error || `فشل (HTTP ${res.status})`)
                  await load()
                  alert('✅ تم إنشاء قالب المشتريات (Draft)')
                }}
                style={{ borderRadius: 12 }}
              >
                🛒 إنشاء قالب المشتريات — طلب شراء
              </Button>
            </div>
          </div>
        </Card>

        <Card variant="default" style={{ marginBottom: 20, borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: 'none' }}>
          <div style={{ 
            padding: 24,
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(217, 119, 6, 0.05) 100%)'
          }}>
            <div style={{ 
              fontSize: 18, 
              fontWeight: '900', 
              marginBottom: 16,
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}>
              ✏️ إنشاء Workflow جديد (يدوي)
            </div>
            <input 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="اسم الـ Workflow" 
              style={{ 
                width: '100%',
                padding: 14, 
                borderRadius: 12, 
                border: '2px solid rgba(245, 158, 11, 0.2)',
                fontSize: 15,
                fontWeight: '600',
                marginBottom: 12,
                transition: 'all 0.3s ease',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(245, 158, 11, 0.6)'
                e.target.style.boxShadow = '0 0 0 4px rgba(245, 158, 11, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(245, 158, 11, 0.2)'
                e.target.style.boxShadow = 'none'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="primary" 
                onClick={create}
                style={{ 
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  border: 'none',
                  boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)',
                  padding: '12px 24px',
                  fontSize: 15,
                  fontWeight: '700'
                }}
              >
                ✨ إنشاء
              </Button>
            </div>
          </div>
        </Card>

        <Card variant="default" style={{ borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: 'none' }}>
          <div style={{ padding: 24 }}>
            <div style={{ 
              fontSize: 20, 
              fontWeight: '900', 
              marginBottom: 20,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}>
              🧩 Workflows ({defs.length})
            </div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#6B7280' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
                <div style={{ fontSize: 16, fontWeight: '600' }}>جاري التحميل...</div>
              </div>
            ) : defs.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: 60,
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                borderRadius: 16,
                border: '2px dashed #E5E7EB'
              }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>🧩</div>
                <div style={{ color: '#6B7280', fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
                  لا يوجد Workflows
                </div>
                <div style={{ color: '#9CA3AF', fontSize: 14 }}>
                  ابدأ بإنشاء قالب أو workflow يدوي
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 16 }}>
                {defs.map((d) => {
                  const latestVersion = d.versions?.[0]
                  const status = latestVersion?.status || 'DRAFT'
                  const isDraft = status === 'DRAFT'
                  const isActive = status === 'ACTIVE'
                  
                  return (
                    <div 
                      key={d.id} 
                      style={{ 
                        color: '#111827', 
                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)',
                        borderRadius: 16,
                        padding: 20,
                        border: '1px solid rgba(102, 126, 234, 0.2)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                        position: 'relative' as any
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '800', fontSize: 17, color: '#111827', marginBottom: 8 }}>
                            {d.name}
                          </div>
                          <div style={{ 
                            fontSize: 13, 
                            color: '#6B7280',
                            display: 'flex',
                            gap: 8,
                            alignItems: 'center',
                            flexWrap: 'wrap'
                          }}>
                            <span style={{
                              background: 'rgba(255,255,255,0.9)',
                              padding: '4px 10px',
                              borderRadius: 8,
                              fontWeight: '600',
                              border: '1px solid rgba(102, 126, 234, 0.1)'
                            }}>
                              {d.module}
                            </span>
                            <span style={{
                              background: isDraft 
                                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                : isActive
                                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                : '#9CA3AF',
                              color: 'white',
                              padding: '4px 12px',
                              borderRadius: 20,
                              fontSize: 12,
                              fontWeight: '700',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }}>
                              {isDraft ? '📝 مسودة' : isActive ? '✅ مفعّل' : status}
                            </span>
                            <span>
                              آخر إصدار: v{latestVersion?.version ?? '-'}
                            </span>
                          </div>
                        </div>
                        
                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditModal(d)
                            }}
                            style={{
                              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                              color: 'white',
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              border: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 18,
                              cursor: 'pointer',
                              boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.1)'
                              e.currentTarget.style.boxShadow = '0 6px 20px rgba(245, 158, 11, 0.6)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)'
                              e.currentTarget.style.boxShadow = '0 4px 15px rgba(245, 158, 11, 0.4)'
                            }}
                            title="تعديل الاسم"
                          >
                            ✏️
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteWorkflow(d)
                            }}
                            style={{
                              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                              color: 'white',
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              border: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 18,
                              cursor: 'pointer',
                              boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.1)'
                              e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.6)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)'
                              e.currentTarget.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.4)'
                            }}
                            title="حذف"
                          >
                            🗑️
                          </button>

                          <a
                            href={`/settings/workflow-builder/${d.id}`}
                            style={{
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              border: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 20,
                              fontWeight: '900',
                              textDecoration: 'none',
                              cursor: 'pointer',
                              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.1)'
                              e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)'
                              e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)'
                            }}
                            title="فتح"
                          >
                            →
                          </a>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Edit Modal */}
        {editModal.open && (
          <div
            style={{
              position: 'fixed' as any,
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: 20
            }}
            onClick={closeEditModal}
          >
            <div
              style={{
                background: 'white',
                borderRadius: 20,
                padding: 32,
                maxWidth: 500,
                width: '100%',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                animation: 'slideIn 0.3s ease'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ 
                fontSize: 24, 
                fontWeight: '900', 
                marginBottom: 24,
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                ✏️ تعديل اسم الـ Workflow
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontWeight: '700', marginBottom: 8, color: '#374151' }}>
                  الاسم الجديد
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="أدخل اسم الـ workflow"
                  style={{
                    width: '100%',
                    padding: 14,
                    borderRadius: 12,
                    border: '2px solid rgba(245, 158, 11, 0.2)',
                    fontSize: 15,
                    fontWeight: '600',
                    outline: 'none',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(245, 158, 11, 0.6)'
                    e.target.style.boxShadow = '0 0 0 4px rgba(245, 158, 11, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(245, 158, 11, 0.2)'
                    e.target.style.boxShadow = 'none'
                  }}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <Button
                  variant="outline"
                  onClick={closeEditModal}
                  style={{ borderRadius: 12 }}
                >
                  إلغاء
                </Button>
                <Button
                  variant="primary"
                  onClick={saveEdit}
                  disabled={!editName.trim()}
                  style={{
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    border: 'none',
                    boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)'
                  }}
                >
                  💾 حفظ
                </Button>
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    </div>
  )
}
