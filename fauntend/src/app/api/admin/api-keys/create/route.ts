import { NextRequest, NextResponse } from 'next/server';

function verifyAdminPassword(request: NextRequest): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();
  if (!adminPassword) return false;
  const authHeader = request.headers.get('authorization') || '';
  const providedPassword = authHeader.replace('Bearer ', '').trim();
  return providedPassword === adminPassword;
}

export async function POST(request: NextRequest) {
  if (!verifyAdminPassword(request)) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }
  const body = await request.json();
  const keyId = Math.random().toString(36).substring(2, 10);
  return NextResponse.json({
    success: true,
    data: {
      id: keyId,
      key: `sk_${keyId}_${Math.random().toString(36).substring(2)}`,
      preview: `sk_${keyId}_...`,
      name: body.name,
    },
  });
}
