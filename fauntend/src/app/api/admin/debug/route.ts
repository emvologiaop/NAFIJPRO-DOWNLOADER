import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/admin/debug
 * Debug endpoint to check admin configuration and database
 */
export async function GET(request: NextRequest) {
  const debugToken = request.nextUrl.searchParams.get('token');

  // Only allow debug token or localhost in dev
  if (debugToken !== process.env.DEBUG_TOKEN && process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Unauthorized - provide ?token=<DEBUG_TOKEN>' },
      { status: 401 }
    );
  }

  try {
    const adminPassword = process.env.ADMIN_PASSWORD;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Test Supabase connection
    let supabaseConnected = false;
    let usersCount = 0;
    let adminCount = 0;
    let supabaseError = null;

    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
          auth: { persistSession: false, autoRefreshToken: false }
        });

        // Test query
        const { data: users, error } = await supabase
          .from('users')
          .select('role', { count: 'exact' });

        if (!error) {
          supabaseConnected = true;
          usersCount = users?.length || 0;
          adminCount = users?.filter(u => u.role === 'admin').length || 0;
        } else {
          supabaseError = error.message;
        }
      } catch (err) {
        supabaseError = err instanceof Error ? err.message : 'Connection failed';
      }
    }

    return NextResponse.json({
      status: 'ok',
      environment: {
        nodeEnv: process.env.NODE_ENV,
        adminPasswordSet: !!adminPassword,
        adminPasswordLength: adminPassword?.length || 0,
        debugTokenSet: !!process.env.DEBUG_TOKEN,
      },
      supabase: {
        configured: !!(supabaseUrl && supabaseServiceKey),
        connected: supabaseConnected,
        usersCount,
        adminCount,
        error: supabaseError,
      },
      password: {
        length: adminPassword?.length || 0,
        firstChars: adminPassword ? adminPassword.slice(0, 3) : 'N/A',
        trimmedLength: adminPassword?.trim().length || 0,
        hasWhitespace: adminPassword !== adminPassword?.trim(),
      },
      endpoints: {
        users: '/api/admin/users',
        referrals: '/api/admin/referrals',
        session: '/api/admin/session',
        debug: '/api/admin/debug?token=<DEBUG_TOKEN>',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
