import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminPassword } from '@/lib/admin-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

const TABLE_NAME = 'admin_cookie_pool';

function normalizeCookie(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    platform: String(row.platform || ''),
    cookie: String(row.cookie || ''),
    cookiePreview: typeof row.cookie === 'string' ? `${row.cookie.slice(0, 16)}...` : '',
    label: (row.label as string | null) ?? null,
    status: (row.status as 'healthy' | 'cooldown' | 'expired' | 'disabled') || 'healthy',
    tier: (row.tier as 'public' | 'private') || 'public',
    last_used_at: (row.last_used_at as string | null) ?? null,
    use_count: Number(row.use_count || 0),
    success_count: Number(row.success_count || 0),
    error_count: Number(row.error_count || 0),
    last_error: (row.last_error as string | null) ?? null,
    cooldown_until: (row.cooldown_until as string | null) ?? null,
    max_uses_per_hour: Number(row.max_uses_per_hour || 60),
    enabled: Boolean(row.enabled ?? true),
    note: (row.note as string | null) ?? null,
    created_at: String(row.created_at || new Date().toISOString()),
    updated_at: String(row.updated_at || new Date().toISOString()),
    user_id: (row.user_id as string | undefined) ?? undefined,
  };
}

function buildStats(rows: Array<Record<string, unknown>>) {
  const statsMap = new Map<string, {
    platform: string;
    tier: 'public' | 'private';
    total: number;
    enabled_count: number;
    healthy_count: number;
    cooldown_count: number;
    expired_count: number;
    disabled_count: number;
    total_uses: number;
    total_success: number;
    total_errors: number;
  }>();

  for (const row of rows) {
    const platform = String(row.platform || 'unknown');
    const tier = (row.tier as 'public' | 'private') || 'public';
    const key = `${platform}:${tier}`;

    if (!statsMap.has(key)) {
      statsMap.set(key, {
        platform,
        tier,
        total: 0,
        enabled_count: 0,
        healthy_count: 0,
        cooldown_count: 0,
        expired_count: 0,
        disabled_count: 0,
        total_uses: 0,
        total_success: 0,
        total_errors: 0,
      });
    }

    const stat = statsMap.get(key)!;
    stat.total += 1;
    stat.total_uses += Number(row.use_count || 0);
    stat.total_success += Number(row.success_count || 0);
    stat.total_errors += Number(row.error_count || 0);

    if (row.enabled !== false) stat.enabled_count += 1;

    switch (row.status) {
      case 'healthy':
        stat.healthy_count += 1;
        break;
      case 'cooldown':
        stat.cooldown_count += 1;
        break;
      case 'expired':
        stat.expired_count += 1;
        break;
      case 'disabled':
        stat.disabled_count += 1;
        break;
      default:
        stat.healthy_count += 1;
        break;
    }
  }

  return Array.from(statsMap.values());
}

export async function GET(request: NextRequest) {
  if (!verifyAdminPassword(request)) {
    return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
  }

  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform');
  const tier = searchParams.get('tier');
  const stats = searchParams.has('stats');

  let query = supabase.from(TABLE_NAME).select('*').order('created_at', { ascending: false });

  if (platform) {
    query = query.eq('platform', platform);
  }

  if (tier && tier !== 'all') {
    query = query.eq('tier', tier);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ success: false, error: `Database error: ${error.message}` }, { status: 500 });
  }

  const rows = (data || []) as Array<Record<string, unknown>>;

  if (stats) {
    return NextResponse.json({ success: true, data: buildStats(rows) });
  }

  return NextResponse.json({ success: true, data: rows.map(normalizeCookie) });
}

export async function POST(request: NextRequest) {
  if (!verifyAdminPassword(request)) {
    return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
  }

  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const row = {
      platform: body.platform,
      cookie: body.cookie,
      label: body.label || null,
      status: body.status || 'healthy',
      tier: body.tier || 'public',
      last_used_at: body.last_used_at || null,
      use_count: body.use_count ?? 0,
      success_count: body.success_count ?? 0,
      error_count: body.error_count ?? 0,
      last_error: body.last_error || null,
      cooldown_until: body.cooldown_until || null,
      max_uses_per_hour: body.max_uses_per_hour ?? 60,
      enabled: body.enabled ?? true,
      note: body.note || null,
      user_id: body.user_id || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert(row)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: `Failed to add cookie: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: normalizeCookie(data as Record<string, unknown>) });
  } catch (error) {
    return NextResponse.json({ success: false, error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown'}` }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!verifyAdminPassword(request)) {
    return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
  }

  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: `Failed to update cookie: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: normalizeCookie(data as Record<string, unknown>) });
  } catch (error) {
    return NextResponse.json({ success: false, error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown'}` }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!verifyAdminPassword(request)) {
    return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
  }

  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
  }

  const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);

  if (error) {
    return NextResponse.json({ success: false, error: `Failed to delete cookie: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: { message: 'Cookie deleted successfully' } });
}
