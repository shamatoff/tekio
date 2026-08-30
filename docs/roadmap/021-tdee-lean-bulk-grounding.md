# Roadmap: TDEE and lean bulk targets — grounded

**Label:** feature
**Status:** proposed 2026-08-30 (by a shamatoff-os session, at Peter's direction) — awaiting kickoff in a tekio session.

## The ask

Produce Peter's **TDEE estimate and lean-bulk targets** (kcal surplus, protein
g/kg, phase dates) as **grounded numbers** — through `/ground` and the
science-scout roster like every other number the app claims (roadmap 009
discipline). Peter, 2026-08-30: *"For the TDEE probably we need to ground that
on science."* No back-of-envelope multiplier ships.

## What exists already

- `bodyweight_logs`: 10 rows, 2026-03-18 → 2026-08-17, latest **82.2 kg** (up from ~79 kg in April — a bulk is visibly in progress).
- `nutrition_logs`, `body_composition_logs`: **empty** — intake and BF% are not in the data.
- Roadmap 007 (Food Recovery Score) already touches nutrition targets; this brief must not fork a second nutrition model — check overlap at kickoff.

## Grounding scope (for /ground at kickoff)

- TDEE estimation method choice (e.g. equation family + activity factor vs. adaptive/trend-based from bodyweight + intake) — with named sources.
- Lean-bulk surplus size and protein g/kg — named practitioners/sources, per the grounding gate.
- **Grounding table** (Peter's request, 2026-08-30, attached to approving the grounding-gate decision): *feature/calculation → sources → practitioner references*, browsable in one place.

## Waiting on Peter (in the kickoff session)

Goal weight/timeframe, activity level, training phase dates, and whether
intake logging starts (an adaptive TDEE needs it).

## Note

Iron status is pending clarification (ferritin ± Hb electrophoresis, GP visit
planned) — the plan should note it, not wait for it. Conclusions flow back to
shamatoff-os `wiki/health/` via ingest: the OS records conclusions, tekio
grounds numbers.
