alter table knowledge_chunk
    add column if not exists search_vector tsvector;

update knowledge_chunk
set search_vector = to_tsvector(
    'simple',
    concat_ws(' ', coalesce(section_title, ''), coalesce(heading_path, ''), coalesce(content_text, ''))
)
where search_vector is null;

create index if not exists idx_knowledge_chunk_search_vector
    on knowledge_chunk using gin (search_vector);
