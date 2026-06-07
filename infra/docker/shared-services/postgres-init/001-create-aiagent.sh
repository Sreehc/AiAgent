#!/usr/bin/env bash
set -Eeuo pipefail

psql -v ON_ERROR_STOP=1 --username "${POSTGRES_USER}" --dbname "${POSTGRES_DB}" <<SQL
do \$\$
begin
  if not exists (select 1 from pg_roles where rolname = '${AIAGENT_DB_USER}') then
    create role ${AIAGENT_DB_USER} login password '${AIAGENT_DB_PASSWORD}';
  else
    alter role ${AIAGENT_DB_USER} with login password '${AIAGENT_DB_PASSWORD}';
  end if;
end
\$\$;

select 'create database ${AIAGENT_DB_NAME} owner ${AIAGENT_DB_USER}'
where not exists (select 1 from pg_database where datname = '${AIAGENT_DB_NAME}')\gexec

\connect ${AIAGENT_DB_NAME}
create extension if not exists vector;
SQL
