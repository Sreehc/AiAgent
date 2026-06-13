alter table execution_run
    add column if not exists cancel_requested_at timestamptz,
    add column if not exists cancel_reason text,
    add column if not exists timeout_at timestamptz,
    add column if not exists recovered_at timestamptz,
    add column if not exists strategy_source varchar(32),
    add column if not exists planning_rounds int not null default 1,
    add column if not exists fallback_reasons jsonb not null default '[]'::jsonb;

create index if not exists idx_execution_run_status_heartbeat
    on execution_run(status, heartbeat_at);

alter table execution_plan_step
    add column if not exists parent_step_id bigint references execution_plan_step(id) on delete set null,
    add column if not exists planner_round int not null default 1,
    add column if not exists depends_on jsonb not null default '[]'::jsonb,
    add column if not exists observation text,
    add column if not exists retry_count int not null default 0;

create table if not exists session_memory (
    id bigserial primary key,
    session_id bigint not null references agent_session(id) on delete cascade,
    user_id bigint not null references user_account(id) on delete cascade,
    memory_type varchar(32) not null,
    content text not null,
    source_run_id bigint references execution_run(id) on delete set null,
    token_estimate int,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_session_memory_session_type
    on session_memory(session_id, memory_type, updated_at desc);
