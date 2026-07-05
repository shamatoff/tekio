import type { AdaptationRx as Rx } from '../../../constants/adaptations'

const ROWS: [keyof Rx, string][] = [
  ['load', 'Load'],
  ['reps', 'Reps'],
  ['sets', 'Sets'],
  ['rest', 'Rest'],
  ['effort', 'Effort'],
]

/** Compact load/reps/sets/rest/effort table + cue for one adaptation. */
export function AdaptationRxTable({ rx }: { rx: Rx }) {
  return (
    <div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        {ROWS.map(([k, label]) => (
          <div key={k} className="contents">
            <dt className="text-[11px] font-semibold text-muted">{label}</dt>
            <dd className="text-[11px] text-primary text-right tabular-nums">{rx[k]}</dd>
          </div>
        ))}
      </dl>
      <p className="text-[11px] text-muted italic mt-2 leading-snug">{rx.cue}</p>
    </div>
  )
}
