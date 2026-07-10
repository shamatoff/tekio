import type { MuscleStatus, MuscleStatusRow } from '../../../lib/adaptations'

const STATUS_STYLE: Record<MuscleStatus, { bar: string; dot: string; label: string }> = {
  on_track: { bar: '#10b981', dot: '🟢', label: 'on track' },
  needs_work: { bar: '#f59e0b', dot: '🟡', label: 'needs work' },
  untouched: { bar: '#cbd5e1', dot: '⚪', label: 'untouched' },
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

function Row({ row, child }: { row: MuscleStatusRow; child?: boolean }) {
  const s = STATUS_STYLE[row.status]
  const value = child ? row.sets : row.aggSets
  // Fill = progress toward the weekly target (capped at 100%), so a "needs work"
  // muscle reads as a partial bar that matches its amber status and the body map —
  // not relative-to-the-biggest-muscle, which made under-target muscles look full.
  const pct = row.target > 0 ? Math.min(100, Math.round((value / row.target) * 100)) : 0
  return (
    <div className="flex items-center gap-2">
      <span className={`${child ? 'text-[11px] text-muted' : 'text-xs font-semibold text-primary'} w-28 text-left truncate`}>
        {row.name}
      </span>
      <div className={`flex-1 ${child ? 'h-1.5' : 'h-2'} bg-bg rounded-full overflow-hidden`}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: s.bar }} />
      </div>
      <span className="text-[10px] shrink-0" title={s.label}>{s.dot}</span>
      <span className="text-[10px] text-muted tabular-nums w-11 text-right">
        {value === 0 ? '—' : `${fmt(value)}/${row.target}`}
      </span>
    </div>
  )
}

/** Color-coded per-muscle-group breakdown for one resistance adaptation. */
export function MuscleStatusList({ muscles }: { muscles: MuscleStatusRow[] }) {
  if (muscles.length === 0) {
    return <p className="text-[11px] text-muted italic">No muscle-group data yet.</p>
  }
  return (
    <div className="flex flex-col gap-1.5">
      {muscles.map(top => (
        <div key={top.id}>
          <Row row={top} />
          {top.children.length > 0 && (
            <div className="pl-4 flex flex-col gap-1 mt-1">
              {top.children.map(c => (
                <Row key={c.id} row={c} child />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// Re-export the shared status meta for legends.
export { STATUS_STYLE }
