-- Admin Cookie Pool table for Supabase persistence
-- Run this in your Supabase SQL editor or migration pipeline.

create extension if not exists pgcrypto;

create table if not exists public.admin_cookie_pool (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  cookie text not null,
  label text,
  status text not null default 'healthy' check (status in ('healthy', 'cooldown', 'expired', 'disabled')),
  tier text not null default 'public' check (tier in ('public', 'private')),
  last_used_at timestamptz,
  use_count integer not null default 0,
  success_count integer not null default 0,
  error_count integer not null default 0,
  last_error text,
  cooldown_until timestamptz,
  max_uses_per_hour integer not null default 60,
  enabled boolean not null default true,
  note text,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_cookie_pool_platform_idx on public.admin_cookie_pool (platform);
create index if not exists admin_cookie_pool_platform_tier_idx on public.admin_cookie_pool (platform, tier);
create index if not exists admin_cookie_pool_enabled_idx on public.admin_cookie_pool (enabled);
