'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function WorkflowBuilderDetail() {
  const params = useParams() as any
  const workflowId = String(params.workflowId || '')

  const [def, setDef] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const versions = def?.versions || []
  const draft = versions.find((v: any) => v.status === 'DRAFT') || versions[0]

  const load = async () => {
    setLoading(true)
    setError('')
    const res = await fetch(`/api/settings/workflow-builder/${workflowId}`)
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(data.error || 'Failed')
      setLoading(false)
      return
    }
    setDef(data.def)
    setLoading(false)
  }

  useEffect(() => {
    if (workflowId) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowId])

  const steps = useMemo(() => (draft?.steps || []).slice().sort((a: any, b: any) => a.order - b.order), [draft])

  const publish = async () => {
    if (!draft?.id) return
    const ok = confirm('نشر هذه النسخة؟')
    if (!ok) return
    const res = await fetch(`/api/settings/workflow-builder/versions/${draft.id}/publish`, { method: 'POST' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      alert(data.error || 'فشل')
      return
    }
    alert('✅ تم النشر')
    load()
  }

  const cloneFrom = async () => {
    const sourceVersionId = prompt('ادخل sourceVersionId للنسخ (مؤقتاً)')
    if (!sourceVersionId) return
    const res = await fetch(`/api/settings/workflow-builder/${workflowId}/clone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceVersionId }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      alert(data.error || 'فشل')
      return
    }
    alert('✅ تم إنشاء نسخة Draft')
    load()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <PageHeader title={`🧩 Workflow Builder — ${def?.name || ''}`} breadcrumbs={['الرئيسية', 'الإعدادات', 'Workflow Builder']} />

        {error && <div style={{ marginBottom: 12, color: '#991B1B' }}>{error}</div>}

        <Card variant="default">
          <div style={{ padding: 16, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 900 }}>الإصدار الحالي</div>
              <div style={{ color: '#6B7280', fontSize: 12 }}>Draft: {draft?.version ?? '-'}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button variant="outline" onClick={load}>
                تحديث
              </Button>
              <Button variant="secondary" onClick={cloneFrom}>
                📄 نسخ (مؤقت)
              </Button>
              <Button variant="primary" onClick={publish}>
                نشر
              </Button>
            </div>
          </div>
        </Card>

        <Card variant="default">
          <div style={{ padding: 16 }}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>الخطوات</div>
            {loading ? (
              <div>جاري التحميل…</div>
            ) : steps.length === 0 ? (
              <div style={{ color: '#6B7280' }}>لا يوجد خطوات (UI للـBuilder بيجي في المرحلة القادمة).</div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {steps.map((s: any) => (
                  <div key={s.id} style={{ border: '1px solid #E5E7EB', borderRadius: 14, padding: 12, background: 'white' }}>
                    <div style={{ fontWeight: 900 }}>{s.order + 1}. {s.titleAr}</div>
                    <div style={{ color: '#6B7280', fontSize: 12 }}>{s.stepType}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
