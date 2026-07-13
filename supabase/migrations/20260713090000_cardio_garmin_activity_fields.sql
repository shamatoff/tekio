-- Garmin activity sync (Phase 1): extend cardio_sessions to hold synced-ride
-- data that drives a proper cardio-adaptation classification (Training Effect,
-- HR zones) instead of the duration heuristic. max_heart_rate + zone_distribution
-- already existed. zone_distribution holds Garmin hrTimeInZone as a jsonb array
-- of seconds [z1,z2,z3,z4,z5].
ALTER TABLE public.cardio_sessions
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS garmin_activity_id bigint,
  ADD COLUMN IF NOT EXISTS elevation_gain_m numeric,
  ADD COLUMN IF NOT EXISTS aerobic_te numeric,
  ADD COLUMN IF NOT EXISTS anaerobic_te numeric,
  ADD COLUMN IF NOT EXISTS training_effect_label text,
  ADD COLUMN IF NOT EXISTS training_load numeric;

ALTER TABLE public.cardio_sessions
  DROP CONSTRAINT IF EXISTS cardio_sessions_source_check;
ALTER TABLE public.cardio_sessions
  ADD CONSTRAINT cardio_sessions_source_check CHECK (source IN ('manual', 'garmin'));

-- Idempotent upsert key for the sync. NULLs are distinct, so the many existing
-- manual rows (garmin_activity_id IS NULL) never collide with each other.
ALTER TABLE public.cardio_sessions
  DROP CONSTRAINT IF EXISTS cardio_sessions_user_garmin_activity_key;
ALTER TABLE public.cardio_sessions
  ADD CONSTRAINT cardio_sessions_user_garmin_activity_key UNIQUE (user_id, garmin_activity_id);
