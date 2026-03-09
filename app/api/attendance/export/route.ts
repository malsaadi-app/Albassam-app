import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { hasPermission, getAccessibleEmployees } from '@/lib/permissions-server';
import * as XLSX from 'xlsx';

// GET /api/attendance/export - Export attendance records to Excel
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(await cookies());

    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // Check permission
    if (!hasPermission(session.user, 'attendance.export') && !hasPermission(session.user, 'attendance.view')) {
      return NextResponse.json({ error: 'ليس لديك صلاحية تصدير التقارير' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    const branchId = searchParams.get('branchId');

    // Determine accessible user IDs
    let accessibleUserIds: string[] = [];
    
    if (hasPermission(session.user, 'attendance.view')) {
      // Global view
      const allEmployees = await prisma.employee.findMany({
        where: { status: 'ACTIVE' },
        select: { userId: true }
      });
      accessibleUserIds = allEmployees.map(e => e.userId).filter(Boolean) as string[];
    } else if (hasPermission(session.user, 'attendance.view_team')) {
      // Team view
      const accessibleEmployees = await getAccessibleEmployees(session.user, 'attendance.view', 'attendance.view_team');
      if (accessibleEmployees.length > 0) {
        const employees = await prisma.employee.findMany({
          where: { id: { in: accessibleEmployees } },
          select: { userId: true }
        });
        accessibleUserIds = employees.map(e => e.userId).filter(Boolean) as string[];
      }
    } else {
      accessibleUserIds = [session.user.id];
    }

    // Build query
    const where: any = {
      userId: { in: accessibleUserIds }
    };

    if (startDate) {
      where.date = { ...where.date, gte: new Date(startDate) };
    }
    if (endDate) {
      where.date = { ...where.date, lte: new Date(endDate) };
    }
    if (status) {
      where.status = status;
    }
    if (branchId) {
      where.branchId = branchId;
    }

    // Fetch records
    const records = await prisma.attendanceRecord.findMany({
      where,
      include: {
        user: {
          select: {
            username: true,
            displayName: true,
            employee: {
              select: {
                fullNameAr: true,
                employeeNumber: true,
                position: true
              }
            }
          }
        },
        branch: {
          select: {
            name: true
          }
        }
      },
      orderBy: [{ date: 'desc' }, { checkIn: 'desc' }]
    });

    // Prepare data for Excel
    const data = records.map(record => ({
      'التاريخ': new Date(record.date).toLocaleDateString('ar-SA'),
      'اسم الموظف': record.user.employee?.fullNameAr || record.user.displayName || record.user.username,
      'رقم الموظف': record.user.employee?.employeeNumber || '-',
      'المسمى الوظيفي': record.user.employee?.position || '-',
      'الفرع': record.branch?.name || '-',
      'وقت الدخول': new Date(record.checkIn).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      'وقت الخروج': record.checkOut ? new Date(record.checkOut).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : 'لم يسجل',
      'ساعات العمل': record.workHours ? `${record.workHours.toFixed(2)}` : '-',
      'دقائق التأخير': record.minutesLate > 0 ? record.minutesLate : 0,
      'الحالة': record.status === 'PRESENT' ? 'حاضر' : record.status === 'LATE' ? 'متأخر' : record.status === 'ABSENT' ? 'غائب' : record.status,
      'الموقع': record.latitude && record.longitude ? `${record.latitude}, ${record.longitude}` : '-'
    }));

    // Create workbook
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'الحضور');

    // Set column widths
    worksheet['!cols'] = [
      { wch: 15 }, // التاريخ
      { wch: 25 }, // اسم الموظف
      { wch: 15 }, // رقم الموظف
      { wch: 20 }, // المسمى
      { wch: 20 }, // الفرع
      { wch: 12 }, // وقت الدخول
      { wch: 12 }, // وقت الخروج
      { wch: 12 }, // ساعات العمل
      { wch: 12 }, // دقائق التأخير
      { wch: 10 }, // الحالة
      { wch: 30 }  // الموقع
    ];

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Generate filename
    const filename = `تقرير-الحضور-${new Date().toISOString().split('T')[0]}.xlsx`;

    // Return as downloadable file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`
      }
    });
  } catch (error) {
    console.error('Error exporting attendance:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء تصدير التقرير' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
