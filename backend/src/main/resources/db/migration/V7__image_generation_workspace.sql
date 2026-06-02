alter table artifact_record
    add column if not exists user_id bigint references user_account(id);

update artifact_record ar
set user_id = s.user_id
from agent_session s
where ar.session_id = s.id
  and ar.user_id is null;

alter table artifact_record
    alter column user_id set not null;

alter table artifact_record
    alter column session_id drop not null;

alter table artifact_record
    alter column run_id drop not null;

alter table artifact_record
    add column if not exists storage_uri varchar(512),
    add column if not exists mime_type varchar(128);

create index if not exists idx_artifact_record_user_time
    on artifact_record(user_id, created_at desc);

create index if not exists idx_artifact_record_session_type
    on artifact_record(session_id, artifact_type, created_at desc);

create table if not exists image_generation_job (
    id bigserial primary key,
    job_id varchar(64) not null unique,
    user_id bigint not null references user_account(id),
    session_id bigint references agent_session(id) on delete set null,
    mode varchar(16) not null,
    prompt_text text not null,
    size varchar(32) not null,
    source_artifact_id varchar(64),
    result_artifact_id varchar(64),
    status varchar(16) not null,
    error_message text,
    created_at timestamptz not null default now()
);

create index if not exists idx_image_generation_job_user_time
    on image_generation_job(user_id, created_at desc);
