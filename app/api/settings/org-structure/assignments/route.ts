import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    // expected: { assignmentId, coverageScope, coverageBranchIds }
    const { assignmentId, coverageScope, coverageBranchIds } = body;
    if (!assignmentId) return NextResponse.json({ error: 'assignmentId required' }, { status: 400 });

    const updated = await prisma.orgUnitAssignment.update({
      where: { id: assignmentId },
      data: {
        coverageScope,
        coverageBranchIds: coverageBranchIds ? JSON.stringify(coverageBranchIds) : null,
      }
    });

    return NextResponse.json({ ok: true, updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
