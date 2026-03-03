'use client'

import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const BOYS_TYPES = ['LEAVE', 'VISA_EXIT_REENTRY_SINGLE', 'VISA_EXIT_REENTRY_MULTI', 'RESIGNATION']

type UserOpt = { id: string; displayName: string; username: string }

type RuleRow = {
  requestType: string
  enabled: boolean
  useStageHead: boolean
  vpUserId: string | null
  hrManagerUserId: string | null
  allowDelegation: boolean
}

export default function HRRoutingRulesPage() {
  const [rules, setRules] = useState<RuleRow[]>([])
  const [users, setUsers] = useState<UserOpt[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const userOptions = useMemo(() => users, [users])

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [r1, r2] = await Promise.all([
        fetch('/api/settings/hr-routing-rules'),
        fetch('/api/admin/users')
      ])

      const d1 = await r1.json().catch(() => ({}))
      const d2 = await r2.json().catch(() => ({}))

      if (!r1.ok) throw new Error(d1.error || 'Failed')

      const fetched: RuleRow[] = d1.rules || []
      const normalized: RuleRow[] = BOYS_TYPES.map((t) => {
        const found = fetched.find((x) => x.requestType === t)
        return (
          found || {
            requestType: t,
            enabled: true,
            useStageHead: true,
            vpUserId: null,
            hrManagerUserId: null,
            allowDelegation: true,
          }
        )
      })

      setRules(normalized)
      setUsers((d2.users || d2.data || []).map((u: any) => ({ id: u.id, displayName: u.displayName, username: u.username })))
    } catch (e: any) {
      setError(e?.message || 'فشل التحميل')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/settings/hr-routing-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'فشل الحفظ')
      alert('✅ تم حفظ القواعد')
      await load()
    } catch (e: any) {
      setError(e?.message || 'فشل الحفظ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <PageHeader title="⚙️ قواعد توجيه طلبات HR (بنين)" breadcrumbs={['الرئيسية', 'الإعدادات', 'HR routing']} />

        <Card variant="default">
          <div style={{ padding: 16 }}>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>الفكرة</div>
            <div style={{ color: '#6B7280', lineHeight: 1.7 }}>
              يتم توجيه الأنواع المحددة عبر: مدير المرحلة (من الهيكل) → نائب الرئيس للشؤون التعليمية - بنين → مدير الموارد البشرية → تنفيذ الموارد البشرية (بالإحالة).
              <br />
              التنفيذ يكون فاضي افتراضياً، ومدير الموارد البشرية يختار شخص واحد أو Pool أو أي موظف.
            </div>
          </div>
        </Card>

        {error && (
          <div style={{ marginTop: 12, background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', padding: 12, borderRadius: 12 }}>
            {error}
          </div>
        )}

        <Card variant="default">
          <div style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ fontWeight: 900 }}>الأنواع (بنين)</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Button variant="outline" onClick={load} disabled={loading || saving}>
                  تحديث
                </Button>
                <Button variant="primary" onClick={save} disabled={loading || saving}>
                  {saving ? 'جاري الحفظ…' : 'حفظ'}
                </Button>
              </div>
            </div>

            {loading ? (
              <div style={{ marginTop: 12 }}>جاري التحميل…</div>
            ) : (
              <div style={{ marginTop: 12, display: 'grid', gap: 12 }}>
                {rules.map((r, idx) => (
                  <div key={idx} style={{ border: '1px solid #E5E7EB', borderRadius: 14, padding: 12, background: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                      <div style={{ fontWeight: 900 }}>{r.requestType}</div>
                      <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#374151' }}>
                        <input
                          type="checkbox"
                          checked={r.enabled}
                          onChange={(e) => setRules((prev) => prev.map((x) => (x.requestType === r.requestType ? { ...x, enabled: e.target.checked } : x)))}
                        />
                        مفعل
                      </label>
                    </div>

                    <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>VP (نائب الرئيس)</div>
                        <select
                          value={r.vpUserId || ''}
                          onChange={(e) => setRules((prev) => prev.map((x) => (x.requestType === r.requestType ? { ...x, vpUserId: e.target.value || null } : x)))}
                          style={{ width: '100%', padding: '10px 10px', borderRadius: 12, border: '1px solid #E5E7EB' }}
                        >
                          <option value="">— اختر —</option>
                          {userOptions.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.displayName} ({u.username})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>مدير الموارد البشرية</div>
                        <select
                          value={r.hrManagerUserId || ''}
                          onChange={(e) => setRules((prev) => prev.map((x) => (x.requestType === r.requestType ? { ...x, hrManagerUserId: e.target.value || null } : x)))}
                          style={{ width: '100%', padding: '10px 10px', borderRadius: 12, border: '1px solid #E5E7EB' }}
                        >
                          <option value="">— اختر —</option>
                          {userOptions.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.displayName} ({u.username})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ marginTop: 10, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                      <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#374151' }}>
                        <input
                          type="checkbox"
                          checked={r.useStageHead}
                          onChange={(e) => setRules((prev) => prev.map((x) => (x.requestType === r.requestType ? { ...x, useStageHead: e.target.checked } : x)))}
                        />
                        مدير المرحلة من الهيكل (STAGE→HEAD)
                      </label>

                      <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#374151' }}>
                        <input
                          type="checkbox"
                          checked={r.allowDelegation}
                          onChange={(e) => setRules((prev) => prev.map((x) => (x.requestType === r.requestType ? { ...x, allowDelegation: e.target.checked } : x)))}
                        />
                        السماح بالإحالة (تنفيذ HR)
                      </label>
                    </div>
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
