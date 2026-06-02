create table if not exists model_config (
    id bigserial primary key,
    model_code varchar(64) not null unique,
    name varchar(128) not null,
    provider varchar(64) not null,
    model_type varchar(32) not null,
    base_url varchar(512) not null,
    api_key varchar(255),
    enabled boolean not null default true,
    created_by bigint references user_account(id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_model_config_type_enabled
    on model_config(model_type, enabled);
