import type { CSSProperties } from 'react'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'
import { ds, mergeStyles, text } from '@/lib/ui/ds'

export const dynamic = 'force-dynamic'

function formatNumber(n: number) {
  return new Intl.NumberFormat('en-US').format(n)
}

function fullnessPill(available: number) {
  if (available <= 0) return { label: 'ممتلئ', bg: 'rgba(239,68,68,0.14)', fg: ds.color.danger }
  if (available <= 2) return { label: 'قريب من الامتلاء', bg: 'rgba(245,158,11,0.14)', fg: ds.color.warning }
  return { label: 'متاح', bg: 'rgba(16,185,129,0.14)', fg: ds.color.success }
}

async function reviewHeadcountChangeRequest(formData: FormData) {
  'use server'

  const session = await getSession(await cookies())
  if (!session.user) redirect('/auth/login')

  if (session.user.role !== 'ADMIN') redirect('/hr/headcount?error=forbidden')

  const id = Number(formData.get('id'))
  const decision = String(formData.get('decision') ?? '')
  const notes = String(formData.get('notes') ?? '').trim()

  if (!Number.isFinite(id)) redirect('/hr/headcount?error=bad_id')

  const reviewer = await prisma.employee.findUnique({ where: { userId: session.user.id } })
  if (!reviewer) redirect('/hr/headcount?error=no_employee')

  const hcr = await prisma.headcountChangeRequest.findUnique({ where: { id }, include: { departmentHeadcount: true } })
  if (!hcr) redirect('/hr/headcount?error=not_found')

  const now = new Date()
  const append = (prev: string | null, line: string) => {
    const p = (prev ?? '').trim()
    return p ? `${p}\n\n${line}` : line
  }

  if (decision === 'REJECT') {
    await prisma.headcountChangeRequest.update({
      where: { id: hcr.id },
      data: {
        status: 'REJECTED',
        reviewedBy: reviewer.id,
        reviewedAt: now,
        reviewNotes: append(hcr.reviewNotes ?? null, `❌ رفض (ADMIN) — ${now.toISOString()}\n${notes}`.trim()),
      },
    })

    redirect('/hr/headcount?ok=rejected')
  }

  // APPROVE
  await prisma.departmentHeadcount.update({
    where: { id: hcr.departmentHeadcountId },
    data: {
      approvedCount: hcr.requestedCount,
      approvalDocument: hcr.approvalDocument,
      approvedBy: reviewer.id,
      approvedAt: now,
      notes: append(hcr.departmentHeadcount.notes ?? null, `Updated via ${hcr.requestNumber}`),
    },
  })

  await prisma.headcountChangeRequest.update({
    where: { id: hcr.id },
    data: {
      status: 'APPROVED',
      reviewedBy: reviewer.id,
      reviewedAt: now,
      reviewNotes: append(hcr.reviewNotes ?? null, `✅ موافقة (ADMIN) — ${now.toISOString()}\n${notes}`.trim()),
    },
  })

  redirect('/hr/headcount?ok=approved')
}

export default async function HeadcountPage(props: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const session = await getSession(await cookies())
  if (!session.user) redirect('/auth/login')
  const user = session.user

  const sp = await props.searchParams

  const rows = await prisma.departmentHeadcount.findMany({
    orderBy: { department: 'asc' },
  })

  // Computed positions counts
  const departments = rows.map((r) => r.department)
  const positions = await prisma.organizationalPosition.findMany({
    where: { department: { in: departments } },
    select: { department: true, status: true },
  })

  const agg = new Map<string, { open: number; vacant: number; filled: number }>()
  for (const d of departments) agg.set(d, { open: 0, vacant: 0, filled: 0 })

  for (const p of positions) {
    const a = agg.get(p.department)
    if (!a) continue
    if (p.status === 'VACANT') {
      a.vacant++
      a.open++
    }
    if (p.status === 'FILLED') {
      a.filled++
      a.open++
    }
  }

  const pendingRequests = await prisma.headcountChangeRequest.findMany({
    where: { status: 'PENDING' },
    orderBy: { requestedAt: 'desc' },
    take: 10,
    include: {
      requestedByUser: { select: { fullNameAr: true, employeeNumber: true } },
    },
  })

  const pageBg: CSSProperties = {
    minHeight: '100vh',
    background: ds.color.bg,
    fontFamily: ds.font.sans,
    color: ds.color.text,
  }

  const container: CSSProperties = {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: 'clamp(18px, 3.4vw, 36px)',
  }

  const card: CSSProperties = {
    background: ds.color.surface,
    border: `1px solid ${ds.color.border}`,
    borderRadius: ds.radius.lg,
    boxShadow: ds.shadow.sm,
  }

  const btnBase: CSSProperties = {
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
  }

  const btnPrimary: CSSProperties = {
    background: `linear-gradient(135deg, ${ds.color.accent500} 0%, ${ds.color.accent600} 100%)`,
    border: '1px solid rgba(0,0,0,0.06)',
    color: ds.color.brand900,
    boxShadow: ds.shadow.glow,
  }

  const input: CSSProperties = {
    width: '100%',
    borderRadius: 12,
    border: `1px solid ${ds.color.border}`,
    background: ds.color.surface,
    padding: '10px 12px',
    color: ds.color.text,
    outline: 'none',
  }

  return (
    <div dir="rtl" style={pageBg}>
      <div style={container}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
          <div>
            <div style={mergeStyles(text.display, { margin: 0 })}>إدارة الكادر</div>
            <div style={mergeStyles(text.body, { color: ds.color.muted, marginTop: 6 })}>
              مقارنة الكادر المعتمد بالعدد الحالي وإدارة طلبات تغييره.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href="/hr/headcount/request" style={mergeStyles(btnBase, btnPrimary)}>
              ➕ طلب تغيير الكادر
            </Link>
            <Link href="/hr/positions" style={btnBase}>
              💼 الوظائف
            </Link>
            <Link href="/hr/dashboard" style={btnBase}>
              📊 HR
            </Link>
          </div>
        </div>

        {sp.ok && (
          <div style={mergeStyles(card, { padding: 12, marginBottom: 12, borderColor: 'rgba(16,185,129,0.25)', background: 'rgba(16,185,129,0.10)', color: ds.color.success, fontWeight: 900 })}>
            تم تنفيذ العملية بنجاح.
          </div>
        )}
        {sp.error && (
          <div style={mergeStyles(card, { padding: 12, marginBottom: 12, borderColor: 'rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.10)', color: ds.color.danger, fontWeight: 900 })}>
            حدث خطأ: {sp.error}
          </div>
        )}

        <div style={mergeStyles(card, { overflowX: 'auto' as const, marginBottom: 14 })}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: ds.color.surface2 }}>
                {['القسم', 'المعتمد', 'الحالي', 'المتاح', 'الوظائف المفتوحة', 'شواغر', 'الحالة', 'إجراءات'].map((h) => (
                  <th key={h} style={{ textAlign: 'right', padding: 12, borderBottom: `1px solid ${ds.color.border}`, fontSize: 12, fontWeight: 900, color: ds.color.text2, whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 16, color: ds.color.muted }}>
                    لا توجد بيانات.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const available = Math.max(0, r.approvedCount - r.currentCount)
                  const a = agg.get(r.department) ?? { open: 0, vacant: 0, filled: 0 }
                  const pill = fullnessPill(available)

                  return (
                    <tr key={r.id} style={{ borderBottom: `1px solid ${ds.color.border}` }}>
                      <td style={{ padding: 12, fontWeight: 900 }}>{r.department}</td>
                      <td style={{ padding: 12 }}>{formatNumber(r.approvedCount)}</td>
                      <td style={{ padding: 12 }}>{formatNumber(r.currentCount)}</td>
                      <td style={{ padding: 12, fontWeight: 900 }}>{formatNumber(available)}</td>
                      <td style={{ padding: 12 }}>{formatNumber(a.open)}</td>
                      <td style={{ padding: 12 }}>{formatNumber(a.vacant)}</td>
                      <td style={{ padding: 12 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 10px', borderRadius: 999, background: pill.bg, color: pill.fg, fontSize: 12, fontWeight: 900, border: `1px solid ${pill.bg}` }}>{pill.label}</span>
                      </td>
                      <td style={{ padding: 12 }}>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <Link
                            href={`/hr/headcount/request?department=${encodeURIComponent(r.department)}&type=INCREASE`}
                            style={mergeStyles(btnBase, btnPrimary, { minHeight: 34, padding: '7px 10px', fontSize: 12 })}
                          >
                            طلب زيادة
                          </Link>
                          <Link
                            href={`/hr/headcount/request?department=${encodeURIComponent(r.department)}&type=DECREASE`}
                            style={mergeStyles(btnBase, { minHeight: 34, padding: '7px 10px', fontSize: 12 })}
                          >
                            طلب تخفيض
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div style={mergeStyles(card, { padding: 14 })}>
          <div style={mergeStyles(text.h2, { marginBottom: 10 })}>طلبات تغيير الكادر (معلقة)</div>
          {pendingRequests.length === 0 ? (
            <div style={mergeStyles(text.body, { color: ds.color.muted })}>لا يوجد طلبات معلقة.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
              {pendingRequests.map((req) => (
                <div key={req.id} style={{ border: `1px solid ${ds.color.border}`, borderRadius: 14, padding: 12, background: ds.color.surface2 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <div style={mergeStyles(text.h3)}>{req.requestNumber}</div>
                    <span style={{ display: 'inline-flex', padding: '6px 10px', borderRadius: 999, background: 'rgba(245,158,11,0.14)', color: ds.color.warning, fontSize: 12, fontWeight: 900, border: '1px solid rgba(245,158,11,0.20)' }}>
                      ⏳ PENDING
                    </span>
                  </div>

                  <div style={mergeStyles(text.body, { marginTop: 8 })}>
                    <b>القسم:</b> {req.department}
                  </div>
                  <div style={mergeStyles(text.body, { color: ds.color.text2, marginTop: 4 })}>
                    {req.requestType} • {formatNumber(req.currentCount)} → {formatNumber(req.requestedCount)} ({req.changeAmount >= 0 ? '+' : ''}{formatNumber(req.changeAmount)})
                  </div>

                  <div style={mergeStyles(text.small, { color: ds.color.muted, marginTop: 8 })}>
                    مقدم الطلب: {req.requestedByUser?.fullNameAr ?? '—'}
                  </div>

                  <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    <a href={req.approvalDocument} target="_blank" rel="noreferrer" style={mergeStyles(btnBase, { minHeight: 38, padding: '8px 12px', fontSize: 12 })}>
                      📎 مستند الاعتماد
                    </a>

                    {user.role === 'ADMIN' ? (
                      <form action={reviewHeadcountChangeRequest} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <input type="hidden" name="id" value={req.id} />
                        <input name="notes" placeholder="ملاحظة (اختياري)" style={mergeStyles(input, { width: 260 })} />
                        <button name="decision" value="APPROVE" style={mergeStyles(btnBase, btnPrimary, { minHeight: 38, padding: '8px 12px', fontSize: 12 })}>
                          ✅ موافقة
                        </button>
                        <button name="decision" value="REJECT" style={mergeStyles(btnBase, { minHeight: 38, padding: '8px 12px', fontSize: 12, background: 'rgba(239,68,68,0.14)', color: ds.color.danger, borderColor: 'rgba(239,68,68,0.25)' })}>
                          ❌ رفض
                        </button>
                      </form>
                    ) : (
                      <div style={mergeStyles(text.small, { color: ds.color.muted })}>الاعتماد متاح للإدارة فقط.</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
