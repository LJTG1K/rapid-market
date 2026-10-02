-- RAPID Studio: shared drafts, publish history and field-level change log.
-- See studio/SPEC.md. Accessed only server-side with the service-role key,
-- so RLS is enabled with no policies (anon/authenticated clients get nothing).

create table if not exists studio_drafts (
  id uuid primary key,
  target_type text not null,
  target_key text not null,
  op text not null check (op in ('create', 'update', 'delete')),
  payload jsonb,
  base jsonb,
  editor_name text not null,
  overwrote_editor text,
  updated_at timestamptz not null default now(),
  unique (target_type, target_key)
);

create table if not exists studio_publishes (
  id uuid primary key,
  editor_name text not null,
  commit_sha text not null,
  summary text not null,
  created_at timestamptz not null default now(),
  revert_of uuid references studio_publishes (id),
  reverted_by uuid references studio_publishes (id)
);

create table if not exists studio_changes (
  id bigserial primary key,
  publish_id uuid not null references studio_publishes (id) on delete cascade,
  target_type text not null,
  target_key text not null,
  field text not null,
  old_value jsonb,
  new_value jsonb
);

create index if not exists studio_changes_publish_idx on studio_changes (publish_id);
create index if not exists studio_publishes_created_idx on studio_publishes (created_at desc);

alter table studio_drafts enable row level security;
alter table studio_publishes enable row level security;
alter table studio_changes enable row level security;
