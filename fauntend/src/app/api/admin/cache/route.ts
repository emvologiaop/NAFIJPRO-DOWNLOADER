import { NextRequest, NextResponse } from 'next/server';

function verifyAdminPassword(request: NextRequest): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();
  if (!adminPassword) return false;
  const authHeader = request.headers.get('authorization') || '';
  const providedPassword = authHeader.replace('Bearer ', '').trim();
  return providedPassword === adminPassword;
}

export async function DELETE(request: NextRequest) {
  if (!verifyAdminPassword(request)) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }
  return NextResponse.json({
    success: true,
    message: 'Cache cleared',
    cleared: { total: 0 },
  });
}
