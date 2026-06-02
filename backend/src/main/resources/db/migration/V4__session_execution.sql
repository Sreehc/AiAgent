create table if not exists agent_session (
    id bigserial primary key,
    session_code varchar(64) not null unique,
    user_id bigint not null references user_account(id),
    title varchar(256) not null,
    agent_mode varchar(32) not null,
    status varchar(32) not null default 'IDLE',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_agent_session_user_created_at
    on agent_session(user_id, created_at desc);

create table if not exists session_message (
    id bigserial primary key,
    message_code varchar(64) not null unique,
    session_id bigint not null references agent_session(id) on delete cascade,
    run_id bigint,
    role_code varchar(32) not null,
    content text not null,
    created_at timestamptz not null default now()
);

create index if not exists idx_session_message_session_created_at
    on session_message(session_id, created_at asc);

create table if not exists execution_run (
    id bigserial primary key,
    run_code varchar(64) not null unique,
    session_id bigint not null references agent_session(id) on delete cascade,
    user_id bigint not null references user_account(id),
    query_text text not null,
    execution_mode varchar(32) not null,
    knowledge_base_ids jsonb not null default '[]'::jsonb,
    status varchar(32) not null,
    error_message text,
    started_at timestamptz,
    completed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_execution_run_session_created_at
    on execution_run(session_id, created_at desc);

create table if not exists execution_plan_step (
    id bigserial primary key,
    step_code varchar(64) not null unique,
    run_id bigint not null references execution_run(id) on delete cascade,
    step_no int not null,
    title varchar(256) not null,
    status varchar(32) not null,
    tool_name varchar(128),
    tool_input text,
    tool_output text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index if not exists uk_execution_plan_step_run_step_no
    on execution_plan_step(run_id, step_no);

create table if not exists artifact_record (
    id bigserial primary key,
    artifact_code varchar(64) not null unique,
    session_id bigint not null references agent_session(id) on delete cascade,
    run_id bigint not null references execution_run(id) on delete cascade,
    artifact_type varchar(32) not null,
    title varchar(256) not null,
    content text not null,
    created_at timestamptz not null default now()
);

create index if not exists idx_artifact_record_session_created_at
    on artifact_record(session_id, created_at desc);
