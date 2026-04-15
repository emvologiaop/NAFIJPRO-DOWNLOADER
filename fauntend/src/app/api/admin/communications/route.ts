import { NextRequest, NextResponse } from 'next/server';

function verifyAdminPassword(request: NextRequest): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();
  if (!adminPassword) return false;

  const authHeader = request.headers.get('authorization') || '';
  const providedPassword = authHeader.replace('Bearer ', '').trim();
  return providedPassword === adminPassword;
}

/**
 * GET /api/admin/communications
 * Get all communications (announcements, banners, etc.)
 */
export async function GET(request: NextRequest) {
  try {
    if (!verifyAdminPassword(request)) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      data: {
        announcements: [],
        banners: [],
        compact: [],
        push: [],
        pushSubscriberCount: 0,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
