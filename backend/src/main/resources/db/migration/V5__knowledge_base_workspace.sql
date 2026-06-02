create extension if not exists vector;

create table if not exists knowledge_base (
    id bigserial primary key,
    kb_id varchar(64) not null unique,
    user_id bigint not null references user_account(id) on delete cascade,
    name varchar(128) not null,
    description varchar(255),
    status varchar(16) not null default 'ACTIVE',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_knowledge_base_user_time
    on knowledge_base(user_id, created_at desc);

create table if not exists knowledge_document (
    id bigserial primary key,
    knowledge_base_id bigint not null references knowledge_base(id) on delete cascade,
    document_id varchar(64) not null unique,
    file_name varchar(255) not null,
    file_type varchar(32) not null,
    storage_uri varchar(512) not null,
    parse_status varchar(16) not null default 'UPLOADED',
    text_content text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_knowledge_document_kb_time
    on knowledge_document(knowledge_base_id, created_at desc);

create table if not exists knowledge_chunk (
    id bigserial primary key,
    knowledge_document_id bigint not null references knowledge_document(id) on delete cascade,
    chunk_id varchar(64) not null unique,
    chunk_no int not null,
    content_preview varchar(500) not null,
    content_text text not null,
    embedding vector(1536) not null,
    created_at timestamptz not null default now()
);

create index if not exists idx_knowledge_chunk_document_no
    on knowledge_chunk(knowledge_document_id, chunk_no asc);

create table if not exists session_kb_binding (
    id bigserial primary key,
    session_id bigint not null references agent_session(id) on delete cascade,
    knowledge_base_id bigint not null references knowledge_base(id) on delete cascade,
    created_at timestamptz not null default now(),
    constraint uk_session_kb_binding_session_kb unique (session_id, knowledge_base_id)
);

create index if not exists idx_session_kb_binding_session
    on session_kb_binding(session_id);
