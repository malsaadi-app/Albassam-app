import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const startTime = process.uptime();
  
  try {
    // Test database connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      status: 'ok',
      database: true,
      timestamp: new Date().toISOString(),
      uptime: startTime
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      status: 'error',
      database: false,
      timestamp: new Date().toISOString(),
      uptime: startTime,
      error: 'Database connection failed'
    }, { status: 500 });
  }
}
