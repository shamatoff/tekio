import { DelBtn } from './Button'

export interface SetStr { weight: string; reps: string }

interface SetsGridProps {
  sets: SetStr[]
  revealed: number
  onUpdate: (i: number, field: 'weight' | 'reps', val: string) => void
  onRemove: (i: number) => void
  onRevealNext: () => void
}

/**
 * Reusable sets grid (weight × reps rows) used in WeightsTab and EditModal.
 */
export function SetsGrid({ sets, revealed, onUpdate, onRemove, onRevealNext }: SetsGridProps) {
  const visible = sets.slice(0, revealed)

  return (
    <div>
      <div className="grid gap-1.5 mb-1.5" style={{ gridTemplateColumns: '28px 1fr 1fr 28px' }}>
        {['#', 'Weight (kg)', 'Reps', ''].map((h, i) => (
          <p key={i} className="text-[11px] text-muted font-semibold">{h}</p>
        ))}
      </div>

      {visible.map((s, i) => (
        <div key={i} className="grid gap-1.5 mb-1.5 items-center" style={{ gridTemplateColumns: '28px 1fr 1fr 28px' }}>
          <span className="text-xs text-muted text-center">{i + 1}</span>
          <input
            value={s.weight}
            onChange={e => onUpdate(i, 'weight', e.target.value)}
            type="number"
            placeholder="60"
            min="0"
            step="0.5"
            className="w-full min-w-0 border border-border rounded-lg px-2.5 py-1.5 text-sm bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
          <input
            value={s.reps}
            onChange={e => onUpdate(i, 'reps', e.target.value)}
            type="number"
            placeholder="10"
            min="1"
            className="w-full min-w-0 border border-border rounded-lg px-2.5 py-1.5 text-sm bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
          <div>
            {visible.length > 1 && <DelBtn onClick={() => onRemove(i)} />}
          </div>
        </div>
      ))}

      <button onClick={onRevealNext} className="text-xs text-accent mt-1">
        {revealed < sets.length
          ? `+ Set ${revealed + 1} (${sets[revealed].weight}kg × ${sets[revealed].reps})`
          : '+ Add set'}
      </button>
    </div>
  )
}
