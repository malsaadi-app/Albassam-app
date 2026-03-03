'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export type StepDraft = {
  order: number
  titleAr: string
  titleEn?: string | null
  stepType: string
  configJson: any
  requireComment: boolean
  allowConsult: boolean
  allowDelegation: boolean
}

const STEP_TYPES = [
  { value: 'STAGE_HEAD', label: 'اعتماد مسؤول المرحلة (STAGE_HEAD)' },
  { value: 'VP_EDUCATIONAL', label: 'اعتماد نائب الرئيس للشؤون التعليمية (VP_EDUCATIONAL)' },
  { value: 'USER', label: 'مستخدم محدد (USER)' },
  { value: 'DELEGATE_POOL', label: 'تنفيذ/توزيع (DELEGATE_POOL)' },
]

export function StepEditor(props: {
  open: boolean
  step: StepDraft | null
  onClose: () => void
  onSave: (step: StepDraft) => void
}) {
  const { open, step, onClose, onSave } = props
  const [draft, setDraft] = useState<StepDraft | null>(step)

  useEffect(() => {
    setDraft(step)
  }, [step])

  const stepType = draft?.stepType || ''

  const userId = useMemo(() => {
    if (stepType !== 'USER') return ''
    return String((draft?.configJson || {})?.userId || '')
  }, [draft, stepType])

  if (!open || !draft) return null

  const update = (patch: Partial<StepDraft>) => setDraft({ ...draft, ...patch })

  const save = () => {
    // normalize config
    const cfg = { ...(draft.configJson || {}) }
    if (draft.stepType === 'USER') {
      cfg.userId = String(cfg.userId || '').trim()
    }
    onSave({ ...draft, configJson: cfg })
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 60,
      }}
      onClick={onClose}
    >
      <div style={{ width: 'min(720px, 100%)' }} onClick={(e) => e.stopPropagation()}>
        <Card variant="default">
          <div style={{ padding: 16, display: 'grid', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ fontWeight: 900 }}>إعداد الخطوة</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="outline" onClick={onClose}>إلغاء</Button>
                <Button variant="primary" onClick={save}>حفظ</Button>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              <label style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>العنوان (عربي)</label>
              <input
                value={draft.titleAr}
                onChange={(e) => update({ titleAr: e.target.value })}
                style={{ padding: 12, borderRadius: 12, border: '1px solid #E5E7EB' }}
              />

              <label style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>نوع الخطوة</label>
              <select
                value={draft.stepType}
                onChange={(e) => update({ stepType: e.target.value })}
                style={{ padding: 12, borderRadius: 12, border: '1px solid #E5E7EB', background: 'white' }}
              >
                <option value="">اختر</option>
                {STEP_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>

              {draft.stepType === 'USER' && (
                <>
                  <label style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>userId (مستخدم محدد)</label>
                  <input
                    value={userId}
                    onChange={(e) => update({ configJson: { ...(draft.configJson || {}), userId: e.target.value } })}
                    style={{ padding: 12, borderRadius: 12, border: '1px solid #E5E7EB' }}
                    placeholder="مثال: cmm..."
                  />
                  <div style={{ color: '#64748B', fontSize: 12 }}>
                    ملاحظة: لاحقًا بنستبدلها ببحث واختيار مستخدم من القائمة.
                  </div>
                </>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 800 }}>
                  <input type="checkbox" checked={draft.requireComment} onChange={(e) => update({ requireComment: e.target.checked })} />
                  تعليق إلزامي
                </label>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 800 }}>
                  <input type="checkbox" checked={draft.allowConsult} onChange={(e) => update({ allowConsult: e.target.checked })} />
                  السماح بطلب رأي
                </label>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 800 }}>
                  <input type="checkbox" checked={draft.allowDelegation} onChange={(e) => update({ allowDelegation: e.target.checked })} />
                  السماح بالإحالة
                </label>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
