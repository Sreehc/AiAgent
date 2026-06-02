create table if not exists user_account (
    id bigserial primary key,
    username varchar(64) not null unique,
    email varchar(128),
    phone varchar(32),
    password_hash varchar(255) not null,
    display_name varchar(64) not null,
    status varchar(16) not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_user_account_status on user_account(status);

create table if not exists user_role_relation (
    id bigserial primary key,
    user_id bigint not null references user_account(id),
    role_code varchar(32) not null,
    created_at timestamptz not null default now(),
    constraint uk_user_role_relation_user_role unique (user_id, role_code)
);

create index if not exists idx_user_role_relation_role_code on user_role_relation(role_code);

create table if not exists invite_registration (
    id bigserial primary key,
    invite_token varchar(128) not null unique,
    status varchar(16) not null,
    created_by bigint,
    bound_user_id bigint,
    expires_at timestamptz not null,
    used_at timestamptz,
    created_at timestamptz not null default now()
);

create index if not exists idx_invite_registration_status_expire on invite_registration(status, expires_at);

create table if not exists login_log (
    id bigserial primary key,
    user_id bigint,
    username varchar(64),
    login_ip varchar(64),
    user_agent varchar(255),
    login_result varchar(16) not null,
    login_at timestamptz not null default now()
);

create index if not exists idx_login_log_user_time on login_log(user_id, login_at desc);
