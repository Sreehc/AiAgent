insert into invite_registration (invite_token, status, expires_at, created_at)
select token, 'NEW', now() + interval '30 day', now()
from (
    values
        ('INVITE-DEF'),
        ('INVITE-GHI'),
        ('INVITE-JKL')
) as seeds(token)
where not exists (
    select 1
    from invite_registration existing
    where existing.invite_token = seeds.token
);
