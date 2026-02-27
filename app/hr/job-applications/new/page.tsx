import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'
import JobApplicationFormClient from './ui'

export const dynamic = 'force-dynamic'

export default async function NewJobApplicationPage(props: {
  searchParams: Promise<{ department?: string; positionId?: string }>
}) {
  const session = await getSession(await cookies())
  if (!session.user) redirect('/auth/login')

  if (session.user.role !== 'ADMIN' && session.user.role !== 'HR_EMPLOYEE') {
    redirect('/dashboard')
  }

  const sp = await props.searchParams
  const departments = await prisma.departmentHeadcount.findMany({
    select: { department: true },
    orderBy: { department: 'asc' },
  })

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      <JobApplicationFormClient
        initialDepartment={(sp.department ?? '').trim()}
        initialPositionId={(sp.positionId ?? '').trim()}
        departments={departments.map((d) => d.department)}
      />
    </div>
  )
}
