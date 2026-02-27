import type { CSSProperties } from 'react'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

function badge(status: string) {
  if (status === 'SUBMITTED') return { bg: '#DBEAFE', fg: '#1E40AF', label: 'مستلم' }
  if (status === 'HIRED') return { bg: '#D1FAE5', fg: '#065F46', label: 'تم التوظيف' }
  if (status === 'REJECTED') return { bg: '#FEE2E2', fg: '#991B1B', label: 'مرفوض' }
  if (status === 'INTERVIEW') return { bg: '#FEF3C7', fg: '#92400E', label: 'مقابلة' }
  if (status === 'OFFERED') return { bg: '#E0E7FF', fg: '#3730A3', label: 'عرض' }
  return { bg: '#F3F4F6', fg: '#1F2937', label: status }
}

export default async function JobApplicationsPage(props: {
  searchParams: Promise<{ department?: string; status?: string }>
}) {
  const session = await getSession(await cookies())
  if (!session.user) redirect('/auth/login')

  if (session.user.role !== 'ADMIN' && session.user.role !== 'HR_EMPLOYEE') {
    redirect('/dashboard')
  }

  const sp = await props.searchParams
  const department = (sp.department ?? '').trim()
  const status = (sp.status ?? '').trim()

  const where: any = {}
  if (department) where.department = department
  if (status) where.status = status

  const [applications, departments] = await Promise.all([
    prisma.jobApplication.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        position: { select: { id: true, code: true, title: true, department: true, level: true } },
        createdByUser: { select: { fullNameAr: true, employeeNumber: true } },
      },
    }),
    prisma.departmentHeadcount.findMany({ select: { department: true }, orderBy: { department: 'asc' } }),
  ])

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      {/* Header */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #E5E7EB',
        position: 'sticky',
        top: 0,
        zIndex: 40
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#111827', marginBottom: '0.25rem' }}>
                طلبات التوظيف
              </h1>
              <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                الرئيسية / الموارد البشرية / طلبات التوظيف
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link 
                href="/hr/job-applications/new"
                style={{
                  background: '#3B82F6',
                  color: 'white',
                  padding: '0.625rem 1rem',
                  borderRadius: '0.5rem',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  transition: 'background 0.2s',
                  display: 'inline-block'
                }}
              >
                ➕ طلب جديد
              </Link>
              <Link 
                href="/hr/positions"
                style={{
                  background: 'white',
                  color: '#111827',
                  padding: '0.625rem 1rem',
                  borderRadius: '0.5rem',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  border: '1px solid #E5E7EB',
                  transition: 'all 0.2s',
                  display: 'inline-block'
                }}
              >
                💼 الوظائف
              </Link>
              <Link 
                href="/hr/dashboard"
                style={{
                  background: 'white',
                  color: '#111827',
                  padding: '0.625rem 1rem',
                  borderRadius: '0.5rem',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  border: '1px solid #E5E7EB',
                  transition: 'all 0.2s',
                  display: 'inline-block'
                }}
              >
                📊 HR
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Filters */}
        <div style={{
          background: 'white',
          border: '1px solid #E5E7EB',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>فلترة</h2>
          <form method="GET" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                القسم
              </label>
              <select 
                name="department" 
                defaultValue={department}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  border: '1px solid #D1D5DB',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  background: 'white'
                }}
              >
                <option value="">كل الأقسام</option>
                {departments.map((d) => (
                  <option key={d.department} value={d.department}>
                    {d.department}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                الحالة
              </label>
              <select 
                name="status" 
                defaultValue={status}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  border: '1px solid #D1D5DB',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  background: 'white'
                }}
              >
                <option value="">كل الحالات</option>
                <option value="SUBMITTED">مستلم</option>
                <option value="INTERVIEW">مقابلة</option>
                <option value="OFFERED">عرض</option>
                <option value="HIRED">تم التوظيف</option>
                <option value="REJECTED">مرفوض</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button 
                type="submit"
                style={{
                  width: '100%',
                  background: '#3B82F6',
                  color: 'white',
                  padding: '0.625rem 1rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                تطبيق
              </button>
            </div>
          </form>
        </div>

        {/* Applications Table */}
        <div style={{
          background: 'white',
          border: '1px solid #E5E7EB',
          borderRadius: '0.75rem',
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#F9FAFB' }}>
                <tr>
                  {['رقم الطلب', 'المتقدم', 'القسم', 'الوظيفة', 'الحالة', 'المنشئ', 'التاريخ'].map((h) => (
                    <th key={h} style={{ 
                      textAlign: 'right', 
                      padding: '0.75rem 1.5rem', 
                      fontSize: '0.75rem', 
                      fontWeight: '600', 
                      color: '#6B7280', 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.05em',
                      whiteSpace: 'nowrap'
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#9CA3AF' }}>
                      لا يوجد طلبات.
                    </td>
                  </tr>
                ) : (
                  applications.map((a) => {
                    const b = badge(a.status)
                    return (
                      <tr key={a.id} style={{ borderTop: '1px solid #E5E7EB' }}>
                        <td style={{ padding: '1rem 1.5rem', fontWeight: '600', whiteSpace: 'nowrap', color: '#111827' }}>{a.applicationNumber}</td>
                        <td style={{ padding: '1rem 1.5rem', color: '#111827' }}>{a.applicantName}</td>
                        <td style={{ padding: '1rem 1.5rem', color: '#6B7280' }}>{a.department}</td>
                        <td style={{ padding: '1rem 1.5rem', color: '#6B7280' }}>
                          {a.position ? `${a.position.title} (${a.position.code})` : '—'}
                        </td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <span style={{ 
                            display: 'inline-flex', 
                            padding: '6px 12px', 
                            borderRadius: '9999px', 
                            background: b.bg, 
                            color: b.fg, 
                            fontSize: '12px', 
                            fontWeight: '600'
                          }}>
                            {b.label}
                          </span>
                        </td>
                        <td style={{ padding: '1rem 1.5rem', color: '#6B7280' }}>{a.createdByUser?.fullNameAr ?? '—'}</td>
                        <td style={{ padding: '1rem 1.5rem', color: '#6B7280', whiteSpace: 'nowrap' }}>
                          {new Date(a.createdAt).toLocaleDateString('en-US')}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
