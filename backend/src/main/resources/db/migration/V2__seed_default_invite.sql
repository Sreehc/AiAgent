insert into invite_registration (invite_token, status, expires_at, created_at)
select 'INVITE-ABC', 'NEW', now() + interval '30 day', now()
where not exists (
    select 1
    from invite_registration
    where invite_token = 'INVITE-ABC'
);

