create table if not exists user_api_config (
    id bigserial primary key,
    user_id bigint not null unique references user_account(id) on delete cascade,
    base_url varchar(512) not null,
    api_key_ciphertext text,
    api_key_hint varchar(32),
    api_key_key_version varchar(32) not null default 'v1',
    model_code varchar(128) not null,
    temperature numeric(3, 2) not null,
    max_tokens int not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint ck_user_api_config_temperature check (temperature >= 0 and temperature <= 2),
    constraint ck_user_api_config_max_tokens check (max_tokens >= 100 and max_tokens <= 32000)
);
