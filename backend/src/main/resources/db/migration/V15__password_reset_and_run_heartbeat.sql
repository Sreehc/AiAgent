alter table execution_run
    add column if not exists heartbeat_at timestamptz;

create table if not exists password_reset_token (
    id bigserial primary key,
    token_hash varchar(128) not null unique,
    user_id bigint not null references user_account(id) on delete cascade,
    request_ip varchar(64),
    expires_at timestamptz not null,
    used_at timestamptz,
    created_at timestamptz not null default now()
);

create index if not exists idx_password_reset_token_user_expire
    on password_reset_token(user_id, expires_at desc);
