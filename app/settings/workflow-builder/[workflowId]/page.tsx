'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StepEditor, type StepDraft } from '../components/StepEditor'

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

  const [localSteps, setLocalSteps] = useState<StepDraft[]>([])
  const [dirty, setDirty] = useState(false)
  const [dragId, setDragId] = useState<string | null>(null)
  const [editor, setEditor] = useState<{ open: boolean; idx: number | null }>({ open: false, idx: null })

  useEffect(() => {
    // reset local steps when draft changes
    const mapped: StepDraft[] = steps.map((s: any, i: number) => ({
      order: i + 1,
      titleAr: s.titleAr,
      titleEn: s.titleEn ?? null,
      stepType: s.stepType,
      configJson: s.configJson || {},
      requireComment: s.requireComment ?? true,
      allowConsult: s.allowConsult ?? true,
      allowDelegation: s.allowDelegation ?? true,
    }))
    setLocalSteps(mapped)
    setDirty(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft?.id])

  const saveSteps = async () => {
    if (!draft?.id) return
    const res = await fetch(`/api/settings/workflow-builder/versions/${draft.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ steps: localSteps.map((s, i) => ({ ...s, order: i + 1 })) }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      alert(data.error || 'فشل')
      return
    }
    alert('✅ تم الحفظ')
    setDirty(false)
    load()
  }

  const addStep = () => {
    setLocalSteps((prev) => {
      const next = [...prev]
      next.push({
        order: next.length + 1,
        titleAr: 'خطوة جديدة',
        titleEn: null,
        stepType: 'USER',
        configJson: { userId: '' },
        requireComment: true,
        allowConsult: true,
        allowDelegation: true,
      })
      return next
    })
    setDirty(true)
  }

  const removeStep = (idx: number) => {
    if (!confirm('حذف هذه الخطوة؟')) return
    setLocalSteps((prev) => prev.filter((_, i) => i !== idx))
    setDirty(true)
  }

  const onDragStart = (idx: number) => {
    setDragId(String(idx))
  }

  const onDrop = (targetIdx: number) => {
    if (dragId === null) return
    const fromIdx = Number(dragId)
    if (!Number.isFinite(fromIdx) || fromIdx === targetIdx) {
      setDragId(null)
      return
    }
    setLocalSteps((prev) => {
      const next = [...prev]
      const [moved] = next.splice(fromIdx, 1)
      next.splice(targetIdx, 0, moved)
      return next
    })
    setDirty(true)
    setDragId(null)
  }

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
              <Button variant="outline" onClick={addStep}>
                ➕ إضافة خطوة
              </Button>
              <Button variant="secondary" onClick={cloneFrom}>
                📄 نسخ (مؤقت)
              </Button>
              <Button variant="primary" onClick={publish}>
                نشر
              </Button>
              <Button variant={dirty ? 'primary' : 'outline'} onClick={saveSteps} disabled={!dirty}>
                💾 حفظ الترتيب/الإعدادات
              </Button>
            </div>
          </div>
        </Card>

        <Card variant="default">
          <div style={{ padding: 16 }}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>الخطوات</div>
            {loading ? (
              <div>جاري التحميل…</div>
            ) : localSteps.length === 0 ? (
              <div style={{ color: '#6B7280' }}>لا يوجد خطوات.</div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {localSteps.map((s: any, idx: number) => (
                  <div
                    key={idx}
                    draggable
                    onDragStart={() => onDragStart(idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => onDrop(idx)}
                    style={{
                      border: '1px solid #E5E7EB',
                      borderRadius: 14,
                      padding: 12,
                      background: 'white',
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 12,
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ display: 'grid', gap: 4 }}>
                      <div style={{ fontWeight: 900 }}>
                        <span style={{ cursor: 'grab', marginInlineEnd: 8 }}>⠿</span>
                        {idx + 1}. {s.titleAr}
                      </div>
                      <div style={{ color: '#6B7280', fontSize: 12 }}>{s.stepType}</div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <Button
                        variant="outline"
                        onClick={() => setEditor({ open: true, idx })}
                      >
                        ✏️ تعديل
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => removeStep(idx)}
                      >
                        🗑️ حذف
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
        <StepEditor
          open={editor.open}
          step={editor.idx === null ? null : localSteps[editor.idx]}
          onClose={() => setEditor({ open: false, idx: null })}
          onSave={(updated) => {
            if (editor.idx === null) return
            setLocalSteps((prev) => prev.map((s, i) => (i === editor.idx ? updated : s)))
            setDirty(true)
            setEditor({ open: false, idx: null })
          }}
        />
      </div>
    </div>
  )
}
