alter table knowledge_chunk
    add column if not exists section_title varchar(255),
    add column if not exists heading_path varchar(500),
    add column if not exists token_count int not null default 0,
    add column if not exists metadata_json jsonb not null default '{}'::jsonb;
