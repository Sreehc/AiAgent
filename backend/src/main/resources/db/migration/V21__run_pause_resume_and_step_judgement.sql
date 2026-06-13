alter table execution_run
    add column if not exists paused_at timestamptz,
    add column if not exists pause_reason text,
    add column if not exists resumed_at timestamptz;

alter table execution_plan_step
    add column if not exists completion_judgement text,
    add column if not exists started_at timestamptz,
    add column if not exists completed_at timestamptz;
