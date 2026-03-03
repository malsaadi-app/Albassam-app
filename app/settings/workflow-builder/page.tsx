'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function WorkflowBuilderHome() {
  const [defs, setDefs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')

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

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <PageHeader title="🧩 Workflow Builder" breadcrumbs={['الرئيسية', 'الإعدادات', 'Workflow Builder']} />

        <Card variant="default">
          <div style={{ padding: 16, display: 'grid', gap: 10 }}>
            <div style={{ fontWeight: 900 }}>قوالب جاهزة</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="primary" onClick={createSchoolTemplates}>
                إنشاء قوالب المدارس (HR)
              </Button>
            </div>
          </div>
        </Card>

        <Card variant="default">
          <div style={{ padding: 16, display: 'grid', gap: 10 }}>
            <div style={{ fontWeight: 900 }}>إنشاء Workflow جديد (يدوي)</div>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم" style={{ padding: 12, borderRadius: 12, border: '1px solid #E5E7EB' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="primary" onClick={create}>
                إنشاء
              </Button>
            </div>
          </div>
        </Card>

        <Card variant="default">
          <div style={{ padding: 16 }}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>Workflows</div>
            {loading ? (
              <div>جاري التحميل…</div>
            ) : defs.length === 0 ? (
              <div style={{ color: '#6B7280' }}>لا يوجد Workflows.</div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {defs.map((d) => (
                  <a key={d.id} href={`/settings/workflow-builder/${d.id}`} style={{ textDecoration: 'none', color: '#111827', border: '1px solid #E5E7EB', borderRadius: 14, padding: 12, background: 'white' }}>
                    <div style={{ fontWeight: 900 }}>{d.name}</div>
                    <div style={{ color: '#6B7280', fontSize: 12 }}>{d.module} — آخر إصدار: {d.versions?.[0]?.version ?? '-'}</div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
