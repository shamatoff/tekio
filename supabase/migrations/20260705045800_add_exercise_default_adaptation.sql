-- Optional per-exercise adaptation override for the adaptation dashboard.
-- Additive + nullable: existing rows and queries are unaffected. When set, an
-- exercise always counts toward this adaptation, overriding rep-based
-- classification; null = classify each set by reps.
alter table exercises
  add column if not exists default_adaptation text
  check (default_adaptation in (
    'skill','speed','power','strength','hypertrophy',
    'muscular_endurance','anaerobic_capacity','vo2max','endurance'
  ));

comment on column exercises.default_adaptation is
  'Optional adaptation this exercise always trains (overrides rep-based classification). Null = classify by reps.';
