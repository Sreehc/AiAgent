alter table model_config
    add column if not exists api_key_ciphertext text,
    add column if not exists api_key_hint varchar(32),
    add column if not exists api_key_key_version varchar(32) not null default 'v1';

update model_config
set api_key_hint = case
        when api_key is null or api_key = '' then null
        when length(api_key) <= 8 then '****'
        else substring(api_key from 1 for 4) || '****' || substring(api_key from length(api_key) - 3 for 4)
    end
where api_key_hint is null;

update model_config
set api_key = null
where api_key is not null;
