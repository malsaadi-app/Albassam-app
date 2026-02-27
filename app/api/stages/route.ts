import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const stages = await prisma.stage.findMany({
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      },
      orderBy: [
        { branch: { name: 'asc' } },
        { name: 'asc' }
      ]
    });

    return NextResponse.json({ 
      stages,
      count: stages.length
    });
  } catch (error) {
    console.error('Error fetching stages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stages' },
      { status: 500 }
    );
  }
}
