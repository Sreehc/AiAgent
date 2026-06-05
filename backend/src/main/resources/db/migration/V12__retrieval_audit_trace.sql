alter table execution_run
    add column if not exists retrieval_query text,
    add column if not exists recall_set jsonb not null default '[]'::jsonb,
    add column if not exists final_evidence_set jsonb not null default '[]'::jsonb;
