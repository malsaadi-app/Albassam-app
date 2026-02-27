'use client'

import type { CSSProperties } from 'react'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ds, mergeStyles, text } from '@/lib/ui/ds'

type Props = {
  departments: string[]
  initialDepartment: string
  initialPositionId: string
}

type VacantPosition = {
  id: number
  code: string
  title: string
  level: string
  department: string
  status: string
}

type HeadcountInfo = {
  department: string
  approvedCount: number
  currentCount: number
  employeesCount: number
  openPositionsCount: number
  filledPositionsCount: number
  vacantPositionsCount: number
  availableToOpen: number
}

export default function JobApplicationFormClient({ departments, initialDepartment, initialPositionId }: Props) {
  const router = useRouter()

  const firstDept = departments[0] ?? ''

  const [department, setDepartment] = useState(initialDepartment || firstDept)
  const [positions, setPositions] = useState<VacantPosition[]>([])
  const [headcount, setHeadcount] = useState<HeadcountInfo | null>(null)
  const [positionId, setPositionId] = useState<string>(initialPositionId || '')

  const [applicantName, setApplicantName] = useState('')
  const [applicantPhone, setApplicantPhone] = useState('')
  const [applicantEmail, setApplicantEmail] = useState('')
  const [notes, setNotes] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const [showNoVacantModal, setShowNoVacantModal] = useState(false)

  const pageBg: CSSProperties = useMemo(
    () => ({
      minHeight: '100vh',
      background: ds.color.bg,
      fontFamily: ds.font.sans,
      color: ds.color.text,
    }),
    []
  )

  const container: CSSProperties = useMemo(
    () => ({
      maxWidth: '1000px',
      margin: '0 auto',
      padding: 'clamp(18px, 3.4vw, 36px)',
    }),
    []
  )

  const card: CSSProperties = useMemo(
    () => ({
      background: ds.color.surface,
      border: `1px solid ${ds.color.border}`,
      borderRadius: ds.radius.lg,
      boxShadow: ds.shadow.sm,
    }),
    []
  )

  const btnBase: CSSProperties = useMemo(
    () => ({
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      minHeight: 44,
      padding: '10px 14px',
      borderRadius: 12,
      border: `1px solid ${ds.color.border}`,
      textDecoration: 'none',
      fontWeight: 900,
      fontSize: 13,
      color: ds.color.text,
      background: ds.color.surface,
      cursor: 'pointer',
    }),
    []
  )

  const btnPrimary: CSSProperties = useMemo(
    () => ({
      background: `linear-gradient(135deg, ${ds.color.accent500} 0%, ${ds.color.accent600} 100%)`,
      border: '1px solid rgba(0,0,0,0.06)',
      color: ds.color.brand900,
      boxShadow: ds.shadow.glow,
    }),
    []
  )

  const input: CSSProperties = useMemo(
    () => ({
      width: '100%',
      borderRadius: 12,
      border: `1px solid ${ds.color.border}`,
      background: ds.color.surface,
      padding: '11px 12px',
      color: ds.color.text,
      outline: 'none',
    }),
    []
  )

  useEffect(() => {
    if (!department) return

    let cancelled = false
    setLoading(true)
    setError('')

    fetch(`/api/hr/positions/vacant?department=${encodeURIComponent(department)}&status=VACANT`)
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'فشل تحميل الشواغر')
        return data as { positions: VacantPosition[]; headcount: HeadcountInfo }
      })
      .then((data) => {
        if (cancelled) return

        setPositions(data.positions || [])
        setHeadcount(data.headcount || null)

        // If user came with positionId in URL, keep it if still in list.
        if (positionId && data.positions.some((p) => String(p.id) === String(positionId))) {
          // ok
        } else {
          setPositionId(data.positions[0] ? String(data.positions[0].id) : '')
        }

        setShowNoVacantModal((data.positions?.length ?? 0) === 0)
      })
      .catch((e) => {
        if (cancelled) return
        setError(String(e?.message || 'حدث خطأ'))
        setPositions([])
        setHeadcount(null)
        setShowNoVacantModal(false)
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [department])

  const submit = async () => {
    setError('')

    if (!department) {
      setError('يرجى اختيار القسم')
      return
    }

    if (!positionId) {
      setError('يرجى اختيار وظيفة شاغرة')
      setShowNoVacantModal(true)
      return
    }

    if (!applicantName.trim()) {
      setError('اسم المتقدم مطلوب')
      return
    }

    try {
      setLoading(true)

      const res = await fetch('/api/hr/job-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantName: applicantName.trim(),
          applicantPhone: applicantPhone.trim() || null,
          applicantEmail: applicantEmail.trim() || null,
          department,
          positionId: Number(positionId),
          notes: notes.trim() || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل إنشاء الطلب')

      router.push('/hr/job-applications?ok=created')
    } catch (e: any) {
      setError(String(e?.message || 'حدث خطأ أثناء الإرسال'))
    } finally {
      setLoading(false)
    }
  }

  const modalOverlay: CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.52)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    zIndex: 2000,
  }

  const modalCard: CSSProperties = {
    width: 'min(680px, 100%)',
    background: ds.color.surface,
    border: `1px solid ${ds.color.borderStrong}`,
    borderRadius: 18,
    boxShadow: ds.shadow.md,
    padding: 16,
  }

  return (
    <div dir="rtl" style={pageBg}>
      <div style={container}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
          <div>
            <div style={mergeStyles(text.display, { margin: 0 })}>طلب توظيف جديد</div>
            <div style={mergeStyles(text.body, { color: ds.color.muted, marginTop: 6 })}>
              اختيار وظيفة شاغرة إلزامي. عند عدم وجود شواغر سيظهر تنبيه مع خيارات.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href="/hr/job-applications" style={btnBase}>
              ← الرجوع
            </Link>
            <Link href="/hr/positions" style={btnBase}>
              💼 الوظائف
            </Link>
          </div>
        </div>

        {error && (
          <div
            style={mergeStyles(card, {
              padding: 12,
              marginBottom: 12,
              borderColor: 'rgba(239,68,68,0.25)',
              background: 'rgba(239,68,68,0.10)',
              color: ds.color.danger,
              fontWeight: 900,
            })}
          >
            {error}
          </div>
        )}

        <div style={mergeStyles(card, { padding: 14, marginBottom: 14 })}>
          <div style={mergeStyles(text.h2, { marginBottom: 10 })}>القسم والوظيفة</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
            <div>
              <div style={mergeStyles(text.small, { color: ds.color.muted, marginBottom: 6 })}>القسم *</div>
              <select value={department} onChange={(e) => setDepartment(e.target.value)} style={input as any}>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div style={mergeStyles(text.small, { color: ds.color.muted, marginBottom: 6 })}>الوظيفة الشاغرة *</div>
              <select
                value={positionId}
                onChange={(e) => setPositionId(e.target.value)}
                style={input as any}
                disabled={loading || positions.length === 0}
              >
                {positions.length === 0 ? (
                  <option value="">لا توجد شواغر</option>
                ) : (
                  positions.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.title} — {p.code} ({p.level})
                    </option>
                  ))
                )}
              </select>
              {headcount && (
                <div style={mergeStyles(text.small, { color: ds.color.muted, marginTop: 8 })}>
                  الكادر: {headcount.currentCount}/{headcount.approvedCount} • شواغر: {headcount.vacantPositionsCount} • متاح لفتح وظيفة: {headcount.availableToOpen}
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={mergeStyles(card, { padding: 14 })}>
          <div style={mergeStyles(text.h2, { marginBottom: 10 })}>بيانات المتقدم</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={mergeStyles(text.small, { color: ds.color.muted, marginBottom: 6 })}>اسم المتقدم *</div>
              <input value={applicantName} onChange={(e) => setApplicantName(e.target.value)} style={input} />
            </div>

            <div>
              <div style={mergeStyles(text.small, { color: ds.color.muted, marginBottom: 6 })}>الجوال</div>
              <input value={applicantPhone} onChange={(e) => setApplicantPhone(e.target.value)} style={input} placeholder="05xxxxxxxx" />
            </div>

            <div>
              <div style={mergeStyles(text.small, { color: ds.color.muted, marginBottom: 6 })}>البريد الإلكتروني</div>
              <input value={applicantEmail} onChange={(e) => setApplicantEmail(e.target.value)} style={input} placeholder="name@email.com" />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <div style={mergeStyles(text.small, { color: ds.color.muted, marginBottom: 6 })}>ملاحظات (اختياري)</div>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} style={mergeStyles(input, { resize: 'vertical' })} rows={4} />
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" onClick={submit} disabled={loading} style={mergeStyles(btnBase, btnPrimary, { border: '1px solid rgba(0,0,0,0.06)' })}>
                {loading ? 'جاري الإرسال...' : 'إرسال الطلب'}
              </button>
              <Link href="/hr/job-applications" style={btnBase}>
                إلغاء
              </Link>
            </div>
          </div>
        </div>
      </div>

      {showNoVacantModal && (
        <div style={modalOverlay} role="dialog" aria-modal="true">
          <div style={modalCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}>
              <div>
                <div style={mergeStyles(text.h2, { margin: 0 })}>❌ لا توجد وظائف شاغرة</div>
                <div style={mergeStyles(text.body, { color: ds.color.muted, marginTop: 6 })}>
                  لا توجد وظائف شاغرة في قسم <b>{department}</b>. اختر أحد الخيارات التالية:
                </div>
              </div>
              <button type="button" onClick={() => setShowNoVacantModal(false)} style={mergeStyles(btnBase, { minHeight: 36, padding: '6px 10px', fontSize: 12 })}>
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
              <Link href={`/hr/positions?department=${encodeURIComponent(department)}&status=FILLED`} style={mergeStyles(btnBase, { justifyContent: 'flex-start' })}>
                🔄 استبدال موظف (عرض الوظائف المشغولة)
              </Link>

              <Link href={`/hr/positions/new?department=${encodeURIComponent(department)}`} style={mergeStyles(btnBase, btnPrimary, { justifyContent: 'flex-start' })}>
                ➕ فتح وظيفة جديدة
              </Link>

              <Link href={`/hr/headcount/request?department=${encodeURIComponent(department)}&type=INCREASE`} style={mergeStyles(btnBase, { justifyContent: 'flex-start' })}>
                📈 طلب زيادة الكادر
              </Link>
            </div>

            <div style={mergeStyles(text.small, { color: ds.color.muted, marginTop: 12 })}>
              ملاحظة: يمكنك تغيير القسم ثم إعادة المحاولة.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
