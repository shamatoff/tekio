# Roadmap: Rename leftover skill_* constraint / index names to sport_*

**Status:** planned — low priority, cosmetic

## Goal

Finish the Skills→Sports DB rename by renaming the constraint and index names that
still carry the old `skill_*` prefix.

## Context

The July 2026 migration `rename_skill_domain_to_sport` renamed all `skill_*`
**tables** and **columns** to `sport_*` (data + FK integrity preserved). Postgres
does **not** rename dependent constraint/index names automatically, so objects
like `skill_sessions_pkey` and `skill_sessions_skill_type_id_fkey` still exist on
the now-`sport_sessions` table. This is purely cosmetic — everything works — but
it's inconsistent for anyone reading the schema.

## Scope

- `ALTER TABLE … RENAME CONSTRAINT` / `ALTER INDEX … RENAME TO` for every
  `skill_*`-named constraint and index across `sport_sessions`, `sport_types`,
  `sport_areas`, `sport_drills`, `sport_progressions`, `sport_session_drills`.
- Enumerate them first: query `pg_constraint` / `pg_indexes` for `conname` /
  `indexname LIKE 'skill%'`.
- Mirror the migration into `supabase/migrations/`.

## Out of scope

- No table/column/data changes — names only.

## Notes

- Live single-user prod DB — confirm the DDL before applying (see
  [[project_tekio_supabase_live_data]]). Renaming constraint/index names does not
  touch data and is reversible.

## First step

Run the `pg_constraint` + `pg_indexes` enumeration to produce the exact list, then
generate the `RENAME` statements.
