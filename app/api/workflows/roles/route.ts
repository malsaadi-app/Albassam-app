import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const roles = await prisma.workflowRole.findMany({
      orderBy: [
        { level: 'asc' },
        { nameAr: 'asc' }
      ]
    });

    return NextResponse.json({ 
      roles,
      count: roles.length
    });
  } catch (error) {
    console.error('Error fetching workflow roles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow roles' },
      { status: 500 }
    );
  }
}
