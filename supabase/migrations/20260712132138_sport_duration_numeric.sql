-- Fix: sport sessions could not be logged with a fractional MM:SS duration
-- (e.g. 45:30 -> 45.5) because duration_minutes was integer, while the parallel
-- cardio_sessions column is numeric. PostgREST's text->integer cast rejected the
-- value (22P02). Widen to numeric so the two stay consistent.
ALTER TABLE public.sport_sessions
  ALTER COLUMN duration_minutes TYPE numeric;

-- Clean up the orphaned 'Cycling' sport type left behind by that failed insert
-- (getOrCreateSportType had already run). Guarded so it only removes a type that
-- has no sessions attached.
DELETE FROM public.sport_types st
WHERE st.name = 'Cycling'
  AND st.user_id = 'a0000000-0000-0000-0000-000000000001'
  AND NOT EXISTS (
    SELECT 1 FROM public.sport_sessions ss WHERE ss.sport_type_id = st.id
  );
