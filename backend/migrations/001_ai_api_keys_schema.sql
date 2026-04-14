-- Create AI API Keys Extension
-- Enable pgcrypto for encryption
create extension if not exists pgcrypto;

-- Main API Keys Table
create table ai_api_keys (
    id uuid primary key default uuid_generate_v4(),
    provider text not null check (provider in ('groq', 'openai', 'gemini', 'claude', 'azure')),
    api_key_encrypted text not null,
    api_key_hash text not null unique,
    model text not null,
    priority_order integer not null check (priority_order between 1 and 5),
    enabled boolean default true,
    status text not null default 'active' check (status in ('active', 'testing', 'error', 'disabled')),
    last_tested_at timestamp with time zone,
    last_error text,
    error_count integer default 0,
    success_count integer default 0,
    created_by uuid references auth.users(id),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    deleted_at timestamp with time zone
);

-- Audit Log Table
create table ai_api_key_audit (
    id uuid primary key default uuid_generate_v4(),
    key_id uuid references ai_api_keys(id) on delete cascade,
    action text not null check (action in ('created', 'updated', 'tested', 'deleted', 'rotated', 'disabled', 'enabled')),
    provider text,
    performed_by uuid references auth.users(id),
    details jsonb,
    created_at timestamp with time zone default now()
);

-- Provider Usage Tracking
create table ai_provider_usage (
    id uuid primary key default uuid_generate_v4(),
    key_id uuid references ai_api_keys(id) on delete cascade,
    provider text not null,
    total_requests integer default 0,
    success_requests integer default 0,
    failed_requests integer default 0,
    total_tokens integer default 0,
    total_cost_usd numeric default 0,
    last_used_at timestamp with time zone,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Provider Configuration
create table ai_provider_config (
    id uuid primary key default uuid_generate_v4(),
    provider text unique not null check (provider in ('groq', 'openai', 'gemini', 'claude', 'azure')),
    api_endpoint text not null,
    default_model text,
    timeout_seconds integer default 30,
    rate_limit_per_minute integer,
    pricing_input_per_1k numeric,
    pricing_output_per_1k numeric,
    enabled boolean default true,
    updated_by uuid references auth.users(id),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Key Rotation History
create table ai_api_key_rotation_history (
    id uuid primary key default uuid_generate_v4(),
    key_id uuid references ai_api_keys(id) on delete cascade,
    old_key_hash text,
    new_key_hash text,
    reason text,
    rotated_by uuid references auth.users(id),
    created_at timestamp with time zone default now()
);

-- Indexes for performance
create index idx_ai_api_keys_provider on ai_api_keys(provider);
create index idx_ai_api_keys_enabled on ai_api_keys(enabled);
create index idx_ai_api_keys_status on ai_api_keys(status);
create index idx_ai_api_keys_priority on ai_api_keys(priority_order);
create index idx_ai_api_keys_created_by on ai_api_keys(created_by);
create index idx_ai_api_key_audit_key_id on ai_api_key_audit(key_id);
create index idx_ai_api_key_audit_action on ai_api_key_audit(action);
create index idx_ai_api_key_audit_created_at on ai_api_key_audit(created_at);
create index idx_ai_provider_usage_key_id on ai_provider_usage(key_id);
create index idx_ai_provider_usage_provider on ai_provider_usage(provider);
create index idx_ai_api_key_rotation_history_key_id on ai_api_key_rotation_history(key_id);

-- Functions

-- Hash API Key
create or replace function hash_api_key(key text)
returns text as $$
begin
    return encode(digest(key, 'sha256'), 'hex');
end;
$$ language plpgsql immutable;

-- Encrypt API Key
create or replace function encrypt_api_key(key text)
returns text as $$
declare
    encryption_key text;
begin
    encryption_key := current_setting('app.encryption_key', true);
    if encryption_key is null then
        raise exception 'Encryption key not set';
    end if;
    return encode(encrypt(convert_to(key, 'UTF8'), convert_to(encryption_key, 'UTF8'), 'aes'), 'base64');
end;
$$ language plpgsql;

-- Decrypt API Key
create or replace function decrypt_api_key(encrypted_key text)
returns text as $$
declare
    encryption_key text;
begin
    encryption_key := current_setting('app.encryption_key', true);
    if encryption_key is null then
        raise exception 'Encryption key not set';
    end if;
    return convert_from(decrypt(decode(encrypted_key, 'base64'), convert_to(encryption_key, 'UTF8'), 'aes'), 'UTF8');
end;
$$ language plpgsql;

-- Update updated_at column
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Triggers
create trigger update_ai_api_keys_updated_at before update on ai_api_keys
    for each row execute function update_updated_at_column();

create trigger update_ai_provider_usage_updated_at before update on ai_provider_usage
    for each row execute function update_updated_at_column();

create trigger update_ai_provider_config_updated_at before update on ai_provider_config
    for each row execute function update_updated_at_column();

-- Views

-- Masked API Keys View
create or replace view ai_api_keys_masked as
select
    id,
    provider,
    model,
    priority_order,
    enabled,
    status,
    last_tested_at,
    last_error,
    error_count,
    success_count,
    created_at,
    updated_at,
    case
        when length(api_key_hash) >= 12 then
            substring(api_key_hash, 1, 8) || '...' || substring(api_key_hash, length(api_key_hash) - 3)
        else
            '••••••••'
    end as key_preview
from ai_api_keys
where deleted_at is null;

-- Provider Status Dashboard View
create or replace view ai_provider_status_dashboard as
select
    k.provider,
    count(k.id) as total_keys,
    count(case when k.enabled = true then 1 end) as active_keys,
    round(100.0 * count(case when k.error_count = 0 then 1 end) / nullif(count(k.id), 0), 2) as success_rate,
    sum(u.total_requests) as total_requests,
    sum(u.success_requests) as success_requests,
    sum(u.failed_requests) as failed_requests,
    sum(u.total_tokens) as total_tokens,
    sum(u.total_cost_usd) as total_cost_usd,
    max(u.last_used_at) as last_used_at
from ai_api_keys k
left join ai_provider_usage u on k.id = u.key_id
where k.deleted_at is null
group by k.provider;

-- Row Level Security Policies

-- Enable RLS
alter table ai_api_keys enable row level security;
alter table ai_api_key_audit enable row level security;
alter table ai_provider_usage enable row level security;
alter table ai_provider_config enable row level security;
alter table ai_api_key_rotation_history enable row level security;

-- Admin can read/insert/update/delete all keys
create policy admin_all_keys on ai_api_keys
    for all using (
        (select auth.jwt() ->> 'user_role') = 'admin'
    )
    with check (
        (select auth.jwt() ->> 'user_role') = 'admin'
    );

-- Admin can read/insert/update/delete audit logs
create policy admin_all_audit on ai_api_key_audit
    for all using (
        (select auth.jwt() ->> 'user_role') = 'admin'
    )
    with check (
        (select auth.jwt() ->> 'user_role') = 'admin'
    );

-- Admin can manage provider config
create policy admin_provider_config on ai_provider_config
    for all using (
        (select auth.jwt() ->> 'user_role') = 'admin'
    )
    with check (
        (select auth.jwt() ->> 'user_role') = 'admin'
    );

-- Everyone can read provider usage (anonymized)
create policy public_read_usage on ai_provider_usage
    for select using (true);

-- Everyone can read provider status
create policy public_read_config on ai_provider_config
    for select using (true);
