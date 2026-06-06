alter table knowledge_chunk
    add column if not exists source_offset integer not null default 0;

do $$
begin
    if exists (select 1 from pg_am where amname = 'hnsw') then
        execute 'create index if not exists idx_knowledge_chunk_embedding_hnsw on knowledge_chunk using hnsw (embedding vector_cosine_ops)';
    end if;
end $$;
