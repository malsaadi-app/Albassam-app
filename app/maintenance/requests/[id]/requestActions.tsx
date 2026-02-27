'use client'

import { useMemo, useState } from 'react'
import { ds, text } from '@/lib/ui/ds'

type Tech = { id: string; fullNameAr: string; employeeNumber: string }

export default function RequestActions(props: {
  requestId: string
  requestNumber: string
  status: string
  type: string
  canAssign: boolean
  canUpdateStatus: boolean
  canSeeInternal: boolean
  isRequester: boolean
  hasRating: boolean
  technicians: Tech[]
}) {
  const [comment, setComment] = useState('')
  const [commentInternal, setCommentInternal] = useState(false)
  const [loading, setLoading] = useState(false)

  const [assignTo, setAssignTo] = useState(props.technicians[0]?.id || '')
  const [assignNotes, setAssignNotes] = useState('')

  const [newStatus, setNewStatus] = useState(props.status)
  const [statusNotes, setStatusNotes] = useState('')

  const [laborHours, setLaborHours] = useState<string>('')
  const [completeNotes, setCompleteNotes] = useState('')

  const [rating, setRating] = useState<number>(5)
  const [ratingComment, setRatingComment] = useState('')

  const showRate = props.isRequester && (props.status === 'COMPLETED' || props.status === 'COMPLETED_PENDING_CONFIRMATION') && !props.hasRating

  const statusOptions = useMemo(() => {
    return [
      'UNDER_REVIEW',
      'ASSIGNED',
      'IN_PROGRESS',
      'ON_HOLD',
      'COMPLETED_PENDING_CONFIRMATION',
      'COMPLETED',
      'REOPENED',
      'CANCELLED',
      'REJECTED'
    ]
  }, [])

  async function postJson(url: string, body: any, method: string = 'POST') {
    setLoading(true)
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Request failed')
      return data
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
      {/* Add comment */}
      <div style={{ background: ds.color.bgElevated, border: `1px solid ${ds.color.border}`, borderRadius: ds.radius.lg, padding: 14 }}>
        <div style={{ ...text.h2, color: ds.color.text }}>إضافة تعليق</div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="اكتب تعليقك..."
          rows={4}
          style={{
            marginTop: 10,
            width: '100%',
            padding: '10px 12px',
            borderRadius: 12,
            border: `1px solid ${ds.color.border}`
          }}
        />
        {props.canSeeInternal ? (
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, color: ds.color.text2, fontWeight: 700 }}>
            <input type="checkbox" checked={commentInternal} onChange={(e) => setCommentInternal(e.target.checked)} />
            ملاحظة داخلية (للفنيين/المدير)
          </label>
        ) : null}
        <button
          disabled={loading || !comment.trim()}
          onClick={async () => {
            try {
              await postJson(`/api/maintenance/requests/${props.requestId}/comments`, {
                comment,
                isInternal: commentInternal
              })
              window.location.reload()
            } catch (e: any) {
              alert(e.message || 'حدث خطأ')
            }
          }}
          style={{
            marginTop: 10,
            padding: '10px 12px',
            borderRadius: 12,
            border: `1px solid rgba(219, 234, 254, 0.6)`,
            background: 'linear-gradient(135deg, rgba(59,130,246,0.95) 0%, rgba(96,165,250,0.95) 100%)',
            fontWeight: 900,
            cursor: 'pointer'
          }}
        >
          {loading ? '...' : 'إرسال التعليق'}
        </button>
      </div>

      {/* Assign */}
      {props.canAssign ? (
        <div style={{ background: ds.color.bgElevated, border: `1px solid ${ds.color.border}`, borderRadius: ds.radius.lg, padding: 14 }}>
          <div style={{ ...text.h2, color: ds.color.text }}>تعيين لفني</div>
          <select
            value={assignTo}
            onChange={(e) => setAssignTo(e.target.value)}
            style={{ marginTop: 10, width: '100%', padding: '10px 12px', borderRadius: 12, border: `1px solid ${ds.color.border}` }}
          >
            <option value="">اختر فني</option>
            {props.technicians.map((t) => (
              <option key={t.id} value={t.id}>
                {t.fullNameAr} ({t.employeeNumber})
              </option>
            ))}
          </select>
          <input
            value={assignNotes}
            onChange={(e) => setAssignNotes(e.target.value)}
            placeholder="ملاحظات للفني (اختياري)"
            style={{ marginTop: 10, width: '100%', padding: '10px 12px', borderRadius: 12, border: `1px solid ${ds.color.border}` }}
          />
          <button
            disabled={loading || !assignTo}
            onClick={async () => {
              try {
                await postJson(`/api/maintenance/requests/${props.requestId}/assign`, {
                  assignedToId: assignTo,
                  notes: assignNotes
                })
                window.location.reload()
              } catch (e: any) {
                alert(e.message || 'حدث خطأ')
              }
            }}
            style={{
              marginTop: 10,
              padding: '10px 12px',
              borderRadius: 12,
              border: `1px solid rgba(254, 243, 199, 0.9)`,
              background: 'linear-gradient(135deg, rgba(245,158,11,0.95) 0%, rgba(251,191,36,0.95) 100%)',
              fontWeight: 900,
              cursor: 'pointer'
            }}
          >
            {loading ? '...' : 'تعيين'}
          </button>
        </div>
      ) : null}

      {/* Status update */}
      {props.canUpdateStatus ? (
        <div style={{ background: ds.color.bgElevated, border: `1px solid ${ds.color.border}`, borderRadius: ds.radius.lg, padding: 14 }}>
          <div style={{ ...text.h2, color: ds.color.text }}>تحديث الحالة</div>
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            style={{ marginTop: 10, width: '100%', padding: '10px 12px', borderRadius: 12, border: `1px solid ${ds.color.border}` }}
          >
            {[props.status, ...statusOptions.filter((x) => x !== props.status)].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <input
            value={statusNotes}
            onChange={(e) => setStatusNotes(e.target.value)}
            placeholder="ملاحظات (اختياري)"
            style={{ marginTop: 10, width: '100%', padding: '10px 12px', borderRadius: 12, border: `1px solid ${ds.color.border}` }}
          />
          <button
            disabled={loading || newStatus === props.status}
            onClick={async () => {
              try {
                await postJson(`/api/maintenance/requests/${props.requestId}/status`, {
                  status: newStatus,
                  notes: statusNotes
                }, 'PATCH')
                window.location.reload()
              } catch (e: any) {
                alert(e.message || 'حدث خطأ')
              }
            }}
            style={{
              marginTop: 10,
              padding: '10px 12px',
              borderRadius: 12,
              border: `1px solid rgba(219, 234, 254, 0.6)`,
              background: ds.color.surface,
              fontWeight: 900,
              cursor: 'pointer'
            }}
          >
            {loading ? '...' : 'حفظ الحالة'}
          </button>
        </div>
      ) : null}

      {/* Complete */}
      {(props.canUpdateStatus || props.canAssign) && props.status !== 'COMPLETED' ? (
        <div style={{ background: ds.color.bgElevated, border: `1px solid ${ds.color.border}`, borderRadius: ds.radius.lg, padding: 14 }}>
          <div style={{ ...text.h2, color: ds.color.text }}>إنهاء الطلب</div>
          <input
            value={laborHours}
            onChange={(e) => setLaborHours(e.target.value)}
            placeholder="ساعات العمل (اختياري)"
            inputMode="decimal"
            style={{ marginTop: 10, width: '100%', padding: '10px 12px', borderRadius: 12, border: `1px solid ${ds.color.border}` }}
          />
          <input
            value={completeNotes}
            onChange={(e) => setCompleteNotes(e.target.value)}
            placeholder="ملاحظات الإنجاز (اختياري)"
            style={{ marginTop: 10, width: '100%', padding: '10px 12px', borderRadius: 12, border: `1px solid ${ds.color.border}` }}
          />
          <button
            disabled={loading}
            onClick={async () => {
              try {
                const lh = laborHours.trim() ? Number(laborHours) : undefined
                await postJson(`/api/maintenance/requests/${props.requestId}/complete`, {
                  laborHours: lh,
                  notes: completeNotes
                })
                window.location.reload()
              } catch (e: any) {
                alert(e.message || 'حدث خطأ')
              }
            }}
            style={{
              marginTop: 10,
              padding: '10px 12px',
              borderRadius: 12,
              border: `1px solid rgba(220, 252, 231, 0.9)`,
              background: 'linear-gradient(135deg, rgba(34,197,94,0.95) 0%, rgba(74,222,128,0.95) 100%)',
              fontWeight: 900,
              cursor: 'pointer'
            }}
          >
            {loading ? '...' : 'وضعه كمكتمل'}
          </button>
        </div>
      ) : null}

      {/* Rating */}
      {showRate ? (
        <div style={{ background: ds.color.bgElevated, border: `1px solid ${ds.color.border}`, borderRadius: ds.radius.lg, padding: 14 }}>
          <div style={{ ...text.h2, color: ds.color.text }}>تقييم الخدمة</div>
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            style={{ marginTop: 10, width: '100%', padding: '10px 12px', borderRadius: 12, border: `1px solid ${ds.color.border}` }}
          >
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <textarea
            value={ratingComment}
            onChange={(e) => setRatingComment(e.target.value)}
            placeholder="ملاحظاتك (اختياري)"
            rows={3}
            style={{
              marginTop: 10,
              width: '100%',
              padding: '10px 12px',
              borderRadius: 12,
              border: `1px solid ${ds.color.border}`
            }}
          />
          <button
            disabled={loading}
            onClick={async () => {
              try {
                await postJson(`/api/maintenance/requests/${props.requestId}/rating`, {
                  rating,
                  ratingComment
                })
                window.location.reload()
              } catch (e: any) {
                alert(e.message || 'حدث خطأ')
              }
            }}
            style={{
              marginTop: 10,
              padding: '10px 12px',
              borderRadius: 12,
              border: `1px solid rgba(219, 234, 254, 0.6)`,
              background: ds.color.surface,
              fontWeight: 900,
              cursor: 'pointer'
            }}
          >
            {loading ? '...' : 'حفظ التقييم'}
          </button>
        </div>
      ) : null}
    </div>
  )
}
