import type { CSSProperties } from 'react'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'
import { saveApprovalDocument } from '@/lib/approvalUploads'
import { ds, mergeStyles, text } from '@/lib/ui/ds'

export const dynamic = 'force-dynamic'

function inputStyle(): CSSProperties {
  return {
    width: '100%',
    borderRadius: 12,
    border: `1px solid ${ds.color.border}`,
    background: ds.color.surface,
    padding: '11px 12px',
    color: ds.color.text,
    outline: 'none',
  }
}

async function createHeadcountRequest(formData: FormData) {
  'use server'

  const session = await getSession(await cookies())
  if (!session.user) redirect('/auth/login')

  if (session.user.role !== 'ADMIN' && session.user.role !== 'HR_EMPLOYEE') {
    redirect('/hr/headcount/request?error=forbidden')
  }

  const requester = await prisma.employee.findUnique({ where: { userId: session.user.id } })
  if (!requester) redirect('/hr/headcount/request?error=no_employee')

  const department = String(formData.get('department') ?? '').trim()
  const requestType = String(formData.get('requestType') ?? '').trim()
  const requestedCountRaw = String(formData.get('requestedCount') ?? '').trim()
  const justification = String(formData.get('justification') ?? '').trim()
  const file = formData.get('approvalDocument') as File | null

  if (!department || !requestedCountRaw || !justification || !requestType) {
    redirect(`/hr/headcount/request?error=missing_fields&department=${encodeURIComponent(department)}`)
  }

  if (!file || !file.name) {
    redirect(`/hr/headcount/request?error=missing_file&department=${encodeURIComponent(department)}`)
  }

  const requestedCount = Number(requestedCountRaw)
  if (!Number.isFinite(requestedCount) || requestedCount < 0) {
    redirect(`/hr/headcount/request?error=bad_requested_count&department=${encodeURIComponent(department)}`)
  }

  const headcount = await prisma.departmentHeadcount.findUnique({ where: { department } })
  const employeesCount = await prisma.employee.count({ where: { department } })
  const currentCount = headcount?.currentCount ?? employeesCount
  const approvedCount = headcount?.approvedCount ?? currentCount

  // Validate against APPROVED count, not current employee count
  if (requestType === 'INCREASE' && requestedCount <= approvedCount) {
    redirect(`/hr/headcount/request?error=must_increase&department=${encodeURIComponent(department)}&type=INCREASE`)
  }
  if (requestType === 'DECREASE' && requestedCount >= approvedCount) {
    redirect(`/hr/headcount/request?error=must_decrease&department=${encodeURIComponent(department)}&type=DECREASE`)
  }

  const departmentHeadcount =
    headcount ??
    (await prisma.departmentHeadcount.create({
      data: {
        department,
        approvedCount: currentCount,
        currentCount,
        notes: 'Auto-created during request',
      },
    }))

  const saved = await saveApprovalDocument(file)

  const year = new Date().getFullYear()
  const count = await prisma.headcountChangeRequest.count({
    where: {
      requestedAt: {
        gte: new Date(`${year}-01-01T00:00:00.000Z`),
        lt: new Date(`${year + 1}-01-01T00:00:00.000Z`),
      },
    },
  })

  const requestNumber = `HCR-${year}-${String(count + 1).padStart(3, '0')}`

  await prisma.headcountChangeRequest.create({
    data: {
      requestNumber,
      department,
      departmentHeadcountId: departmentHeadcount.id,
      requestType,
      currentCount: approvedCount, // Store approved count for reference
      requestedCount,
      changeAmount: requestedCount - approvedCount, // Change from approved, not current employees
      justification,
      approvalDocument: saved.urlPath,
      requestedBy: requester.id,
      status: 'PENDING',
    },
  })

  redirect(`/hr/headcount?ok=request_created&requestNumber=${encodeURIComponent(requestNumber)}`)
}

export default async function HeadcountRequestPage(props: {
  searchParams: Promise<{ department?: string; type?: string; error?: string }>
}) {
  const session = await getSession(await cookies())
  if (!session.user) redirect('/auth/login')

  const sp = await props.searchParams
  const departmentParam = (sp.department ?? '').trim()
  const typeParam = (sp.type ?? '').trim() || 'INCREASE'
  const error = (sp.error ?? '').trim()

  const departments = await prisma.departmentHeadcount.findMany({
    select: { department: true },
    orderBy: { department: 'asc' },
  })

  const dept = departmentParam || departments[0]?.department || ''

  const [headcountRow, employeesCount] = await Promise.all([
    dept ? prisma.departmentHeadcount.findUnique({ where: { department: dept } }) : Promise.resolve(null),
    dept ? prisma.employee.count({ where: { department: dept } }) : Promise.resolve(0),
  ])

  const approvedCount = headcountRow?.approvedCount ?? employeesCount
  const currentCount = headcountRow?.currentCount ?? employeesCount

  const pageBg: CSSProperties = {
    minHeight: '100vh',
    background: ds.color.bg,
    fontFamily: ds.font.sans,
    color: ds.color.text,
  }

  const container: CSSProperties = {
    maxWidth: '1000px',
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

  return (
    <div dir="rtl" style={pageBg}>
      <div style={container}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
          <div>
            <div style={mergeStyles(text.display, { margin: 0 })}>طلب تغيير الكادر</div>
            <div style={mergeStyles(text.body, { color: ds.color.muted, marginTop: 6 })}>
              إنشاء طلب (HeadcountChangeRequest) مع مستند اعتماد إلزامي.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href="/hr/headcount" style={btnBase}>
              ← الرجوع
            </Link>
          </div>
        </div>

        {error && (
          <div style={mergeStyles(card, { padding: 12, marginBottom: 12, borderColor: 'rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.10)', color: ds.color.danger, fontWeight: 900 })}>
            حدث خطأ: {error}
          </div>
        )}

        <div style={mergeStyles(card, { padding: 14, marginBottom: 14 })}>
          <div style={mergeStyles(text.h2, { marginBottom: 10 })}>ملخص القسم</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
            {[{ label: 'الكادر المعتمد', value: approvedCount }, { label: 'العدد الحالي', value: currentCount }].map((x, i) => (
              <div key={i} style={{ border: `1px solid ${ds.color.border}`, borderRadius: 14, padding: 12, background: ds.color.surface2 }}>
                <div style={mergeStyles(text.small, { color: ds.color.muted })}>{x.label}</div>
                <div style={mergeStyles(text.h2, { marginTop: 6 })}>{new Intl.NumberFormat('en-US').format(x.value)}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={mergeStyles(card, { padding: 14 })}>
          <form action={createHeadcountRequest} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            <div>
              <div style={mergeStyles(text.small, { color: ds.color.muted, marginBottom: 6 })}>القسم *</div>
              <select name="department" defaultValue={dept} style={inputStyle() as any} required>
                {departments.map((d) => (
                  <option key={d.department} value={d.department}>
                    {d.department}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div style={mergeStyles(text.small, { color: ds.color.muted, marginBottom: 6 })}>نوع الطلب *</div>
              <select name="requestType" defaultValue={typeParam} style={inputStyle() as any} required>
                <option value="INCREASE">زيادة</option>
                <option value="DECREASE">تخفيض</option>
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <div style={mergeStyles(text.small, { color: ds.color.muted, marginBottom: 6 })}>الكادر المطلوب (الرقم الجديد) *</div>
              <input name="requestedCount" type="number" min="0" step="1" style={inputStyle()} required />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <div style={mergeStyles(text.small, { color: ds.color.muted, marginBottom: 6 })}>مبرر التغيير *</div>
              <textarea name="justification" rows={5} required style={mergeStyles(inputStyle(), { resize: 'vertical' })} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <div style={mergeStyles(text.small, { color: ds.color.muted, marginBottom: 6 })}>مستند الاعتماد (PDF / JPG / PNG) *</div>
              <input name="approvalDocument" type="file" accept="application/pdf,image/jpeg,image/png" required style={inputStyle()} />
              <div style={mergeStyles(text.small, { color: ds.color.muted, marginTop: 6 })}>
                سيتم حفظ الملف في: <code>/uploads/approvals/</code>
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="submit"
                style={mergeStyles(
                  {
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    minHeight: 46,
                    padding: '10px 16px',
                    borderRadius: 12,
                    fontWeight: 900,
                    fontSize: 13,
                    border: '1px solid rgba(0,0,0,0.06)',
                    cursor: 'pointer',
                  },
                  btnPrimary
                )}
              >
                إرسال الطلب
              </button>

              <Link href="/hr/headcount" style={btnBase}>
                إلغاء
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
