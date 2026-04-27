-- WebAuthn credential storage (one row per registered device per user)
create table if not exists webauthn_credentials (
  id text primary key,             -- base64url credential ID from device
  user_id uuid references auth.users(id) on delete cascade not null,
  public_key bytea not null,
  counter bigint not null default 0,
  device_type text,                -- 'singleDevice' | 'multiDevice'
  backed_up boolean default false,
  transports text[],               -- ['internal','hybrid','usb','nfc','ble']
  created_at timestamptz default now()
);

alter table webauthn_credentials enable row level security;
create policy "own_credentials" on webauthn_credentials for all using (user_id = auth.uid());

-- Short-lived challenge storage (needed because Vercel is stateless)
create table if not exists webauthn_challenges (
  id uuid primary key default uuid_generate_v4(),
  challenge text not null unique,
  user_id uuid references auth.users(id) on delete cascade,
  expires_at timestamptz default now() + interval '5 minutes'
);

alter table webauthn_challenges enable row level security;
create policy "own_challenges" on webauthn_challenges for all using (user_id = auth.uid());

-- Clean up expired challenges automatically
create or replace function delete_expired_webauthn_challenges()
returns void language sql security definer as $$
  delete from webauthn_challenges where expires_at < now();
$$;
