import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminPassword } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  if (!verifyAdminPassword(request)) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const days = searchParams.get('days') || '7';

  return NextResponse.json({
    success: true,
    data: {
      period: `Last ${days} days`,
      totalRequests: 0,
      successCount: 0,
      errorCount: 0,
      avgResponseTime: 0,
      topPlatforms: [],
      topErrors: [],
    },
  });
}
