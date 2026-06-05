alter table knowledge_document
    add column if not exists content_hash varchar(64),
    add column if not exists index_version int not null default 1,
    add column if not exists last_error varchar(500);

update knowledge_document
set content_hash = md5(coalesce(text_content, ''))
where content_hash is null;

create table if not exists index_job (
    id bigserial primary key,
    job_id varchar(64) not null unique,
    knowledge_document_id bigint not null references knowledge_document(id) on delete cascade,
    status varchar(16) not null,
    trigger_type varchar(32) not null,
    retry_count int not null default 0,
    max_retry_count int not null default 3,
    payload_json jsonb not null default '{}'::jsonb,
    error_message varchar(500),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    started_at timestamptz,
    completed_at timestamptz
);

create index if not exists idx_index_job_document_created
    on index_job(knowledge_document_id, created_at desc);

create index if not exists idx_index_job_status_created
    on index_job(status, created_at asc);
