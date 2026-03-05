import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  // TODO: implement: return available coverage scopes + branches
  return NextResponse.json({ scopes: ['BRANCH','MULTI_BRANCH','ALL'], branches: [] });
}

export async function POST(req: Request) {
  // TODO: persist coverageScope for a given assignment
  const body = await req.json();
  // validate body, save to DB
  return NextResponse.json({ ok: true, body });
}
