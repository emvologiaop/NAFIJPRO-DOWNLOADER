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

const DEFAULT_SYSTEM_CONFIG = {
  site_name: 'DownAria',
  site_description: 'Social Media Video Downloader',
  discord_webhook_url: '',
  maintenance_details: '',
  maintenance_estimated_end: '',
};

export async function GET(request: NextRequest) {
  if (!verifyAdminPassword(request)) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  try {
    if (!supabase) {
      console.error('[SystemConfig] Supabase client not initialized');
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { data, error } = await supabase
      .from('system_config')
      .select('*')
      .eq('id', 'default')
      .single();

    if (error) {
      // PGRST116 means "not found", which is expected if config hasn't been set yet
      if (error.code === 'PGRST116') {
        console.log('[SystemConfig] Config not found, using defaults');
        return NextResponse.json({ success: true, data: DEFAULT_SYSTEM_CONFIG });
      }

      console.error('[SystemConfig] Database error:', error);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: data || DEFAULT_SYSTEM_CONFIG });
  } catch (error) {
    console.error('[SystemConfig] GET error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown'}` },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!verifyAdminPassword(request)) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!supabase) {
      console.error('[SystemConfig] Supabase client not initialized');
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const { data, error } = await supabase
      .from('system_config')
      .upsert({ id: 'default', ...body }, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('[SystemConfig] POST error:', error);
      return NextResponse.json(
        { error: `Failed to update config: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('[SystemConfig] Config updated successfully');
    return NextResponse.json({ success: true, message: 'Settings updated', data });
  } catch (error) {
    console.error('[SystemConfig] POST error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown'}` },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!verifyAdminPassword(request)) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!supabase) {
      console.error('[SystemConfig] Supabase client not initialized');
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const { data, error } = await supabase
      .from('system_config')
      .update(body)
      .eq('id', 'default')
      .select()
      .single();

    if (error) {
      console.error('[SystemConfig] PATCH error:', error);
      return NextResponse.json(
        { error: `Failed to patch config: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('[SystemConfig] Config patched successfully');
    return NextResponse.json({ success: true, message: 'Settings patched', data });
  } catch (error) {
    console.error('[SystemConfig] PATCH error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown'}` },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!verifyAdminPassword(request)) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  try {
    if (!supabase) {
      console.error('[SystemConfig] Supabase client not initialized');
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const { data, error } = await supabase
      .from('system_config')
      .update(DEFAULT_SYSTEM_CONFIG)
      .eq('id', 'default')
      .select()
      .single();

    if (error) {
      console.error('[SystemConfig] DELETE error:', error);
      return NextResponse.json(
        { error: `Failed to reset config: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Settings reset to defaults',
      data: data || DEFAULT_SYSTEM_CONFIG
    });
  } catch (error) {
    console.error('[SystemConfig] DELETE error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown'}` },
      { status: 500 }
    );
  }
}

