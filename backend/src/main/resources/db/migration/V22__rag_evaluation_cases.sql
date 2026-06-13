create table if not exists rag_evaluation_case (
    id bigserial primary key,
    case_id varchar(64) not null unique,
    user_id bigint not null references user_account(id) on delete cascade,
    query text not null,
    expected_citation_ids jsonb not null default '[]'::jsonb,
    expected_text_contains jsonb not null default '[]'::jsonb,
    enabled boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_rag_evaluation_case_user_time
    on rag_evaluation_case(user_id, created_at desc);
