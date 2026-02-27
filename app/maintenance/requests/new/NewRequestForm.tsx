'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { ds, text } from '@/lib/ui/ds'

type Branch = {
  id: string
  name: string
  stages: Array<{ id: string; name: string }>
}

type AssetLite = {
  id: string
  assetNumber: string
  name: string
  type: string
  serialNumber?: string | null
}

const BUILDING_CATEGORIES = ['Electricity', 'Plumbing', 'AC', 'Carpentry', 'Painting', 'General']
const IT_CATEGORIES = ['Computer', 'Printer', 'Projector', 'Network', 'Smart Board', 'Other']

export default function NewRequestForm() {
  const router = useRouter()
  const sp = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [branches, setBranches] = useState<Branch[]>([])

  const [type, setType] = useState<'BUILDING' | 'ELECTRONICS'>('BUILDING')
  const [kind, setKind] = useState<'CORRECTIVE' | 'EMERGENCY' | 'PREVENTIVE'>('CORRECTIVE')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState<'NORMAL' | 'HIGH' | 'EMERGENCY'>('NORMAL')
  const [branchId, setBranchId] = useState('')
  const [stageId, setStageId] = useState('')
  const [locationDetails, setLocationDetails] = useState('')
  const [description, setDescription] = useState('')

  const [assetQuery, setAssetQuery] = useState('')
  const [assetResults, setAssetResults] = useState<AssetLite[]>([])
  const [assetId, setAssetId] = useState<string>('')
  const [assetPicked, setAssetPicked] = useState<AssetLite | null>(null)

  const categories = useMemo(() => (type === 'BUILDING' ? BUILDING_CATEGORIES : IT_CATEGORIES), [type])

  useEffect(() => {
    const presetAssetId = sp.get('assetId')
    if (presetAssetId) {
      setAssetId(presetAssetId)
    }
  }, [sp])

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
    if (!category) {
      setCategory(categories[0] || '')
    } else if (!categories.includes(category)) {
      setCategory(categories[0] || '')
    }
  }, [categories])

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

  useEffect(() => {
    let t: any
    if (!assetQuery.trim()) {
      setAssetResults([])
      return
    }
    t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/maintenance/assets/search?q=${encodeURIComponent(assetQuery.trim())}&limit=8`)
        if (res.ok) {
          const data = await res.json()
          setAssetResults(data.assets || [])
        }
      } catch {
        // ignore
      }
    }, 250)
    return () => clearTimeout(t)
  }, [assetQuery])

  async function submit() {
    if (!branchId || !locationDetails.trim() || !description.trim() || !category) {
      alert('يرجى تعبئة الحقول المطلوبة')
      return
    }

    try {
      setLoading(true)
      const res = await fetch('/api/maintenance/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          kind,
          category,
          priority,
          branchId,
          stageId: stageId || null,
          locationDetails,
          description,
          assetId: assetId || null
        })
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'فشل إنشاء الطلب')

      router.push(`/maintenance/requests/${data.request.id}`)
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
          <h1 style={{ ...text.display, margin: 0, color: ds.color.text }}>طلب صيانة جديد</h1>
          <div style={{ ...text.small, color: ds.color.text2, marginTop: 6 }}>املأ البيانات ثم اضغط إرسال</div>
        </div>
        <Link href="/maintenance/requests" style={{
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
            <div style={{ ...text.small, color: ds.color.text2 }}>نوع الصيانة</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => setType('BUILDING')} style={{
                padding: '10px 12px',
                borderRadius: 12,
                border: `1px solid ${ds.color.border}`,
                background: type === 'BUILDING' ? 'rgba(59,130,246,0.12)' : ds.color.surface,
                fontWeight: 900,
                cursor: 'pointer'
              }}>🏢 مباني</button>
              <button type="button" onClick={() => setType('ELECTRONICS')} style={{
                padding: '10px 12px',
                borderRadius: 12,
                border: `1px solid ${ds.color.border}`,
                background: type === 'ELECTRONICS' ? 'rgba(59,130,246,0.12)' : ds.color.surface,
                fontWeight: 900,
                cursor: 'pointer'
              }}>💻 أجهزة/تقنيات</button>
            </div>
          </div>

          <div>
            <div style={{ ...text.small, color: ds.color.text2 }}>نوع الطلب</div>
            <select value={kind} onChange={(e) => setKind(e.target.value as any)} style={{ marginTop: 8, width: '100%', padding: '10px 12px', borderRadius: 12, border: `1px solid ${ds.color.border}` }}>
              <option value="CORRECTIVE">تصحيحية</option>
              <option value="EMERGENCY">طارئة</option>
              <option value="PREVENTIVE">دورية</option>
            </select>
          </div>

          <div>
            <div style={{ ...text.small, color: ds.color.text2 }}>الفئة</div>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ marginTop: 8, width: '100%', padding: '10px 12px', borderRadius: 12, border: `1px solid ${ds.color.border}` }}>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ ...text.small, color: ds.color.text2 }}>الأولوية</div>
            <select value={priority} onChange={(e) => setPriority(e.target.value as any)} style={{ marginTop: 8, width: '100%', padding: '10px 12px', borderRadius: 12, border: `1px solid ${ds.color.border}` }}>
              <option value="NORMAL">عادي</option>
              <option value="HIGH">عالي</option>
              <option value="EMERGENCY">طارئ</option>
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
            <div style={{ ...text.small, color: ds.color.text2 }}>الموقع التفصيلي (مطلوب)</div>
            <input value={locationDetails} onChange={(e) => setLocationDetails(e.target.value)} placeholder="مثال: فصل 3-A، مكتب المدير، معمل الحاسب..." style={{ marginTop: 8, width: '100%', padding: '10px 12px', borderRadius: 12, border: `1px solid ${ds.color.border}` }} />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ ...text.small, color: ds.color.text2 }}>الوصف (مطلوب)</div>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} placeholder="اكتب وصف المشكلة بالتفصيل..." style={{ marginTop: 8, width: '100%', padding: '10px 12px', borderRadius: 12, border: `1px solid ${ds.color.border}` }} />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ ...text.small, color: ds.color.text2 }}>ربط أصل (اختياري)</div>
            {assetPicked ? (
              <div style={{
                marginTop: 8,
                border: `1px solid ${ds.color.border}`,
                borderRadius: 12,
                padding: '10px 12px',
                background: ds.color.surface,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                flexWrap: 'wrap'
              }}>
                <div style={{ fontWeight: 900 }}>{assetPicked.assetNumber} • {assetPicked.name}</div>
                <button type="button" onClick={() => { setAssetId(''); setAssetPicked(null); }} style={{
                  padding: '8px 10px',
                  borderRadius: 10,
                  border: `1px solid ${ds.color.border}`,
                  background: ds.color.bgElevated,
                  cursor: 'pointer',
                  fontWeight: 900
                }}>إزالة</button>
              </div>
            ) : (
              <>
                <input value={assetQuery} onChange={(e) => setAssetQuery(e.target.value)} placeholder="ابحث برقم الأصل أو الاسم أو السيريال..." style={{ marginTop: 8, width: '100%', padding: '10px 12px', borderRadius: 12, border: `1px solid ${ds.color.border}` }} />
                {assetResults.length > 0 ? (
                  <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>
                    {assetResults.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          setAssetId(a.id)
                          setAssetPicked(a)
                          setAssetResults([])
                          setAssetQuery('')
                        }}
                        style={{
                          textAlign: 'right',
                          padding: '10px 12px',
                          borderRadius: 12,
                          border: `1px solid ${ds.color.border}`,
                          background: ds.color.surface,
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ fontWeight: 900 }}>{a.assetNumber} • {a.name}</div>
                        <div style={{ ...text.small, color: ds.color.text2, marginTop: 2 }}>{a.type}{a.serialNumber ? ` • ${a.serialNumber}` : ''}</div>
                      </button>
                    ))}
                  </div>
                ) : null}
              </>
            )}
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
            {loading ? '...' : 'إرسال الطلب'}
          </button>
          <Link href="/maintenance/requests" style={{
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
