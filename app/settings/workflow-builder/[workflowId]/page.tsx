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

  const [localRules, setLocalRules] = useState<any[]>([])
  const [rulesDirty, setRulesDirty] = useState(false)
  const [branches, setBranches] = useState<any[]>([])
  const [branchesLoaded, setBranchesLoaded] = useState(false)
  const [ruleModal, setRuleModal] = useState(false)
  const [requestTypes, setRequestTypes] = useState<string[]>([])
  const [requestTypesLoaded, setRequestTypesLoaded] = useState(false)
  const [ruleRequestType, setRuleRequestType] = useState('')
  const [ruleBranchQuery, setRuleBranchQuery] = useState('')
  const [ruleSelectedBranchIds, setRuleSelectedBranchIds] = useState<string[]>([])
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

    const r = (draft?.rules || []).map((x: any) => ({
      requestType: x.requestType,
      branchId: x.branchId,
      enabled: x.enabled !== false,
    }))
    setLocalRules(r)
    setRulesDirty(false)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft?.id])

  useEffect(() => {
    if (branchesLoaded) return
    ;(async () => {
      try {
        const res = await fetch('/api/branches')
        if (!res.ok) return
        const data = await res.json().catch(() => [])
        const arr = Array.isArray(data) ? data : data.branches || []
        // Exclude QA branches in Workflow Builder UX
        setBranches(arr.filter((b: any) => !String(b.name || '').includes('QA')))
        setBranchesLoaded(true)
      } catch {
        // ignore
      }
    })()
  }, [branchesLoaded])

  useEffect(() => {
    if (requestTypesLoaded) return
    ;(async () => {
      try {
        const res = await fetch('/api/hr/request-types')
        if (!res.ok) return
        const data = await res.json().catch(() => ({}))
        const types = Array.isArray(data?.types) ? data.types.map(String) : []
        setRequestTypes(types)
        setRequestTypesLoaded(true)
      } catch {
        // ignore
      }
    })()
  }, [requestTypesLoaded])

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

  const saveRules = async () => {
    if (!draft?.id) return
    const res = await fetch(`/api/settings/workflow-builder/versions/${draft.id}/rules`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rules: localRules }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      alert(data.error || 'فشل')
      return
    }
    alert('✅ تم حفظ القواعد')
    setRulesDirty(false)
    load()
  }

  const openAddRule = () => {
    setRuleRequestType('')
    setRuleBranchQuery('')
    setRuleSelectedBranchIds([])
    setRuleModal(true)
  }

  const addRulesForBranches = () => {
    const rt = ruleRequestType.trim()
    if (!rt) {
      alert('اختر نوع الطلب')
      return
    }
    if (!ruleSelectedBranchIds.length) {
      alert('اختر فرع واحد على الأقل')
      return
    }

    setLocalRules((prev) => {
      const next = [...prev]
      for (const bid of ruleSelectedBranchIds) {
        next.push({ requestType: rt, branchId: bid, enabled: true })
      }
      // dedupe
      const seen = new Set<string>()
      return next.filter((r: any) => {
        const k = `${r.requestType}::${r.branchId}`
        if (seen.has(k)) return false
        seen.add(k)
        return true
      })
    })
    setRulesDirty(true)
    setRuleModal(false)
  }

  const removeRule = (idx: number) => {
    setLocalRules((prev) => prev.filter((_, i) => i !== idx))
    setRulesDirty(true)
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

  const [cloneModal, setCloneModal] = useState(false)

  const cloneFrom = async (sourceVersionId: string) => {
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
    setCloneModal(false)
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
              <Button variant="secondary" onClick={() => setCloneModal(true)}>
                📄 نسخ
              </Button>
              <Button variant="primary" onClick={publish}>
                نشر
              </Button>
              <Button variant={dirty ? 'primary' : 'outline'} onClick={saveSteps} disabled={!dirty}>
                💾 حفظ الخطوات
              </Button>
              <Button variant={rulesDirty ? 'primary' : 'outline'} onClick={saveRules} disabled={!rulesDirty}>
                💾 حفظ القواعد
              </Button>
            </div>
          </div>
        </Card>

        <Card variant="default">
          <div style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontWeight: 900 }}>القواعد (متى ينطبق)</div>
              <Button variant="outline" onClick={openAddRule}>➕ إضافة قاعدة</Button>
            </div>

            {loading ? (
              <div>جاري التحميل…</div>
            ) : localRules.length === 0 ? (
              <div style={{ color: '#6B7280' }}>لا توجد قواعد.</div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {localRules.map((r: any, idx: number) => {
                  const b = branches.find((x: any) => x.id === r.branchId)
                  return (
                    <div key={idx} style={{ border: '1px solid #E5E7EB', borderRadius: 14, padding: 12, background: 'white', display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 900 }}>{r.requestType}</div>
                        <div style={{ color: '#64748B', fontSize: 12 }}>{b?.name || r.branchId}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 800 }}>
                          <input
                            type="checkbox"
                            checked={r.enabled !== false}
                            onChange={(e) => {
                              const enabled = e.target.checked
                              setLocalRules((prev) => prev.map((x, i) => (i === idx ? { ...x, enabled } : x)))
                              setRulesDirty(true)
                            }}
                          />
                          مفعّل
                        </label>
                        <Button variant="outline" onClick={() => removeRule(idx)}>
                          🗑️ حذف
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
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
        {/* Add Rule modal */}
        {ruleModal && (
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
            onClick={() => setRuleModal(false)}
          >
            <div style={{ width: 'min(720px, 100%)' }} onClick={(e) => e.stopPropagation()}>
              <Card variant="default">
                <div style={{ padding: 16, display: 'grid', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: 900 }}>إضافة قاعدة</div>
                    <Button variant="outline" onClick={() => setRuleModal(false)}>إغلاق</Button>
                  </div>

                  <label style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>نوع الطلب (RequestType)</label>
                  <select
                    value={ruleRequestType}
                    onChange={(e) => setRuleRequestType(e.target.value)}
                    style={{ padding: 12, borderRadius: 12, border: '1px solid #E5E7EB', background: 'white' }}
                  >
                    <option value="">اختر…</option>
                    {requestTypes.map((x) => (
                      <option key={x} value={x}>{x}</option>
                    ))}
                  </select>

                  <label style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>الفروع</label>
                  <input
                    value={ruleBranchQuery}
                    onChange={(e) => setRuleBranchQuery(e.target.value)}
                    style={{ padding: 12, borderRadius: 12, border: '1px solid #E5E7EB' }}
                    placeholder="بحث باسم الفرع…"
                  />

                  <div style={{ maxHeight: 260, overflow: 'auto', border: '1px solid #E5E7EB', borderRadius: 12, background: 'white' }}>
                    {branches
                      .filter((b: any) => {
                        const q = ruleBranchQuery.trim().toLowerCase()
                        if (!q) return true
                        return String(b.name || '').toLowerCase().includes(q)
                      })
                      .slice(0, 50)
                      .map((b: any) => {
                        const checked = ruleSelectedBranchIds.includes(String(b.id))
                        return (
                          <label key={b.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid #F1F5F9', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const on = e.target.checked
                                setRuleSelectedBranchIds((prev) => {
                                  const s = new Set(prev)
                                  if (on) s.add(String(b.id))
                                  else s.delete(String(b.id))
                                  return Array.from(s)
                                })
                              }}
                            />
                            <div>
                              <div style={{ fontWeight: 900 }}>{b.name}</div>
                              <div style={{ color: '#64748B', fontSize: 12 }}>{b.type}</div>
                            </div>
                          </label>
                        )
                      })}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
                    <Button variant="outline" onClick={() => setRuleModal(false)}>إلغاء</Button>
                    <Button variant="primary" onClick={addRulesForBranches}>إضافة</Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Clone modal */}
        {cloneModal && (
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
            onClick={() => setCloneModal(false)}
          >
            <div style={{ width: 'min(720px, 100%)' }} onClick={(e) => e.stopPropagation()}>
              <Card variant="default">
                <div style={{ padding: 16, display: 'grid', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: 900 }}>نسخ من إصدار</div>
                    <Button variant="outline" onClick={() => setCloneModal(false)}>
                      إغلاق
                    </Button>
                  </div>

                  <div style={{ color: '#64748B', fontSize: 12 }}>
                    اختر الإصدار المصدر، وسيتم إنشاء Draft جديد داخل نفس الـWorkflow.
                  </div>

                  <div style={{ display: 'grid', gap: 10 }}>
                    {versions
                      .slice()
                      .sort((a: any, b: any) => (b.version || 0) - (a.version || 0))
                      .map((v: any) => (
                        <div
                          key={v.id}
                          style={{
                            border: '1px solid #E5E7EB',
                            borderRadius: 14,
                            padding: 12,
                            background: 'white',
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: 10,
                            alignItems: 'center',
                            flexWrap: 'wrap',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 900 }}>v{v.version} — {String(v.status || '').toUpperCase()}</div>
                            <div style={{ color: '#64748B', fontSize: 12 }}>
                              خطوات: {v.steps?.length || 0} • قواعد: {v.rules?.length || 0}
                            </div>
                          </div>
                          <Button variant="primary" onClick={() => cloneFrom(v.id)}>
                            نسخ هذا الإصدار
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

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
