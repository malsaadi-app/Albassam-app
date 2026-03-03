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
  { value: 'SYSTEM_ROLE', label: 'دور نظام (SYSTEM_ROLE)' },
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
  const [users, setUsers] = useState<any[]>([])
  const [usersLoaded, setUsersLoaded] = useState(false)
  const [roles, setRoles] = useState<any[]>([])
  const [rolesLoaded, setRolesLoaded] = useState(false)
  const [userQuery, setUserQuery] = useState('')

  useEffect(() => {
    setDraft(step)
    setUserQuery('')
  }, [step])

  useEffect(() => {
    const shouldLoad = open && !!draft && (draft.stepType === 'USER' || draft.stepType === 'DELEGATE_POOL')
    if (!shouldLoad || usersLoaded) return
    ;(async () => {
      try {
        const res = await fetch('/api/users')
        if (!res.ok) return
        const data = await res.json().catch(() => [])
        setUsers(Array.isArray(data) ? data : [])
        setUsersLoaded(true)
      } catch {
        // ignore
      }
    })()
  }, [open, draft, usersLoaded])

  useEffect(() => {
    const shouldLoad = open && !!draft && draft.stepType === 'SYSTEM_ROLE'
    if (!shouldLoad || rolesLoaded) return
    ;(async () => {
      try {
        const res = await fetch('/api/settings/roles')
        if (!res.ok) return
        const data = await res.json().catch(() => ({}))
        setRoles(Array.isArray(data?.roles) ? data.roles : [])
        setRolesLoaded(true)
      } catch {
        // ignore
      }
    })()
  }, [open, draft, rolesLoaded])

  const stepType = draft?.stepType || ''

  const systemRoleName = useMemo(() => {
    if (stepType !== 'SYSTEM_ROLE') return ''
    return String((draft?.configJson || {})?.systemRoleName || '')
  }, [draft, stepType])

  const userId = useMemo(() => {
    if (stepType !== 'USER') return ''
    return String((draft?.configJson || {})?.userId || '')
  }, [draft, stepType])

  const delegateMode = useMemo(() => {
    if (stepType !== 'DELEGATE_POOL') return 'pool'
    return String((draft?.configJson || {})?.mode || 'pool')
  }, [draft, stepType])

  const delegateAllowAny = useMemo(() => {
    if (stepType !== 'DELEGATE_POOL') return true
    return (draft?.configJson || {})?.allowAny !== false
  }, [draft, stepType])

  const delegateUserIds = useMemo(() => {
    if (stepType !== 'DELEGATE_POOL') return [] as string[]
    const ids = (draft?.configJson || {})?.userIds
    return Array.isArray(ids) ? ids.map(String) : []
  }, [draft, stepType])

  if (!open || !draft) return null

  const update = (patch: Partial<StepDraft>) => setDraft({ ...draft, ...patch })

  const save = () => {
    // normalize config
    const cfg = { ...(draft.configJson || {}) }
    if (draft.stepType === 'SYSTEM_ROLE') {
      cfg.systemRoleName = String(cfg.systemRoleName || '').trim()
    }
    if (draft.stepType === 'USER') {
      cfg.userId = String(cfg.userId || '').trim()
    }
    if (draft.stepType === 'DELEGATE_POOL') {
      cfg.mode = String(cfg.mode || 'pool')
      cfg.allowAny = cfg.allowAny !== false
      if (Array.isArray(cfg.userIds)) cfg.userIds = cfg.userIds.map(String).filter(Boolean)
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

              {draft.stepType === 'SYSTEM_ROLE' && (
                <>
                  <label style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>الدور</label>
                  <select
                    value={systemRoleName}
                    onChange={(e) => update({ configJson: { ...(draft.configJson || {}), systemRoleName: e.target.value } })}
                    style={{ padding: 12, borderRadius: 12, border: '1px solid #E5E7EB', background: 'white' }}
                  >
                    <option value="">اختر دور…</option>
                    {roles.filter((r: any) => r.isActive !== false).map((r: any) => (
                      <option key={r.id} value={r.name}>{r.nameAr || r.name}</option>
                    ))}
                  </select>
                  <div style={{ color: '#64748B', fontSize: 12 }}>
                    systemRoleName: <span style={{ fontFamily: 'monospace' }}>{systemRoleName || '—'}</span>
                  </div>
                </>
              )}

              {draft.stepType === 'USER' && (
                <>
                  <label style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>المستخدم</label>

                  <input
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    style={{ padding: 12, borderRadius: 12, border: '1px solid #E5E7EB' }}
                    placeholder="ابحث بالاسم أو اليوزر…"
                  />

                  <div style={{ maxHeight: 220, overflow: 'auto', border: '1px solid #E5E7EB', borderRadius: 12, background: 'white' }}>
                    {(users || [])
                      .filter((u: any) => {
                        const q = userQuery.trim().toLowerCase()
                        if (!q) return true
                        const hay = `${u.displayName || ''} ${u.username || ''} ${u.jobTitle || ''} ${u.department || ''}`.toLowerCase()
                        return hay.includes(q)
                      })
                      .slice(0, 30)
                      .map((u: any) => {
                        const selected = String(u.id) === userId
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => update({ configJson: { ...(draft.configJson || {}), userId: u.id } })}
                            style={{
                              width: '100%',
                              textAlign: 'start',
                              padding: '10px 12px',
                              border: 'none',
                              borderBottom: '1px solid #F1F5F9',
                              background: selected ? '#EEF2FF' : 'white',
                              cursor: 'pointer',
                            }}
                          >
                            <div style={{ fontWeight: 900, color: '#0F172A' }}>{u.displayName || u.username}</div>
                            <div style={{ fontSize: 12, color: '#64748B' }}>
                              @{u.username || '—'} {u.jobTitle ? `• ${u.jobTitle}` : ''} {u.department ? `• ${u.department}` : ''}
                            </div>
                          </button>
                        )
                      })}
                  </div>

                  <div style={{ color: '#64748B', fontSize: 12 }}>
                    userId المختار: <span style={{ fontFamily: 'monospace' }}>{userId || '—'}</span>
                  </div>
                </>
              )}

              {draft.stepType === 'DELEGATE_POOL' && (
                <>
                  <label style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>نمط التنفيذ</label>
                  <select
                    value={delegateMode}
                    onChange={(e) => update({ configJson: { ...(draft.configJson || {}), mode: e.target.value } })}
                    style={{ padding: 12, borderRadius: 12, border: '1px solid #E5E7EB', background: 'white' }}
                  >
                    <option value="single">مستخدم واحد</option>
                    <option value="pool">مجموعة (Pool)</option>
                    <option value="any">أي مستخدم</option>
                  </select>

                  <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 800 }}>
                    <input
                      type="checkbox"
                      checked={delegateAllowAny}
                      onChange={(e) => update({ configJson: { ...(draft.configJson || {}), allowAny: e.target.checked } })}
                    />
                    السماح لأي مستخدم بالتنفيذ (Fallback)
                  </label>

                  {(delegateMode === 'single' || delegateMode === 'pool') && (
                    <>
                      <label style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>مستخدمين التنفيذ (اختياري)</label>
                      <input
                        value={userQuery}
                        onChange={(e) => setUserQuery(e.target.value)}
                        style={{ padding: 12, borderRadius: 12, border: '1px solid #E5E7EB' }}
                        placeholder="ابحث بالاسم أو اليوزر…"
                      />

                      <div style={{ maxHeight: 220, overflow: 'auto', border: '1px solid #E5E7EB', borderRadius: 12, background: 'white' }}>
                        {(users || [])
                          .filter((u: any) => {
                            const q = userQuery.trim().toLowerCase()
                            if (!q) return true
                            const hay = `${u.displayName || ''} ${u.username || ''} ${u.jobTitle || ''} ${u.department || ''}`.toLowerCase()
                            return hay.includes(q)
                          })
                          .slice(0, 30)
                          .map((u: any) => {
                            const selected = delegateUserIds.includes(String(u.id))
                            return (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => {
                                  const id = String(u.id)
                                  const current = new Set(delegateUserIds)
                                  if (selected) current.delete(id)
                                  else {
                                    if (delegateMode === 'single') {
                                      current.clear()
                                      current.add(id)
                                    } else {
                                      current.add(id)
                                    }
                                  }
                                  update({ configJson: { ...(draft.configJson || {}), userIds: Array.from(current) } })
                                }}
                                style={{
                                  width: '100%',
                                  textAlign: 'start',
                                  padding: '10px 12px',
                                  border: 'none',
                                  borderBottom: '1px solid #F1F5F9',
                                  background: selected ? '#ECFDF5' : 'white',
                                  cursor: 'pointer',
                                }}
                              >
                                <div style={{ fontWeight: 900, color: '#0F172A' }}>{u.displayName || u.username}</div>
                                <div style={{ fontSize: 12, color: '#64748B' }}>
                                  @{u.username || '—'} {u.jobTitle ? `• ${u.jobTitle}` : ''} {u.department ? `• ${u.department}` : ''}
                                </div>
                              </button>
                            )
                          })}
                      </div>

                      <div style={{ display: 'grid', gap: 6 }}>
                        <div style={{ color: '#64748B', fontSize: 12, fontWeight: 900 }}>المختار</div>
                        {delegateUserIds.length === 0 ? (
                          <div style={{ color: '#94A3B8', fontSize: 12 }}>—</div>
                        ) : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {delegateUserIds
                              .map((id) => users.find((u: any) => String(u.id) === String(id)))
                              .filter(Boolean)
                              .map((u: any) => (
                                <span
                                  key={u.id}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '6px 10px',
                                    borderRadius: 999,
                                    border: '1px solid #E2E8F0',
                                    background: '#F8FAFC',
                                    fontWeight: 900,
                                    fontSize: 12,
                                    color: '#0F172A',
                                  }}
                                >
                                  {u.displayName || u.username}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = delegateUserIds.filter((x) => String(x) !== String(u.id))
                                      update({ configJson: { ...(draft.configJson || {}), userIds: next } })
                                    }}
                                    style={{
                                      border: 'none',
                                      background: 'transparent',
                                      cursor: 'pointer',
                                      color: '#64748B',
                                      fontWeight: 900,
                                    }}
                                    aria-label="remove"
                                    title="إزالة"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
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
