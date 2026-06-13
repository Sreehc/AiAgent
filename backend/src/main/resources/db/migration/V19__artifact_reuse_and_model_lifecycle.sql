alter table artifact_record
    add column if not exists metadata jsonb not null default '{}'::jsonb,
    add column if not exists source_artifact_id bigint references artifact_record(id) on delete set null,
    add column if not exists reusable boolean not null default true;

create index if not exists idx_artifact_record_user_reusable
    on artifact_record(user_id, reusable, created_at desc);

alter table model_config
    add column if not exists is_default boolean not null default false,
    add column if not exists deleted_at timestamptz,
    add column if not exists last_tested_at timestamptz,
    add column if not exists last_test_status varchar(32),
    add column if not exists last_test_message text;

create unique index if not exists uk_model_config_default_type
    on model_config(model_type)
    where is_default = true and deleted_at is null;
