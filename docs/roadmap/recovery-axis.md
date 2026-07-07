# Roadmap: Recovery / Readiness axis

**Status:** planned — not started
**Kickoff:** start a fresh session with this file as the brief.

## Goal

Add a **Recovery/Readiness axis** that sits *parallel* to the nine training
adaptations (Galpin) rather than inside them. Galpin's 9 are training stimulus
qualities; mobility/recovery is deliberately *not* one of them. Today recovery is
only informally represented by the 💆 minutes column on the Muscle Coverage card.
This axis makes recovery a first-class, aggregated view.

## Inputs to aggregate

- **Mobility** (already logged) — the 💆 recovery minutes per muscle.
- **Manual recovery habits** (already folded into muscle coverage — see
  `habitMuscleContributions` in `src/lib/utils.ts`).
- **Sleep** — new data (duration, quality). New table.
- **Nutrition / food** — new data; larger scope (likely its own sub-project:
  logging model, targets). Consider phasing this last.
- **Sauna** — new data (sessions, minutes, temp?). New table.
- **Cold plunge / cold exposure** — new data (sessions, minutes, temp?). New table.

## Suggested shape

- One `recovery_*` table per modality (`sleep_entries`, `sauna_entries`,
  `cold_entries`), each user-scoped like the rest (`USER_ID`, single-user design).
  Keep food separate — it's a bigger domain.
- A `RecoveryCard` on Home (mirrors `MuscleCoverageCard` / the adaptation
  dashboard), showing per-modality weekly totals + a simple readiness roll-up.
- A `usePrefs` section entry so it can be toggled/reordered like other sections
  (remember: new Home cards need an icon — see the home-card-icons convention).
- Reuse the existing weekly-window + `startOfWeek(weekStartDay)` conventions
  (Monday/ISO — user is Europe-based).

## Explicitly out of scope for this axis

- Do **not** add mobility/recovery as a 10th Galpin adaptation. It's a separate
  axis by design (see the adaptations discussion).

## Related code

- `src/lib/utils.ts` — `muscleCoverage()`, `habitMuscleContributions()`
- `src/components/tabs/home/MuscleCoverageCard.tsx` — the current 💆 recovery column
- `src/constants/adaptations.ts` — the nine adaptations (recovery is NOT one)
- `src/store/app.ts` — `bootstrap()` parallel loads; add new loaders here
