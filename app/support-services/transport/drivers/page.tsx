'use client'

import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Input'

type Branch = { id: string; name: string; status: string }

type DriverRow = {
  id: string
  fullNameAr: string
  employeeNumber: string
  phone: string
  branchId: string | null
  department: string
  position: string
}

export default function TransportDriversPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [branchId, setBranchId] = useState<string>('')
  const [drivers, setDrivers] = useState<DriverRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')

  useEffect(() => {
    fetch('/api/branches')
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d) ? d : d.branches || d.data || []
        setBranches((list || []).filter((b: any) => b.status === 'ACTIVE'))
      })
      .catch(() => setBranches([]))
  }, [])

  const loadDrivers = async (bId?: string) => {
    setLoading(true)
    setError('')
    try {
      const url = bId ? `/api/transport/drivers?branchId=${bId}` : '/api/transport/drivers'
      const res = await fetch(url)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to load')
      setDrivers(data.drivers || [])
    } catch (e: any) {
      setDrivers([])
      setError(e?.message || 'فشل تحميل السائقين')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDrivers(branchId || '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId])

  const branchNameById = useMemo(() => new Map(branches.map((b) => [b.id, b.name])), [branches])

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase()
    if (!qq) return drivers
    return drivers.filter((d) => {
      const name = (d.fullNameAr || '').toLowerCase()
      const num = (d.employeeNumber || '').toLowerCase()
      const phone = (d.phone || '').toLowerCase()
      const dept = (d.department || '').toLowerCase()
      return name.includes(qq) || num.includes(qq) || phone.includes(qq) || dept.includes(qq)
    })
  }, [drivers, q])

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <PageHeader title="🚐 النقل — السائقين" breadcrumbs={['الرئيسية', 'الخدمات المساندة', 'النقل', 'السائقين']} />

        <Card variant="default">
          <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
            <Select label="فلتر بالفرع (اختياري)" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              <option value="">— كل الفروع —</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>

            <Input label="بحث" value={q} onChange={(e) => setQ(e.target.value)} placeholder="اسم / رقم / جوال / قسم…" />

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', padding: '10px 12px', borderRadius: 10 }}>
                {error}
              </div>
            )}

            <div style={{ color: '#6B7280', fontSize: 12 }}>
              الإجمالي: {drivers.length} — بعد البحث: {filtered.length}
            </div>
          </div>
        </Card>

        <Card variant="default">
          <div style={{ padding: 16 }}>
            {loading ? (
              <div>جاري التحميل…</div>
            ) : filtered.length === 0 ? (
              <div style={{ color: '#6B7280' }}>ما فيه سائقين حسب الفلتر الحالي.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'right', borderBottom: '1px solid #E5E7EB' }}>
                      <th style={{ padding: '10px 8px' }}>الاسم</th>
                      <th style={{ padding: '10px 8px' }}>رقم الموظف</th>
                      <th style={{ padding: '10px 8px' }}>الجوال</th>
                      <th style={{ padding: '10px 8px' }}>الفرع</th>
                      <th style={{ padding: '10px 8px' }}>القسم (بيانات الموظف)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((d) => (
                      <tr key={d.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '10px 8px', fontWeight: 800 }}>{d.fullNameAr}</td>
                        <td style={{ padding: '10px 8px' }}>{d.employeeNumber}</td>
                        <td style={{ padding: '10px 8px' }}>{d.phone || '—'}</td>
                        <td style={{ padding: '10px 8px' }}>{(d.branchId && branchNameById.get(d.branchId)) || '—'}</td>
                        <td style={{ padding: '10px 8px' }}>{d.department || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
