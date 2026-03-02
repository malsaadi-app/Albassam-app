'use client'

import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Select, Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

type Branch = { id: string; name: string; type: string; status: string }

type OrgUnitRow = {
  id: string
  parentId: string | null
  name: string
  type: string
}

type Assignment = {
  id: string
  orgUnitId: string
  employeeId: string
  assignmentType: string
  role: string
  active: boolean
}

type Employee = { id: string; fullNameAr: string; employeeNumber: string }

function buildTree(units: OrgUnitRow[]) {
  const byId = new Map(units.map((u) => [u.id, { ...u, children: [] as any[] }]))
  const roots: any[] = []
  for (const u of byId.values()) {
    if (u.parentId && byId.has(u.parentId)) byId.get(u.parentId)!.children.push(u)
    else roots.push(u)
  }
  const sortRec = (node: any) => {
    node.children.sort((a: any, b: any) => a.name.localeCompare(b.name, 'ar'))
    node.children.forEach(sortRec)
  }
  roots.forEach(sortRec)
  roots.sort((a, b) => a.name.localeCompare(b.name, 'ar'))
  return roots
}

export default function OrgStructurePage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [branchId, setBranchId] = useState('')
  const [units, setUnits] = useState<OrgUnitRow[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const [selectedUnitId, setSelectedUnitId] = useState<string>('')
  const [supervisorId, setSupervisorId] = useState<string>('')
  const [supervisorSearch, setSupervisorSearch] = useState<string>('')
  const [members, setMembers] = useState<string>('') // comma separated employeeNumbers

  // org unit management (rename/merge)
  const [unitName, setUnitName] = useState<string>('')
  const [mergeTargetUnitId, setMergeTargetUnitId] = useState<string>('')

  // member move UI
  const [moveTargetByEmployeeId, setMoveTargetByEmployeeId] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch('/api/branches')
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d) ? d : d.branches || d.data || []
        setBranches((list || []).filter((b: any) => b.status === 'ACTIVE'))
      })
      .catch(() => setBranches([]))
  }, [])

  const tree = useMemo(() => buildTree(units), [units])

  const selectedUnit = useMemo(() => units.find((u) => u.id === selectedUnitId) || null, [units, selectedUnitId])

  const assByUnit = useMemo(() => {
    const map = new Map<string, Assignment[]>()
    for (const a of assignments) {
      const arr = map.get(a.orgUnitId) || []
      arr.push(a)
      map.set(a.orgUnitId, arr)
    }
    return map
  }, [assignments])

  const employeesByNumber = useMemo(() => {
    const map = new Map<string, Employee>()
    for (const e of employees) map.set(e.employeeNumber, e)
    return map
  }, [employees])

  const filteredEmployeesForSupervisor = useMemo(() => {
    const q = supervisorSearch.trim().toLowerCase()
    if (!q) return employees
    return employees.filter((e) => {
      const name = (e.fullNameAr || '').toLowerCase()
      const num = (e.employeeNumber || '').toLowerCase()
      return name.includes(q) || num.includes(q)
    })
  }, [employees, supervisorSearch])

  const selectedAssignments = useMemo(() => {
    if (!selectedUnitId) return [] as Assignment[]
    return assByUnit.get(selectedUnitId) || []
  }, [assByUnit, selectedUnitId])

  const selectedSupervisor = useMemo(() => {
    if (!selectedUnitId) return null
    const sup = selectedAssignments.find((a) => a.assignmentType === 'FUNCTIONAL' && a.role === 'SUPERVISOR' && a.active)
    if (!sup) return null
    return employees.find((e) => e.id === sup.employeeId) || null
  }, [employees, selectedAssignments, selectedUnitId])

  const selectedMembers = useMemo(() => {
    if (!selectedUnitId) return [] as Employee[]
    const mem = selectedAssignments.filter((a) => a.assignmentType === 'FUNCTIONAL' && a.role === 'MEMBER' && a.active)
    const ids = new Set(mem.map((m) => m.employeeId))
    return employees.filter((e) => ids.has(e.id))
  }, [employees, selectedAssignments, selectedUnitId])

  const load = async (bId: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/settings/org-structure?branchId=${bId}`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to load')
      setUnits(data.units || [])
      setAssignments(data.assignments || [])
      setEmployees(data.employees || [])
      setSelectedUnitId('')
    } catch (e: any) {
      setUnits([])
      setAssignments([])
      setEmployees([])
      setSelectedUnitId('')
      setError(e?.message || 'فشل تحميل الهيكل')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (branchId) load(branchId)
  }, [branchId])

  const openUnit = (id: string) => {
    setSelectedUnitId(id)
    setSupervisorSearch('')
    setMergeTargetUnitId('')

    const unit = units.find((u) => u.id === id)
    setUnitName(unit?.name || '')

    const arr = assByUnit.get(id) || []
    const sup = arr.find((a) => a.assignmentType === 'FUNCTIONAL' && a.role === 'SUPERVISOR' && a.active)
    setSupervisorId(sup?.employeeId || '')

    const mem = arr.filter((a) => a.assignmentType === 'FUNCTIONAL' && a.role === 'MEMBER' && a.active)
    const memNumbers = mem
      .map((m) => employees.find((e) => e.id === m.employeeId)?.employeeNumber)
      .filter(Boolean)
      .join(',')
    setMembers(memNumbers)
  }

  const saveAssignments = async () => {
    if (!selectedUnitId) return

    const memberIds: string[] = []
    for (const token of members.split(',').map((x) => x.trim()).filter(Boolean)) {
      const emp = employeesByNumber.get(token)
      if (emp) memberIds.push(emp.id)
    }

    const res = await fetch('/api/settings/org-structure/assignments', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgUnitId: selectedUnitId, supervisorEmployeeId: supervisorId || null, memberEmployeeIds: memberIds }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      alert(data.error || 'فشل الحفظ')
      return
    }

    alert('✅ تم حفظ المشرف/الأعضاء')
    if (branchId) load(branchId)
  }

  const saveUnitName = async () => {
    if (!selectedUnitId) return
    const name = unitName.trim()
    if (!name) {
      alert('اكتب اسم القسم')
      return
    }

    const res = await fetch(`/api/settings/org-structure/${selectedUnitId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      alert(data.error || 'فشل تعديل الاسم')
      return
    }

    alert('✅ تم تعديل اسم القسم')
    if (branchId) load(branchId)
  }

  const mergeUnitInto = async () => {
    if (!selectedUnitId) return
    if (!mergeTargetUnitId) {
      alert('اختر القسم الهدف للدمج')
      return
    }

    const ok = confirm('تأكيد: سيتم نقل التعيينات والوحدات الفرعية ثم تعطيل القسم المدموج. هل أنت متأكد؟')
    if (!ok) return

    const res = await fetch('/api/settings/org-structure/merge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromOrgUnitId: selectedUnitId, toOrgUnitId: mergeTargetUnitId }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      alert(data.error || 'فشل الدمج')
      return
    }

    alert('✅ تم دمج القسم')
    if (branchId) load(branchId)
  }

  const runAutoAssignTeachers = async () => {
    if (!branchId) return
    const ok = confirm('سيتم ربط المعلمين تلقائياً بالأقسام (أعضاء فقط) حسب بيانات الموظف. تبي نكمل؟')
    if (!ok) return

    const res = await fetch('/api/settings/org-structure/auto-assign-teachers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ branchId }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      alert(data.error || 'فشل الربط التلقائي')
      return
    }

    alert(`✅ تم الربط التلقائي. تمت إضافة: ${data.toAssignCount} — يحتاج مراجعة: ${data.needsReviewCount}`)
    if (branchId) load(branchId)
  }

  const moveMember = async (employeeId: string, toOrgUnitId: string) => {
    if (!selectedUnitId) return
    if (!toOrgUnitId) {
      alert('اختر القسم الهدف')
      return
    }

    const res = await fetch('/api/settings/org-structure/move-member', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId, fromOrgUnitId: selectedUnitId, toOrgUnitId }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      alert(data.error || 'فشل نقل الموظف')
      return
    }

    setMoveTargetByEmployeeId((prev) => ({ ...prev, [employeeId]: '' }))
    if (branchId) load(branchId)
  }

  const renderNode = (n: any, depth = 0) => {
    return (
      <div key={n.id} style={{ marginRight: depth * 12, borderRight: depth ? '2px solid #E5E7EB' : 'none', paddingRight: depth ? 10 : 0 }}>
        <button
          onClick={() => openUnit(n.id)}
          style={{
            width: '100%',
            textAlign: 'right',
            padding: '10px 12px',
            borderRadius: 10,
            border: selectedUnitId === n.id ? '2px solid #111827' : '1px solid #E5E7EB',
            background: 'white',
            cursor: 'pointer',
            marginBottom: 8,
            fontWeight: 800,
          }}
        >
          {n.name} <span style={{ color: '#6B7280', fontWeight: 700, fontSize: 12 }}>({n.type})</span>
        </button>
        {n.children?.map((c: any) => renderNode(c, depth + 1))}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <PageHeader title="🏗️ الهيكل التنظيمي" breadcrumbs={['الرئيسية', 'الإعدادات', 'الهيكل التنظيمي']} />

        <Card variant="default">
          <div style={{ padding: 16 }}>
            <Select label="اختر الفرع" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              <option value="">— اختر —</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </div>
        </Card>

        {branchId && (
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
            <Card variant="default">
              <div style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                  <div style={{ fontWeight: 900 }}>🌳 الشجرة</div>
                  <Button variant="secondary" onClick={runAutoAssignTeachers}>
                    ربط المعلمين تلقائياً
                  </Button>
                </div>

                {error && (
                  <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', padding: '10px 12px', borderRadius: 10, marginBottom: 10 }}>
                    {error}
                  </div>
                )}

                {loading ? (
                  <div>جاري التحميل…</div>
                ) : tree.length === 0 ? (
                  <div style={{ color: '#6B7280' }}>ما فيه وحدات لهذا الفرع حالياً.</div>
                ) : (
                  tree.map((n) => renderNode(n))
                )}

                {!loading && !error && (
                  <div style={{ marginTop: 10, color: '#6B7280', fontSize: 12 }}>
                    وحدات: {units.length} — تعيينات: {assignments.length} — موظفين الفرع: {employees.length}
                  </div>
                )}
              </div>
            </Card>

            <Card variant="default">
              <div style={{ padding: 16 }}>
                <div style={{ fontWeight: 900, marginBottom: 10 }}>👤 تعيينات (مشرف/معلمين)</div>

                {!selectedUnit ? (
                  <div style={{ color: '#6B7280' }}>اختر وحدة من الشجرة يسار.</div>
                ) : (
                  <>
                    <div style={{ fontWeight: 900, marginBottom: 8 }}>{selectedUnit.name}</div>

                    <div style={{ marginTop: 8, marginBottom: 12, background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 12, padding: 12 }}>
                      <div style={{ fontWeight: 900, marginBottom: 10 }}>✏️ إدارة القسم</div>

                      <Input label="اسم القسم" value={unitName} onChange={(e) => setUnitName(e.target.value)} placeholder="مثال: قسم الرياضيات" />
                      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button variant="secondary" onClick={saveUnitName}>
                          حفظ الاسم
                        </Button>
                      </div>

                      <div style={{ height: 10 }} />

                      <Select label="دمج هذا القسم داخل" value={mergeTargetUnitId} onChange={(e) => setMergeTargetUnitId(e.target.value)}>
                        <option value="">— اختر القسم الهدف —</option>
                        {units
                          .filter((u) => u.id !== selectedUnitId)
                          .map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name}
                            </option>
                          ))}
                      </Select>
                      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button variant="danger" onClick={mergeUnitInto}>
                          دمج
                        </Button>
                      </div>
                    </div>

                    <div style={{ marginBottom: 12, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: 12 }}>
                      <div style={{ fontWeight: 900, marginBottom: 10 }}>👀 الموظفين تحت القسم</div>
                      <div style={{ color: '#6B7280', fontSize: 12, marginBottom: 8 }}>
                        المشرف: {selectedSupervisor ? `${selectedSupervisor.fullNameAr} (${selectedSupervisor.employeeNumber})` : '—'}
                        {' — '}الأعضاء: {selectedMembers.length}
                      </div>
                      {selectedMembers.length === 0 ? (
                        <div style={{ color: '#6B7280' }}>ما فيه أعضاء مرتبطين مباشرة بهذا القسم.</div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6, maxHeight: 260, overflow: 'auto' }}>
                          {selectedMembers.map((m) => (
                            <div
                              key={m.id}
                              style={{
                                padding: '10px 10px',
                                background: 'white',
                                border: '1px solid #E5E7EB',
                                borderRadius: 10,
                                display: 'grid',
                                gridTemplateColumns: '1fr',
                                gap: 8,
                              }}
                            >
                              <div>
                                {m.fullNameAr} <span style={{ color: '#6B7280' }}>({m.employeeNumber})</span>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center' }}>
                                <select
                                  value={moveTargetByEmployeeId[m.id] || ''}
                                  onChange={(e) => setMoveTargetByEmployeeId((prev) => ({ ...prev, [m.id]: e.target.value }))}
                                  style={{
                                    width: '100%',
                                    padding: '10px 10px',
                                    borderRadius: 10,
                                    border: '1px solid #E5E7EB',
                                    background: 'white',
                                  }}
                                >
                                  <option value="">— نقل إلى… —</option>
                                  {units
                                    .filter((u) => u.id !== selectedUnitId)
                                    .map((u) => (
                                      <option key={u.id} value={u.id}>
                                        {u.name}
                                      </option>
                                    ))}
                                </select>

                                <Button variant="secondary" onClick={() => moveMember(m.id, moveTargetByEmployeeId[m.id] || '')}>
                                  نقل
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Input
                      label="بحث عن المشرف (اسم أو رقم موظف)"
                      value={supervisorSearch}
                      onChange={(e) => setSupervisorSearch(e.target.value)}
                      placeholder="اكتب للاسراع…"
                    />

                    <Select label="مشرف القسم" value={supervisorId} onChange={(e) => setSupervisorId(e.target.value)}>
                      <option value="">— بدون —</option>
                      {filteredEmployeesForSupervisor.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.fullNameAr} ({e.employeeNumber})
                        </option>
                      ))}
                    </Select>

                    <div style={{ marginTop: 12 }}>
                      <Input
                        label="أعضاء/معلمين (أرقام موظفين مفصولة بفواصل)"
                        value={members}
                        onChange={(e) => setMembers(e.target.value)}
                        placeholder="مثال: 1001,1002,1003"
                      />
                      <div style={{ color: '#6B7280', fontSize: 12, marginTop: 6 }}>
                        تلميح: اكتب أرقام الموظفين (employeeNumber) عشان الإدخال يكون سريع.
                      </div>
                    </div>

                    <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button variant="primary" onClick={saveAssignments}>
                        ✅ حفظ
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
