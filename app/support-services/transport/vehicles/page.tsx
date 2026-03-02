'use client'

import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'

type Branch = { id: string; name: string; status: string }

type VehicleRow = {
  id: string
  plateNumber: string
  vehicleType: string
  model: string | null
  year: number | null
  capacity: number | null
  status: string
  branchId: string | null
}

export default function TransportVehiclesPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [branchId, setBranchId] = useState<string>('')
  const [vehicles, setVehicles] = useState<VehicleRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [q, setQ] = useState('')

  // create form
  const [plateNumber, setPlateNumber] = useState('')
  const [vehicleType, setVehicleType] = useState('حافلة')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [capacity, setCapacity] = useState('')
  const [status, setStatus] = useState('ACTIVE')
  const [formBranchId, setFormBranchId] = useState('')

  useEffect(() => {
    fetch('/api/branches')
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d) ? d : d.branches || d.data || []
        setBranches((list || []).filter((b: any) => b.status === 'ACTIVE'))
      })
      .catch(() => setBranches([]))
  }, [])

  const loadVehicles = async (bId?: string) => {
    setLoading(true)
    setError('')
    try {
      const url = bId ? `/api/transport/vehicles?branchId=${bId}` : '/api/transport/vehicles'
      const res = await fetch(url)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to load')
      setVehicles(data.vehicles || [])
    } catch (e: any) {
      setVehicles([])
      setError(e?.message || 'فشل تحميل المركبات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVehicles(branchId || '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId])

  const branchNameById = useMemo(() => new Map(branches.map((b) => [b.id, b.name])), [branches])

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase()
    if (!qq) return vehicles
    return vehicles.filter((v) => {
      const plate = (v.plateNumber || '').toLowerCase()
      const type = (v.vehicleType || '').toLowerCase()
      const m = (v.model || '').toLowerCase()
      return plate.includes(qq) || type.includes(qq) || m.includes(qq)
    })
  }, [vehicles, q])

  const createVehicle = async () => {
    setError('')
    const body: any = {
      plateNumber,
      vehicleType,
      model: model || null,
      year: year ? Number(year) : null,
      capacity: capacity ? Number(capacity) : null,
      status,
      branchId: formBranchId || null,
    }

    const res = await fetch('/api/transport/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      alert(data.error || 'فشل إضافة المركبة')
      return
    }

    setPlateNumber('')
    setModel('')
    setYear('')
    setCapacity('')
    setStatus('ACTIVE')
    setFormBranchId('')

    alert('✅ تم إضافة المركبة')
    loadVehicles(branchId || '')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <PageHeader title="🚌 النقل — المركبات" breadcrumbs={['الرئيسية', 'الخدمات المساندة', 'النقل', 'المركبات']} />

        <Card variant="default">
          <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
            <div style={{ fontWeight: 900 }}>➕ إضافة مركبة</div>
            <Input label="رقم اللوحة" value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} placeholder="مثال: ABC-1234" />
            <Input label="نوع المركبة" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} placeholder="حافلة / سيارة" />
            <Input label="الموديل" value={model} onChange={(e) => setModel(e.target.value)} placeholder="مثال: Hiace" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Input label="السنة" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2020" />
              <Input label="السعة" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="45" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Select label="الحالة" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="ACTIVE">ACTIVE</option>
                <option value="IN_MAINTENANCE">IN_MAINTENANCE</option>
                <option value="INACTIVE">INACTIVE</option>
              </Select>

              <Select label="الفرع (اختياري)" value={formBranchId} onChange={(e) => setFormBranchId(e.target.value)}>
                <option value="">— بدون —</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="primary" onClick={createVehicle}>
                حفظ
              </Button>
            </div>
          </div>
        </Card>

        <Card variant="default">
          <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
            <div style={{ fontWeight: 900 }}>📋 قائمة المركبات</div>

            <Select label="فلتر بالفرع (اختياري)" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              <option value="">— كل الفروع —</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>

            <Input label="بحث" value={q} onChange={(e) => setQ(e.target.value)} placeholder="لوحة / نوع / موديل…" />

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', padding: '10px 12px', borderRadius: 10 }}>
                {error}
              </div>
            )}

            {loading ? (
              <div>جاري التحميل…</div>
            ) : filtered.length === 0 ? (
              <div style={{ color: '#6B7280' }}>ما فيه مركبات حسب الفلتر الحالي.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'right', borderBottom: '1px solid #E5E7EB' }}>
                      <th style={{ padding: '10px 8px' }}>اللوحة</th>
                      <th style={{ padding: '10px 8px' }}>النوع</th>
                      <th style={{ padding: '10px 8px' }}>الموديل</th>
                      <th style={{ padding: '10px 8px' }}>السنة</th>
                      <th style={{ padding: '10px 8px' }}>السعة</th>
                      <th style={{ padding: '10px 8px' }}>الحالة</th>
                      <th style={{ padding: '10px 8px' }}>الفرع</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((v) => (
                      <tr key={v.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '10px 8px', fontWeight: 900 }}>{v.plateNumber}</td>
                        <td style={{ padding: '10px 8px' }}>{v.vehicleType}</td>
                        <td style={{ padding: '10px 8px' }}>{v.model || '—'}</td>
                        <td style={{ padding: '10px 8px' }}>{v.year ?? '—'}</td>
                        <td style={{ padding: '10px 8px' }}>{v.capacity ?? '—'}</td>
                        <td style={{ padding: '10px 8px' }}>{v.status}</td>
                        <td style={{ padding: '10px 8px' }}>{(v.branchId && branchNameById.get(v.branchId)) || '—'}</td>
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
