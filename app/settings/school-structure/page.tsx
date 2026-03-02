'use client'

import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Select, Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

type Branch = {
  id: string
  name: string
  _count: { employees: number }
  educationalRouting?: { vpEducationalUserId: string | null } | null
  stages: Stage[]
}

type Stage = {
  id: string
  name: string
  status: string
  managerId: string | null
  deputyId: string | null
  latitude: number | null
  longitude: number | null
  geofenceRadius: number
}

type Employee = {
  id: string
  fullNameAr: string
  employeeNumber: string
  branchId: string
  userId: string | null
}

type User = { id: string; username: string; displayName: string; role: string }

function BranchCard({
  branch,
  branchEmployees,
  users,
  onSaved,
}: {
  branch: Branch
  branchEmployees: Employee[]
  users: User[]
  onSaved: (updatedBranches: Branch[]) => void
}) {
  const [saving, setSaving] = useState(false)

  const userLabel = (u: User) => `${u.displayName} (@${u.username})`

  const [vp, setVp] = useState<string>(branch.educationalRouting?.vpEducationalUserId || '')

  const [localStages, setLocalStages] = useState(
    branch.stages.map((s) => ({
      id: s.id,
      managerId: s.managerId || '',
      deputyId: s.deputyId || '',
      useBranchLocation: true,
      latitude: s.latitude ?? '',
      longitude: s.longitude ?? '',
      geofenceRadius: s.geofenceRadius ?? 100,
    }))
  )

  const updateStage = (stageId: string, patch: any) => {
    setLocalStages((prev) => prev.map((x) => (x.id === stageId ? { ...x, ...patch } : x)))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/school-structure', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchId: branch.id, vpEducationalUserId: vp || null, stages: localStages }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed')

      const r2 = await fetch('/api/settings/school-structure')
      const d2 = await r2.json().catch(() => ({}))
      onSaved(d2.branches || [])

      alert('✅ تم الحفظ')
    } catch (e: any) {
      alert(e.message || 'فشل الحفظ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card key={branch.id} variant="default">
      <div style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>{branch.name}</div>
            <div style={{ color: '#6B7280', fontSize: 13 }}>👥 {branch._count.employees} موظف</div>
          </div>
          <div style={{ minWidth: 320 }}>
            <Select label="VP تعليمي (مدير الفرع)" value={vp} onChange={(e) => setVp(e.target.value)}>
              <option value="">— بدون —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {userLabel(u)}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>🎓 المراحل</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
            {branch.stages.map((s) => {
              const local = localStages.find((x) => x.id === s.id)!
              return (
                <div key={s.id} style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: 14, background: '#F9FAFB' }}>
                  <div style={{ fontWeight: 900, marginBottom: 8 }}>{s.name}</div>

                  <Select label="مدير المرحلة" value={local.managerId} onChange={(e) => updateStage(s.id, { managerId: e.target.value })}>
                    <option value="">— بدون —</option>
                    {branchEmployees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.fullNameAr} ({e.employeeNumber})
                      </option>
                    ))}
                  </Select>

                  <div style={{ marginTop: 10 }}>
                    <Select label="نائب مدير المرحلة" value={local.deputyId} onChange={(e) => updateStage(s.id, { deputyId: e.target.value })}>
                      <option value="">— بدون —</option>
                      {branchEmployees.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.fullNameAr} ({e.employeeNumber})
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: '#111827', fontWeight: 800 }}>
                      <input
                        type="checkbox"
                        checked={!!local.useBranchLocation}
                        onChange={(e) => updateStage(s.id, { useBranchLocation: e.target.checked })}
                      />
                      استخدام موقع الفرع
                    </label>

                    {!local.useBranchLocation && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, width: '100%' }}>
                        <Input label="Latitude" value={String(local.latitude ?? '')} onChange={(e) => updateStage(s.id, { latitude: e.target.value })} />
                        <Input label="Longitude" value={String(local.longitude ?? '')} onChange={(e) => updateStage(s.id, { longitude: e.target.value })} />
                        <Input label="Radius (m)" value={String(local.geofenceRadius ?? 100)} onChange={(e) => updateStage(s.id, { geofenceRadius: e.target.value })} />
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: 10, color: '#6B7280', fontSize: 12 }}>تحديد موقع المرحلة اختياري.</div>
                </div>
              )
            })}
          </div>

          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="primary" onClick={handleSave} loading={saving}>
              ✅ حفظ هيكل الفرع
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default function SchoolStructurePage() {
  const [loading, setLoading] = useState(true)
  const [branches, setBranches] = useState<Branch[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [q, setQ] = useState('')

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/settings/school-structure')
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || 'Failed to load')
        setBranches(data.branches || [])
        setEmployees(data.employees || [])
        setUsers(data.users || [])
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  const employeesByBranch = useMemo(() => {
    const map = new Map<string, Employee[]>()
    for (const e of employees) {
      const arr = map.get(e.branchId) || []
      arr.push(e)
      map.set(e.branchId, arr)
    }
    return map
  }, [employees])

  const filteredBranches = useMemo(() => {
    const s = q.trim()
    if (!s) return branches
    return branches.filter((b) => b.name.includes(s))
  }, [branches, q])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <PageHeader title="🏫 هيكل المدارس" breadcrumbs={['الرئيسية', 'الإعدادات', 'هيكل المدارس']} />
          <Card variant="default">
            <div style={{ padding: 24 }}>جاري التحميل…</div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <PageHeader
          title="🏫 هيكل المدارس"
          breadcrumbs={['الرئيسية', 'الإعدادات', 'هيكل المدارس']}
          actions={
            <div style={{ minWidth: 280 }}>
              <Input label="بحث بالفرع" value={q} onChange={(e) => setQ(e.target.value)} placeholder="اكتب اسم الفرع…" />
            </div>
          }
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filteredBranches.map((b) => (
            <BranchCard
              key={b.id}
              branch={b}
              branchEmployees={employeesByBranch.get(b.id) || []}
              users={users}
              onSaved={(updated) => setBranches(updated)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
