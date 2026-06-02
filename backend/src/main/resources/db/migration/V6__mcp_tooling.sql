create table if not exists mcp_server_config (
    id bigserial primary key,
    server_code varchar(64) not null unique,
    name varchar(128) not null,
    transport_type varchar(32) not null,
    endpoint varchar(512) not null,
    command_line varchar(512),
    status varchar(16) not null default 'ACTIVE',
    created_by bigint not null references user_account(id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_mcp_server_config_status
    on mcp_server_config(status);

create table if not exists tool_invocation (
    id bigserial primary key,
    execution_run_id bigint not null references execution_run(id) on delete cascade,
    tool_call_id varchar(64) not null unique,
    tool_name varchar(128) not null,
    tool_type varchar(32) not null,
    request_payload jsonb not null,
    response_payload jsonb,
    status varchar(16) not null,
    started_at timestamptz not null default now(),
    ended_at timestamptz
);

create index if not exists idx_tool_invocation_run_time
    on tool_invocation(execution_run_id, started_at desc);
