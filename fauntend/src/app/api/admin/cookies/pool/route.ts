import { NextRequest, NextResponse } from 'next/server';

function verifyAdminPassword(request: NextRequest): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();
  if (!adminPassword) return false;
  const authHeader = request.headers.get('authorization') || '';
  const providedPassword = authHeader.replace('Bearer ', '').trim();
  return providedPassword === adminPassword;
}

export async function GET(request: NextRequest) {
  if (!verifyAdminPassword(request)) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }
  return NextResponse.json({
    success: true,
    data: [],
    totalTiers: 0,
  });
}

export async function POST(request: NextRequest) {
  if (!verifyAdminPassword(request)) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }
  const body = await request.json();
  return NextResponse.json({ success: true, message: 'Tier created', data: body });
}

export async function PATCH(request: NextRequest) {
  if (!verifyAdminPassword(request)) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }
  const body = await request.json();
  return NextResponse.json({ success: true, message: 'Tier updated', data: body });
}

export async function DELETE(request: NextRequest) {
  if (!verifyAdminPassword(request)) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const tierId = searchParams.get('id');
  return NextResponse.json({ success: true, message: `Tier ${tierId} deleted` });
}
