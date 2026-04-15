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
    data: {
      id: 'default',
      alertErrorSpike: true,
      alertCookieLow: true,
      alertPlatformDown: true,
      alertRateLimit: false,
      errorSpikeThreshold: 10,
      errorSpikeWindow: 60,
      cookieLowThreshold: 20,
      platformDownThreshold: 5,
      rateLimitThreshold: 100,
      cooldownMinutes: 30,
      lastAlertAt: null,
      lastAlertType: null,
      notifyEmail: false,
      notifyDiscord: false,
      discordWebhookUrl: null,
      emailRecipients: null,
      healthCheckEnabled: true,
      healthCheckInterval: 300,
      lastHealthCheckAt: null,
    },
  });
}

export async function PUT(request: NextRequest) {
  if (!verifyAdminPassword(request)) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }
  const body = await request.json();
  return NextResponse.json({ success: true, message: 'Alerts updated', data: body });
}

export async function POST(request: NextRequest) {
  if (!verifyAdminPassword(request)) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }
  const body = await request.json();
  return NextResponse.json({ success: true, message: 'Alert action completed', data: body });
}
