'use client'

import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Select, Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import ReactSelect from 'react-select'

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
  coverageScope?: 'BRANCH' | 'MULTI_BRANCH' | 'ALL'
  coverageBranchIds?: string | null
  active: boolean
}

type Employee = { id: string; fullNameAr: string; employeeNumber: string; department?: string; position?: string; specialization?: string }

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

function getDescendantUnitIds(units: OrgUnitRow[], rootId: string) {
  const childrenByParent = new Map<string, string[]>()
  for (const u of units) {
    if (!u.parentId) continue
    const arr = childrenByParent.get(u.parentId) || []
    arr.push(u.id)
    childrenByParent.set(u.parentId, arr)
  }

  const out = new Set<string>()
  const stack = [rootId]
  while (stack.length) {
    const cur = stack.pop()!
    if (out.has(cur)) continue
    out.add(cur)
    const kids = childrenByParent.get(cur) || []
    for (const k of kids) stack.push(k)
  }
  return Array.from(out)
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

  // head (manager)
  const [headId, setHeadId] = useState<string>('')
  const [headSearch, setHeadSearch] = useState<string>('')

  // coverage
  const [supervisorCoverageScope, setSupervisorCoverageScope] = useState<'BRANCH' | 'MULTI_BRANCH' | 'ALL'>('BRANCH')
  const [supervisorCoverageBranchIds, setSupervisorCoverageBranchIds] = useState<string[]>([])
  const [headCoverageScope, setHeadCoverageScope] = useState<'BRANCH' | 'MULTI_BRANCH' | 'ALL'>('BRANCH')
  const [headCoverageBranchIds, setHeadCoverageBranchIds] = useState<string[]>([])

  // members (multi-select)
  const [memberFilter, setMemberFilter] = useState<'TEACHERS' | 'STAFF' | 'ALL'>('TEACHERS')
  const [memberEmployeeIds, setMemberEmployeeIds] = useState<string[]>([])

  // org unit management (rename/merge)
  const [unitName, setUnitName] = useState<string>('')
  const [mergeTargetUnitId, setMergeTargetUnitId] = useState<string>('')

  // member move UI
  const [moveTargetByEmployeeId, setMoveTargetByEmployeeId] = useState<Record<string, string>>({})

  // display options
  const [includeChildrenMembers, setIncludeChildrenMembers] = useState<boolean>(false)
  const [showUnassignedOnly, setShowUnassignedOnly] = useState<boolean>(false)
  const [unassignedEmployees, setUnassignedEmployees] = useState<Employee[]>([])
  const [memberSearch, setMemberSearch] = useState<string>('')

  // bulk selection
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Record<string, boolean>>({})
  const [bulkTargetUnitId, setBulkTargetUnitId] = useState<string>('')

  // modals
  const [showUnassignedModal, setShowUnassignedModal] = useState<boolean>(false)
  const [unassignedSelectedIds, setUnassignedSelectedIds] = useState<Record<string, boolean>>({})
  const [unassignedSearch, setUnassignedSearch] = useState<string>('')
  const [unassignedTargetUnitId, setUnassignedTargetUnitId] = useState<string>('')

  const [showCreateUnitModal, setShowCreateUnitModal] = useState<boolean>(false)
  const [newUnitName, setNewUnitName] = useState<string>('')
  const [newUnitType, setNewUnitType] = useState<string>('SUB_DEPARTMENT')
  const [newUnitParentId, setNewUnitParentId] = useState<string>('')
  const [newUnitHeadId, setNewUnitHeadId] = useState<string>('')
  const [newUnitHeadSearch, setNewUnitHeadSearch] = useState<string>('')

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

  const isTeacherEmployee = (e: Employee) => {
    const pos = (e as any).position || ''
    const spec = (e as any).specialization || ''
    return String(pos).includes('معلم') || String(spec).trim().length > 0
  }

  const filteredEmployeesForMembers = useMemo(() => {
    if (memberFilter === 'ALL') return employees
    if (memberFilter === 'TEACHERS') return employees.filter(isTeacherEmployee)
    return employees.filter((e) => !isTeacherEmployee(e))
  }, [employees, memberFilter])

  const filteredEmployeesForSupervisor = useMemo(() => {
    const q = supervisorSearch.trim().toLowerCase()
    if (!q) return employees
    return employees.filter((e) => {
      const name = (e.fullNameAr || '').toLowerCase()
      const num = (e.employeeNumber || '').toLowerCase()
      return name.includes(q) || num.includes(q)
    })
  }, [employees, supervisorSearch])

  const filteredEmployeesForHeadRole = useMemo(() => {
    const q = headSearch.trim().toLowerCase()
    if (!q) return employees
    return employees.filter((e) => {
      const name = (e.fullNameAr || '').toLowerCase()
      const num = (e.employeeNumber || '').toLowerCase()
      return name.includes(q) || num.includes(q)
    })
  }, [employees, headSearch])

  const selectedAssignments = useMemo(() => {
    if (!selectedUnitId) return [] as Assignment[]
    return assByUnit.get(selectedUnitId) || []
  }, [assByUnit, selectedUnitId])

  const selectedSupervisorAssignment = useMemo(() => {
    if (!selectedUnitId) return null
    return selectedAssignments.find((a) => a.assignmentType === 'FUNCTIONAL' && a.role === 'SUPERVISOR' && a.active) || null
  }, [selectedAssignments, selectedUnitId])

  const selectedSupervisor = useMemo(() => {
    const sup = selectedSupervisorAssignment
    if (!sup) return null
    return employees.find((e) => e.id === sup.employeeId) || null
  }, [employees, selectedSupervisorAssignment])

  const selectedHeadAssignment = useMemo(() => {
    if (!selectedUnitId) return null
    return selectedAssignments.find((a) => a.assignmentType === 'FUNCTIONAL' && a.role === 'HEAD' && a.active) || null
  }, [selectedAssignments, selectedUnitId])

  const selectedHead = useMemo(() => {
    const h = selectedHeadAssignment
    if (!h) return null
    return employees.find((e) => e.id === h.employeeId) || null
  }, [employees, selectedHeadAssignment])

  const selectedMembers = useMemo(() => {
    if (!selectedUnitId) return [] as Employee[]
    const mem = selectedAssignments.filter((a) => a.assignmentType === 'FUNCTIONAL' && a.role === 'MEMBER' && a.active)
    const ids = new Set(mem.map((m) => m.employeeId))
    return employees.filter((e) => ids.has(e.id))
  }, [employees, selectedAssignments, selectedUnitId])

  const displayedMembers = useMemo(() => {
    if (!selectedUnitId) return [] as Array<{ employee: Employee; orgUnitId: string; orgUnitName: string }>

    // Show "unassigned" list to allow bulk assigning employees to the selected org unit
    if (showUnassignedOnly) {
      const q = memberSearch.trim().toLowerCase()
      const list = !q
        ? unassignedEmployees
        : unassignedEmployees.filter((e) => {
            const name = (e.fullNameAr || '').toLowerCase()
            const num = (e.employeeNumber || '').toLowerCase()
            return name.includes(q) || num.includes(q)
          })

      return list.map((employee) => ({ employee, orgUnitId: '', orgUnitName: '' }))
    }

    const unitNameById = new Map(units.map((u) => [u.id, u.name]))

    const unitIds = includeChildrenMembers ? getDescendantUnitIds(units, selectedUnitId) : [selectedUnitId]
    const unitIdSet = new Set(unitIds)

    const memAssignments = assignments.filter(
      (a) => a.active && a.assignmentType === 'FUNCTIONAL' && a.role === 'MEMBER' && unitIdSet.has(a.orgUnitId)
    )

    const seen = new Set<string>()
    const out: Array<{ employee: Employee; orgUnitId: string; orgUnitName: string }> = []

    for (const a of memAssignments) {
      const emp = employees.find((e) => e.id === a.employeeId)
      if (!emp) continue
      const key = `${emp.id}:${a.orgUnitId}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push({ employee: emp, orgUnitId: a.orgUnitId, orgUnitName: unitNameById.get(a.orgUnitId) || '' })
    }

    const q = memberSearch.trim().toLowerCase()
    const filtered = !q
      ? out
      : out.filter(({ employee }) => {
          const name = (employee.fullNameAr || '').toLowerCase()
          const num = (employee.employeeNumber || '').toLowerCase()
          return name.includes(q) || num.includes(q)
        })

    filtered.sort((a, b) => a.employee.fullNameAr.localeCompare(b.employee.fullNameAr, 'ar'))
    return filtered
  }, [assignments, employees, includeChildrenMembers, memberSearch, selectedUnitId, showUnassignedOnly, unassignedEmployees, units])

  const selectedDisplayedEmployeeIds = useMemo(() => {
    return Object.keys(selectedEmployeeIds).filter((id) => selectedEmployeeIds[id])
  }, [selectedEmployeeIds])

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

      // load unassigned employees (for bulk assignment workflow)
      const res2 = await fetch(`/api/settings/org-structure/unassigned?branchId=${bId}`)
      const d2 = await res2.json().catch(() => ({}))
      setUnassignedEmployees(res2.ok ? d2.employees || [] : [])

      setSelectedUnitId('')
    } catch (e: any) {
      setUnits([])
      setAssignments([])
      setEmployees([])
      setUnassignedEmployees([])
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
    setHeadSearch('')
    setMergeTargetUnitId('')
    setIncludeChildrenMembers(false)
    setShowUnassignedOnly(false)
    setMemberSearch('')
    setSelectedEmployeeIds({})
    setBulkTargetUnitId('')

    const unit = units.find((u) => u.id === id)
    setUnitName(unit?.name || '')

    const arr = assByUnit.get(id) || []

    const head = arr.find((a) => a.assignmentType === 'FUNCTIONAL' && a.role === 'HEAD' && a.active)
    setHeadId(head?.employeeId || '')
    setHeadCoverageScope((head?.coverageScope as any) || 'BRANCH')
    setHeadCoverageBranchIds(head?.coverageBranchIds ? JSON.parse(head.coverageBranchIds) : [])

    const sup = arr.find((a) => a.assignmentType === 'FUNCTIONAL' && a.role === 'SUPERVISOR' && a.active)
    setSupervisorId(sup?.employeeId || '')
    setSupervisorCoverageScope((sup?.coverageScope as any) || 'BRANCH')
    setSupervisorCoverageBranchIds(sup?.coverageBranchIds ? JSON.parse(sup.coverageBranchIds) : [])

    const mem = arr.filter((a) => a.assignmentType === 'FUNCTIONAL' && a.role === 'MEMBER' && a.active)
    setMemberEmployeeIds(mem.map((m) => m.employeeId))
  }

  const saveAssignments = async () => {
    if (!selectedUnitId) return

    const res = await fetch('/api/settings/org-structure/assignments', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orgUnitId: selectedUnitId,
        headEmployeeId: headId || null,
        headCoverageScope,
        headCoverageBranchIds,
        supervisorEmployeeId: supervisorId || null,
        supervisorCoverageScope,
        supervisorCoverageBranchIds,
        memberEmployeeIds: memberEmployeeIds,
      }),
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

  const ensureStages = async () => {
    if (!branchId) return
    const res = await fetch('/api/settings/org-structure/ensure-stages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ branchId }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      alert(data.error || 'فشل إنشاء المراحل')
      return
    }

    // Also cleanup unwanted stage units (boys branch)
    await fetch('/api/settings/org-structure/cleanup-stages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ branchId }),
    }).catch(() => {})

    alert(`✅ تم. تمت إضافة مراحل: ${data.createdCount || 0}`)
    load(branchId)
  }

  const cleanupStages = async () => {
    if (!branchId) return
    const res = await fetch('/api/settings/org-structure/cleanup-stages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ branchId }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      alert(data.error || 'فشل تنظيف المراحل')
      return
    }
    alert(`✅ تم تنظيف المراحل. تم تعطيل: ${data.deactivatedCount || 0} — تفعيل: ${data.activatedCount || 0}`)
    load(branchId)
  }

  const syncStageMembers = async () => {
    if (!selectedUnitId) return
    const ok = confirm('سيتم مزامنة أعضاء المرحلة من بيانات الموظف الحالية (stage) وربطهم إداريًا بالمرحلة. تبي نكمل؟')
    if (!ok) return

    const res = await fetch('/api/settings/org-structure/sync-stage-members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stageOrgUnitId: selectedUnitId }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      alert(data.error || 'فشل مزامنة أعضاء المرحلة')
      return
    }

    alert(`✅ تمت مزامنة أعضاء المرحلة: ${data.syncedCount || 0}`)
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

  const createUnit = async () => {
    if (!branchId) return
    const name = newUnitName.trim()
    if (!name) {
      alert('اكتب اسم القسم')
      return
    }

    const res = await fetch('/api/settings/org-structure/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        branchId,
        parentId: newUnitParentId || null,
        name,
        type: newUnitType,
        headEmployeeId: newUnitHeadId || null,
      }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      alert(data.error || 'فشل إضافة القسم')
      return
    }

    alert('✅ تم إضافة القسم')
    setShowCreateUnitModal(false)
    setNewUnitName('')
    setNewUnitParentId('')
    setNewUnitHeadId('')
    setNewUnitHeadSearch('')
    if (branchId) load(branchId)
  }

  const addUnassignedSelectedToUnit = async () => {
    if (!unassignedTargetUnitId) {
      alert('اختر القسم الهدف')
      return
    }

    const ids = Object.keys(unassignedSelectedIds).filter((id) => unassignedSelectedIds[id])
    if (ids.length === 0) {
      alert('اختر موظفين أولاً')
      return
    }

    const res = await fetch('/api/settings/org-structure/bulk-add-members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeIds: ids, toOrgUnitId: unassignedTargetUnitId }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      alert(data.error || 'فشل الربط الجماعي')
      return
    }

    alert(`✅ تم ربط ${data.addedCount || 0} موظف`) 
    setUnassignedSelectedIds({})
    setUnassignedTargetUnitId('')
    setUnassignedSearch('')
    setShowUnassignedModal(false)
    if (branchId) load(branchId)
  }

  const moveMember = async (employeeId: string, fromOrgUnitId: string, toOrgUnitId: string) => {
    if (!fromOrgUnitId) return
    if (!toOrgUnitId) {
      alert('اختر القسم الهدف')
      return
    }

    const res = await fetch('/api/settings/org-structure/move-member', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId, fromOrgUnitId, toOrgUnitId }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      alert(data.error || 'فشل نقل الموظف')
      return
    }

    setMoveTargetByEmployeeId((prev) => ({ ...prev, [employeeId]: '' }))
    if (branchId) load(branchId)
  }

  const bulkMoveSelected = async () => {
    if (!branchId) return
    const ids = selectedDisplayedEmployeeIds
    if (ids.length === 0) {
      alert('اختر موظفين أولاً')
      return
    }
    if (!bulkTargetUnitId) {
      alert('اختر القسم الهدف')
      return
    }

    const ok = confirm(`تأكيد نقل ${ids.length} موظف إلى القسم المختار؟`)
    if (!ok) return

    const res = await fetch('/api/settings/org-structure/bulk-move-members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ branchId, employeeIds: ids, toOrgUnitId: bulkTargetUnitId }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      alert(data.error || 'فشل النقل الجماعي')
      return
    }

    alert(`✅ تم نقل ${data.movedCount || 0} موظف`)
    setSelectedEmployeeIds({})
    setBulkTargetUnitId('')
    if (branchId) load(branchId)
  }

  const bulkAddSelected = async () => {
    if (!branchId) return
    const ids = selectedDisplayedEmployeeIds
    if (ids.length === 0) {
      alert('اختر موظفين أولاً')
      return
    }
    if (!bulkTargetUnitId) {
      alert('اختر القسم الهدف')
      return
    }

    const ok = confirm(`تأكيد إضافة ${ids.length} موظف إلى القسم المختار؟`)
    if (!ok) return

    const res = await fetch('/api/settings/org-structure/bulk-add-members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeIds: ids, toOrgUnitId: bulkTargetUnitId }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      alert(data.error || 'فشل الإضافة الجماعية')
      return
    }

    alert(`✅ تم إضافة ${data.addedCount || 0} موظف`)
    setSelectedEmployeeIds({})
    setBulkTargetUnitId('')
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

  const filteredEmployeesForHead = useMemo(() => {
    const q = newUnitHeadSearch.trim().toLowerCase()
    if (!q) return employees
    return employees.filter((e) => {
      const name = (e.fullNameAr || '').toLowerCase()
      const num = (e.employeeNumber || '').toLowerCase()
      return name.includes(q) || num.includes(q)
    })
  }, [employees, newUnitHeadSearch])

  const filteredUnassigned = useMemo(() => {
    const q = unassignedSearch.trim().toLowerCase()
    if (!q) return unassignedEmployees
    return unassignedEmployees.filter((e) => {
      const name = (e.fullNameAr || '').toLowerCase()
      const num = (e.employeeNumber || '').toLowerCase()
      const dept = ((e as any).department || '').toLowerCase()
      const pos = ((e as any).position || '').toLowerCase()
      return name.includes(q) || num.includes(q) || dept.includes(q) || pos.includes(q)
    })
  }, [unassignedEmployees, unassignedSearch])

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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
                  <div style={{ fontWeight: 900 }}>🌳 الشجرة</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Button variant="secondary" onClick={ensureStages}>
                      🎓 إضافة المراحل
                    </Button>
                    <Button variant="secondary" onClick={cleanupStages}>
                      🧹 تنظيف المراحل
                    </Button>
                    <Button variant="secondary" onClick={() => {
                      setShowCreateUnitModal(true)
                      setNewUnitParentId('')
                      setNewUnitType('SUB_DEPARTMENT')
                    }}>
                      ➕ إضافة قسم
                    </Button>
                    <Button variant="secondary" onClick={() => {
                      setShowUnassignedModal(true)
                      setUnassignedSelectedIds({})
                      setUnassignedTargetUnitId('')
                      setUnassignedSearch('')
                    }}>
                      👥 غير مربوطين
                    </Button>
                    <Button variant="secondary" onClick={runAutoAssignTeachers}>
                      ربط المعلمين تلقائياً
                    </Button>
                  </div>
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                      <div style={{ fontWeight: 900 }}>{selectedUnit.name}</div>
                      {selectedUnit.type === 'STAGE' && (
                        <div style={{ position: 'relative', zIndex: 5, pointerEvents: 'auto' }}>
                          <Button variant="secondary" onClick={syncStageMembers}>
                            🔄 مزامنة أعضاء المرحلة
                          </Button>
                        </div>
                      )}
                    </div>

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
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                        <div style={{ fontWeight: 900 }}>👀 الموظفين تحت القسم</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#374151' }}>
                            <input
                              type="checkbox"
                              checked={includeChildrenMembers}
                              disabled={showUnassignedOnly}
                              onChange={(e) => setIncludeChildrenMembers(e.target.checked)}
                            />
                            عرض الأقسام الفرعية
                          </label>

                          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#374151' }}>
                            <input
                              type="checkbox"
                              checked={showUnassignedOnly}
                              onChange={(e) => {
                                const v = e.target.checked
                                setShowUnassignedOnly(v)
                                if (v) setIncludeChildrenMembers(false)
                                setSelectedEmployeeIds({})
                              }}
                            />
                            غير مربوطين (بدون قسم)
                          </label>
                        </div>
                      </div>

                      <div style={{ color: '#6B7280', fontSize: 12, marginBottom: 8 }}>
                        المدير: {selectedHead ? `${selectedHead.fullNameAr} (${selectedHead.employeeNumber})` : '—'}
                        {' — '}المشرف: {selectedSupervisor ? `${selectedSupervisor.fullNameAr} (${selectedSupervisor.employeeNumber})` : '—'}
                        {' — '}
                        {showUnassignedOnly ? `غير مربوطين: ${displayedMembers.length}` : `الأعضاء: ${displayedMembers.length}`}
                      </div>

                      <Input label="بحث داخل الموظفين" value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} placeholder="اسم أو رقم موظف…" />

                      <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr', gap: 8, background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: 10 }}>
                        <div style={{ fontWeight: 900, fontSize: 12 }}>إجراءات جماعية</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                          <select
                            value={bulkTargetUnitId}
                            onChange={(e) => setBulkTargetUnitId(e.target.value)}
                            style={{ width: '100%', padding: '10px 10px', borderRadius: 10, border: '1px solid #E5E7EB', background: 'white' }}
                          >
                            <option value="">— اختر القسم الهدف —</option>
                            {units
                              .filter((u) => u.id !== selectedUnitId)
                              .map((u) => (
                                <option key={u.id} value={u.id}>
                                  {u.name}
                                </option>
                              ))}
                          </select>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
                            <Button variant="secondary" onClick={() => {
                              // select all in current filtered list
                              const map: Record<string, boolean> = {}
                              for (const m of displayedMembers) map[m.employee.id] = true
                              setSelectedEmployeeIds(map)
                            }}>
                              تحديد الكل
                            </Button>
                            <Button variant="secondary" onClick={() => setSelectedEmployeeIds({})}>
                              مسح التحديد
                            </Button>
                            <Button variant="secondary" onClick={bulkAddSelected}>
                              إضافة المحددين
                            </Button>
                            <Button variant="danger" onClick={bulkMoveSelected}>
                              نقل المحددين
                            </Button>
                          </div>
                        </div>
                      </div>

                      {displayedMembers.length === 0 ? (
                        <div style={{ color: '#6B7280', marginTop: 10 }}>ما فيه أعضاء مرتبطين بهذا القسم (حسب الفلتر الحالي).</div>
                      ) : (
                        <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr', gap: 6, maxHeight: 360, overflow: 'auto' }}>
                          {displayedMembers.map(({ employee, orgUnitId, orgUnitName }) => (
                            <div
                              key={`${employee.id}:${orgUnitId}`}
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
                              <label style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                <input
                                  type="checkbox"
                                  checked={Boolean(selectedEmployeeIds[employee.id])}
                                  onChange={(e) => setSelectedEmployeeIds((prev) => ({ ...prev, [employee.id]: e.target.checked }))}
                                />
                                <div>
                                  <div>
                                    {employee.fullNameAr} <span style={{ color: '#6B7280' }}>({employee.employeeNumber})</span>
                                  </div>
                                  {includeChildrenMembers && (
                                    <div style={{ color: '#6B7280', fontSize: 12 }}>القسم: {orgUnitName}</div>
                                  )}
                                  {showUnassignedOnly && (
                                    <div style={{ color: '#6B7280', fontSize: 12 }}>الإدارة/القسم في بيانات الموظف: {(employee as any).department || '—'}</div>
                                  )}
                                </div>
                              </label>

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center' }}>
                                <select
                                  value={moveTargetByEmployeeId[employee.id] || ''}
                                  onChange={(e) => setMoveTargetByEmployeeId((prev) => ({ ...prev, [employee.id]: e.target.value }))}
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
                                    .filter((u) => u.id !== orgUnitId)
                                    .map((u) => (
                                      <option key={u.id} value={u.id}>
                                        {u.name}
                                      </option>
                                    ))}
                                </select>

                                <Button variant="secondary" disabled={showUnassignedOnly} onClick={() => moveMember(employee.id, orgUnitId, moveTargetByEmployeeId[employee.id] || '')}>
                                  نقل
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Input
                      label="بحث عن مدير القسم (اسم أو رقم موظف)"
                      value={headSearch}
                      onChange={(e) => setHeadSearch(e.target.value)}
                      placeholder="اكتب للاسراع…"
                    />

                    <Select label="مدير القسم" value={headId} onChange={(e) => setHeadId(e.target.value)}>
                      <option value="">— بدون —</option>
                      {filteredEmployeesForHeadRole.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.fullNameAr} ({e.employeeNumber})
                        </option>
                      ))}
                    </Select>

                    <Select label="تغطية مدير القسم" value={headCoverageScope} onChange={(e) => setHeadCoverageScope(e.target.value as any)}>
                      <option value="BRANCH">فرع واحد</option>
                      <option value="MULTI_BRANCH">عدة فروع</option>
                      <option value="ALL">كل الفروع</option>
                    </Select>

                    {headCoverageScope === 'MULTI_BRANCH' && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>اختر الفروع المغطاة</div>
                        <ReactSelect
                          isMulti
                          isRtl
                          placeholder="اختر الفروع…"
                          options={branches.map((b) => ({ value: b.id, label: b.name }))}
                          value={headCoverageBranchIds.map((id) => {
                            const b = branches.find((x) => x.id === id)
                            return { value: id, label: b?.name || id }
                          })}
                          onChange={(vals) => setHeadCoverageBranchIds((vals || []).map((v: any) => v.value))}
                          styles={{
                            control: (base) => ({ ...base, borderRadius: 12, borderColor: '#E5E7EB', minHeight: 44 }),
                            menu: (base) => ({ ...base, zIndex: 60 }),
                          }}
                        />
                      </div>
                    )}

                    <div style={{ height: 10 }} />

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

                    <Select label="تغطية المشرف" value={supervisorCoverageScope} onChange={(e) => setSupervisorCoverageScope(e.target.value as any)}>
                      <option value="BRANCH">فرع واحد</option>
                      <option value="MULTI_BRANCH">عدة فروع</option>
                      <option value="ALL">كل الفروع</option>
                    </Select>

                    {supervisorCoverageScope === 'MULTI_BRANCH' && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>اختر الفروع المغطاة</div>
                        <ReactSelect
                          isMulti
                          isRtl
                          placeholder="اختر الفروع…"
                          options={branches.map((b) => ({ value: b.id, label: b.name }))}
                          value={supervisorCoverageBranchIds.map((id) => {
                            const b = branches.find((x) => x.id === id)
                            return { value: id, label: b?.name || id }
                          })}
                          onChange={(vals) => setSupervisorCoverageBranchIds((vals || []).map((v: any) => v.value))}
                          styles={{
                            control: (base) => ({ ...base, borderRadius: 12, borderColor: '#E5E7EB', minHeight: 44 }),
                            menu: (base) => ({ ...base, zIndex: 60 }),
                          }}
                        />
                      </div>
                    )}

                    <div style={{ marginTop: 12, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                        <div style={{ fontWeight: 900 }}>👥 الأعضاء</div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ color: '#6B7280', fontSize: 12 }}>فلتر:</span>
                          <select
                            value={memberFilter}
                            onChange={(e) => setMemberFilter(e.target.value as any)}
                            style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #E5E7EB', background: 'white' }}
                          >
                            <option value="TEACHERS">معلمين</option>
                            <option value="STAFF">إداريين</option>
                            <option value="ALL">الكل</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ marginTop: 10 }}>
                        <ReactSelect
                          isMulti
                          isRtl
                          placeholder="اختر أعضاء…"
                          options={filteredEmployeesForMembers.map((e) => ({ value: e.id, label: `${e.fullNameAr} (${e.employeeNumber})` }))}
                          value={memberEmployeeIds
                            .map((id) => employees.find((e) => e.id === id))
                            .filter(Boolean)
                            .map((e) => ({ value: (e as any).id, label: `${(e as any).fullNameAr} (${(e as any).employeeNumber})` }))}
                          onChange={(vals) => setMemberEmployeeIds((vals || []).map((v: any) => v.value))}
                          styles={{
                            control: (base) => ({ ...base, borderRadius: 12, borderColor: '#E5E7EB', minHeight: 44 }),
                            menu: (base) => ({ ...base, zIndex: 60 }),
                          }}
                        />
                      </div>

                      <div style={{ color: '#6B7280', fontSize: 12, marginTop: 8 }}>
                        المختارين: {memberEmployeeIds.length}
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
        {showCreateUnitModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ width: '100%', maxWidth: 520, background: 'white', borderRadius: 16, border: '1px solid #E5E7EB', padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div style={{ fontWeight: 900 }}>➕ إضافة قسم</div>
                <button onClick={() => setShowCreateUnitModal(false)} style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #E5E7EB', background: '#F9FAFB' }}>
                  إغلاق
                </button>
              </div>

              <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                <Input label="اسم القسم" value={newUnitName} onChange={(e) => setNewUnitName(e.target.value)} placeholder="مثال: قسم الجودة" />

                <Select label="نوع القسم" value={newUnitType} onChange={(e) => setNewUnitType(e.target.value)}>
                  <option value="DEPARTMENT">DEPARTMENT</option>
                  <option value="SUB_DEPARTMENT">SUB_DEPARTMENT</option>
                  <option value="STAGE">STAGE</option>
                  <option value="SCHOOL">SCHOOL</option>
                </Select>

                <Select label="يتبع لـ (اختياري)" value={newUnitParentId} onChange={(e) => setNewUnitParentId(e.target.value)}>
                  <option value="">— تحت الفرع مباشرة —</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </Select>

                <Input label="بحث عن مدير القسم (اختياري)" value={newUnitHeadSearch} onChange={(e) => setNewUnitHeadSearch(e.target.value)} placeholder="اسم أو رقم موظف…" />
                <Select label="مدير القسم (اختياري)" value={newUnitHeadId} onChange={(e) => setNewUnitHeadId(e.target.value)}>
                  <option value="">— بدون —</option>
                  {filteredEmployeesForHead.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.fullNameAr} ({e.employeeNumber})
                    </option>
                  ))}
                </Select>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <Button variant="primary" onClick={createUnit}>
                    حفظ
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showUnassignedModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ width: '100%', maxWidth: 720, background: 'white', borderRadius: 16, border: '1px solid #E5E7EB', padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div style={{ fontWeight: 900 }}>👥 الموظفين غير المربوطين (بدون قسم)</div>
                <button onClick={() => setShowUnassignedModal(false)} style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #E5E7EB', background: '#F9FAFB' }}>
                  إغلاق
                </button>
              </div>

              <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                <Input label="بحث" value={unassignedSearch} onChange={(e) => setUnassignedSearch(e.target.value)} placeholder="اسم/رقم/قسم/مسمى…" />

                <Select label="اربط المحددين إلى قسم" value={unassignedTargetUnitId} onChange={(e) => setUnassignedTargetUnitId(e.target.value)}>
                  <option value="">— اختر —</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </Select>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      const map: Record<string, boolean> = {}
                      for (const e of filteredUnassigned) map[e.id] = true
                      setUnassignedSelectedIds(map)
                    }}
                  >
                    تحديد الكل
                  </Button>
                  <Button variant="secondary" onClick={() => setUnassignedSelectedIds({})}>
                    مسح التحديد
                  </Button>
                  <Button variant="primary" onClick={addUnassignedSelectedToUnit}>
                    ربط المحددين
                  </Button>
                </div>

                <div style={{ maxHeight: 420, overflow: 'auto', border: '1px solid #E5E7EB', borderRadius: 12, padding: 10, background: '#F9FAFB' }}>
                  {filteredUnassigned.length === 0 ? (
                    <div style={{ color: '#6B7280' }}>ما فيه موظفين غير مربوطين حسب البحث الحالي.</div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                      {filteredUnassigned.map((e) => (
                        <label key={e.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: 10 }}>
                          <input type="checkbox" checked={Boolean(unassignedSelectedIds[e.id])} onChange={(ev) => setUnassignedSelectedIds((p) => ({ ...p, [e.id]: ev.target.checked }))} />
                          <div>
                            <div style={{ fontWeight: 800 }}>{e.fullNameAr}</div>
                            <div style={{ color: '#6B7280', fontSize: 12 }}>
                              {e.employeeNumber} — {(e as any).position || '—'} — {(e as any).department || '—'}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
