'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ds, text } from '@/lib/ui/ds'

type Branch = {
  id: string
  name: string
  stages: Array<{ id: string; name: string }>
}

export default function NewAssetForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [branches, setBranches] = useState<Branch[]>([])

  const [type, setType] = useState('')
  const [category, setCategory] = useState<'ELECTRONICS' | 'BUILDING_EQUIPMENT'>('ELECTRONICS')
  const [name, setName] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [branchId, setBranchId] = useState('')
  const [stageId, setStageId] = useState('')
  const [locationDetails, setLocationDetails] = useState('')

  const [status, setStatus] = useState<'GOOD' | 'NEEDS_MAINTENANCE' | 'BROKEN' | 'OUT_OF_SERVICE'>('GOOD')
  const [maintenanceInterval, setMaintenanceInterval] = useState('')
  const [nextMaintenanceDate, setNextMaintenanceDate] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/branches')
        if (res.ok) {
          const data = await res.json()
          setBranches(data)
          if (data[0]?.id) setBranchId(data[0].id)
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    const b = branches.find((x) => x.id === branchId)
    if (!b) {
      setStageId('')
      return
    }
    if (stageId && !b.stages.some((s) => s.id === stageId)) {
      setStageId('')
    }
  }, [branchId, branches])

  async function submit() {
    if (!type.trim() || !name.trim() || !branchId || !locationDetails.trim()) {
      alert('يرجى تعبئة الحقول المطلوبة')
      return
    }

    try {
      setLoading(true)
      const res = await fetch('/api/maintenance/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          category,
          name,
          serialNumber: serialNumber.trim() || null,
          branchId,
          stageId: stageId || null,
          locationDetails,
          status,
          maintenanceInterval: maintenanceInterval.trim() ? Number(maintenanceInterval) : null,
          nextMaintenanceDate: nextMaintenanceDate || null
        })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'فشل إنشاء الأصل')
      router.push(`/maintenance/assets/${data.asset.id}`)
    } catch (e: any) {
      alert(e.message || 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  const currentBranch = branches.find((b) => b.id === branchId)

  return (
    <div style={{ padding: '20px 16px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ ...text.display, margin: 0, color: ds.color.text }}>إضافة أصل</h1>
          <div style={{ ...text.small, color: ds.color.text2, marginTop: 6 }}>للأجهزة والمعدات (مباني/تقنيات)</div>
        </div>
        <Link href="/maintenance/assets" style={{
          padding: '10px 12px',
          borderRadius: 12,
          border: `1px solid ${ds.color.border}`,
          background: ds.color.bgElevated,
          color: ds.color.text,
          textDecoration: 'none',
          fontWeight: 800
        }}>⬅️ رجوع</Link>
      </div>

      <div style={{ marginTop: 14, background: ds.color.bgElevated, border: `1px solid ${ds.color.border}`, borderRadius: ds.radius.lg, padding: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          <div>
            <div style={{ ...text.small, color: ds.color.text2 }}>الفئة</div>
            <select value={category} onChange={(e) => setCategory(e.target.value as any)} style={{ marginTop: 8, width: '100%', padding: '10px 12px', borderRadius: 12, border: `1px solid ${ds.color.border}` }}>
              <option value="ELECTRONICS">تقنيات</option>
              <option value="BUILDING_EQUIPMENT">معدات مباني</option>
            </select>
          </div>

          <div>
            <div style={{ ...text.small, color: ds.color.text2 }}>نوع الأصل (type)</div>
            <input value={type} onChange={(e) => setType(e.target.value)} placeholder="مثال: PRINTER / AC / PROJECTOR" style={{ marginTop: 8, width: '100%', padding: '10px 12px', borderRadius: 12, border: `1px solid ${ds.color.border}` }} />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ ...text.small, color: ds.color.text2 }}>اسم الأصل</div>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: طابعة HP LaserJet 402" style={{ marginTop: 8, width: '100%', padding: '10px 12px', borderRadius: 12, border: `1px solid ${ds.color.border}` }} />
          </div>

          <div>
            <div style={{ ...text.small, color: ds.color.text2 }}>Serial (اختياري)</div>
            <input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} placeholder="SN..." style={{ marginTop: 8, width: '100%', padding: '10px 12px', borderRadius: 12, border: `1px solid ${ds.color.border}` }} />
          </div>

          <div>
            <div style={{ ...text.small, color: ds.color.text2 }}>الحالة</div>
            <select value={status} onChange={(e) => setStatus(e.target.value as any)} style={{ marginTop: 8, width: '100%', padding: '10px 12px', borderRadius: 12, border: `1px solid ${ds.color.border}` }}>
              <option value="GOOD">GOOD</option>
              <option value="NEEDS_MAINTENANCE">NEEDS_MAINTENANCE</option>
              <option value="BROKEN">BROKEN</option>
              <option value="OUT_OF_SERVICE">OUT_OF_SERVICE</option>
            </select>
          </div>

          <div>
            <div style={{ ...text.small, color: ds.color.text2 }}>الفرع</div>
            <select value={branchId} onChange={(e) => setBranchId(e.target.value)} style={{ marginTop: 8, width: '100%', padding: '10px 12px', borderRadius: 12, border: `1px solid ${ds.color.border}` }}>
              <option value="">اختر الفرع</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ ...text.small, color: ds.color.text2 }}>المرحلة (اختياري)</div>
            <select value={stageId} onChange={(e) => setStageId(e.target.value)} style={{ marginTop: 8, width: '100%', padding: '10px 12px', borderRadius: 12, border: `1px solid ${ds.color.border}` }}>
              <option value="">-</option>
              {currentBranch?.stages?.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ ...text.small, color: ds.color.text2 }}>الموقع التفصيلي</div>
            <input value={locationDetails} onChange={(e) => setLocationDetails(e.target.value)} placeholder="مثال: معمل الحاسب، غرفة الكهرباء..." style={{ marginTop: 8, width: '100%', padding: '10px 12px', borderRadius: 12, border: `1px solid ${ds.color.border}` }} />
          </div>

          <div>
            <div style={{ ...text.small, color: ds.color.text2 }}>الفترة (أيام) - اختياري</div>
            <input value={maintenanceInterval} onChange={(e) => setMaintenanceInterval(e.target.value)} inputMode="numeric" placeholder="30" style={{ marginTop: 8, width: '100%', padding: '10px 12px', borderRadius: 12, border: `1px solid ${ds.color.border}` }} />
          </div>

          <div>
            <div style={{ ...text.small, color: ds.color.text2 }}>الصيانة القادمة - اختياري</div>
            <input value={nextMaintenanceDate} onChange={(e) => setNextMaintenanceDate(e.target.value)} type="date" style={{ marginTop: 8, width: '100%', padding: '10px 12px', borderRadius: 12, border: `1px solid ${ds.color.border}` }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
          <button
            type="button"
            disabled={loading}
            onClick={submit}
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              border: `1px solid rgba(219, 234, 254, 0.6)`,
              background: 'linear-gradient(135deg, rgba(59,130,246,0.95) 0%, rgba(96,165,250,0.95) 100%)',
              fontWeight: 1000,
              cursor: 'pointer'
            }}
          >
            {loading ? '...' : 'حفظ الأصل'}
          </button>
          <Link href="/maintenance/assets" style={{
            padding: '12px 14px',
            borderRadius: 12,
            border: `1px solid ${ds.color.border}`,
            background: ds.color.surface,
            textDecoration: 'none',
            color: ds.color.text,
            fontWeight: 900,
            display: 'inline-block'
          }}>إلغاء</Link>
        </div>
      </div>
    </div>
  )
}
