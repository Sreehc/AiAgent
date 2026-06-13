alter table knowledge_document
    add column if not exists version_no int not null default 1,
    add column if not exists deleted_at timestamptz,
    add column if not exists file_size bigint not null default 0;

update knowledge_document
set file_size = length(coalesce(text_content, ''))
where file_size = 0;

create index if not exists idx_knowledge_document_deleted
    on knowledge_document(knowledge_base_id, deleted_at, created_at desc);

create table if not exists rag_evaluation_run (
    id bigserial primary key,
    eval_id varchar(64) not null unique,
    user_id bigint not null references user_account(id) on delete cascade,
    knowledge_base_ids jsonb not null default '[]'::jsonb,
    cases jsonb not null,
    metrics jsonb,
    status varchar(32) not null,
    error_message text,
    created_at timestamptz not null default now(),
    completed_at timestamptz
);

create index if not exists idx_rag_evaluation_run_user_time
    on rag_evaluation_run(user_id, created_at desc);
