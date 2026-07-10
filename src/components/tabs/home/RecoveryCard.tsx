import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useAppStore } from '../../../store/app'
import { usePrefs } from '../../../store/prefs'
import { startOfWeek, today } from '../../../lib/utils'
import { RECOVERY_ICONS, RECOVERY_TARGETS, RECOVERY_WEIGHTS } from '../../../constants/app'
import { Card, SecTitle } from '../../ui/Card'
import { Inp } from '../../ui/Input'
import { Btn } from '../../ui/Button'
import { useCountUp } from '../../../hooks/useCountUp'
import type { SleepEntry, SaunaEntry, ColdEntry, SleepQuality, EditModalTarget } from '../../../types'

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}
const clamp01 = (n: number) => Math.max(0, Math.min(1, n))

/** Readiness bar / headline colour by score. */
function scoreColor(pct: number): string {
  if (pct >= 80) return '#10b981'
  if (pct >= 50) return '#f59e0b'
  return '#ef4444'
}

const STARS: SleepQuality[] = [1, 2, 3, 4, 5]

interface RecoveryCardProps {
  /** Lets the mobility row jump to its own tab. */
  setTab?: (t: string) => void
}

export function RecoveryCard({ setTab }: RecoveryCardProps) {
  const {
    sleep, sauna, cold, mobility,
    addSleepEntry, addSaunaEntry, addColdEntry, openEditModal, setToast,
  } = useAppStore()
  const { weekStartDay } = usePrefs()
  const weekStart = startOfWeek(today(), weekStartDay)
  const inWeek = (d: string) => d >= weekStart && d <= today()

  const [adding, setAdding] = useState<null | 'sleep' | 'sauna' | 'cold'>(null)

  // ── Weekly aggregates ──────────────────────────────────────────────────────
  const agg = useMemo(() => {
    const sleepWk = sleep.filter(e => inWeek(e.date))
    const saunaWk = sauna.filter(e => inWeek(e.date))
    const coldWk = cold.filter(e => inWeek(e.date))
    const mobWk = mobility.filter(e => inWeek(e.date))

    const nights = sleepWk.length
    const avgHours = nights ? sleepWk.reduce((s, e) => s + e.hours, 0) / nights : 0
    const rated = sleepWk.filter(e => e.quality != null)
    const avgQuality = rated.length ? rated.reduce((s, e) => s + (e.quality ?? 0), 0) / rated.length : 0
    // Garmin Sleep Score (0–100) — objective, and richer than raw duration.
    const scored = sleepWk.filter(e => e.score != null)
    const avgScore = scored.length ? Math.round(scored.reduce((s, e) => s + (e.score ?? 0), 0) / scored.length) : 0
    const mobMinutes = mobWk.reduce((s, e) => s + e.duration, 0)
    const saunaMin = saunaWk.reduce((s, e) => s + e.duration, 0)
    const coldMin = coldWk.reduce((s, e) => s + e.duration, 0)

    // Per-night sleep sub-score: prefer the Garmin score (it already folds in
    // duration + stages + overnight HRV), else fall back to duration-vs-target.
    const perNight = sleepWk.map(e =>
      e.score != null ? clamp01(e.score / 100) : clamp01(e.hours / RECOVERY_TARGETS.sleepHours),
    )
    const sleepSub = perNight.length ? perNight.reduce((a, b) => a + b, 0) / perNight.length : 0

    const sub = {
      sleep: sleepSub,
      mobility: clamp01(mobMinutes / RECOVERY_TARGETS.mobilityMinutes),
      sauna: clamp01(saunaWk.length / RECOVERY_TARGETS.saunaSessions),
      cold: clamp01(coldWk.length / RECOVERY_TARGETS.coldSessions),
    }
    const readiness = Math.round(
      100 * (sub.sleep * RECOVERY_WEIGHTS.sleep + sub.mobility * RECOVERY_WEIGHTS.mobility +
        sub.sauna * RECOVERY_WEIGHTS.sauna + sub.cold * RECOVERY_WEIGHTS.cold),
    )
    return {
      readiness, sub,
      sleepWk, saunaWk, coldWk,
      nights, avgHours, avgQuality, avgScore, mobMinutes,
      saunaSessions: saunaWk.length, saunaMin,
      coldSessions: coldWk.length, coldMin,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sleep, sauna, cold, mobility, weekStart])

  const readinessDisplay = Math.round(useCountUp(agg.readiness))
  const barColor = scoreColor(agg.readiness)

  const edit = (target: EditModalTarget) => openEditModal(target)

  return (
    <Card>
      <SecTitle>Recovery · This Week</SecTitle>
      <p className="text-[11px] text-muted mb-3">
        Readiness rolls up sleep, mobility, sauna and cold against weekly targets.
      </p>

      {/* Readiness headline */}
      <div className="flex items-end justify-between mb-1">
        <span className="text-xs font-semibold text-muted uppercase tracking-wide">Readiness</span>
        <span className="text-2xl font-bold tabular-nums" style={{ color: barColor }}>
          {readinessDisplay}<span className="text-sm font-normal text-muted">%</span>
        </span>
      </div>
      <div className="h-2 bg-bg rounded-full overflow-hidden mb-4">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${agg.readiness}%`, backgroundColor: barColor }}
        />
      </div>

      <div className="flex flex-col gap-2.5">
        {/* Sleep */}
        <ModalityRow
          icon={RECOVERY_ICONS.sleep}
          name="Sleep"
          sub={agg.sub.sleep}
          stat={agg.nights
            ? `${fmt(agg.avgHours)}h${agg.avgScore ? ` · ⌚${agg.avgScore}` : agg.avgQuality ? ` · ★${fmt(agg.avgQuality)}` : ''}`
            : '—'}
          target={agg.avgScore ? `Garmin avg score ${agg.avgScore}` : `target ${RECOVERY_TARGETS.sleepHours}h/night`}
          open={adding === 'sleep'}
          onToggle={() => setAdding(a => (a === 'sleep' ? null : 'sleep'))}
          chips={
            <Chips
              entries={agg.sleepWk}
              label={e => {
                const s = e as SleepEntry
                return s.score != null ? `${fmt(s.hours)}h·${s.score}` : `${fmt(s.hours)}h`
              }}
              onEdit={e => edit({ type: 'sleep', record: e as SleepEntry })}
            />
          }
        >
          <SleepQuickAdd
            onSave={async (e) => { await addSleepEntry(e); setToast('😴 Sleep logged'); setAdding(null) }}
            onCancel={() => setAdding(null)}
          />
        </ModalityRow>

        {/* Mobility (display-only — logged in its own tab) */}
        <ModalityRow
          icon={RECOVERY_ICONS.mobility}
          name="Mobility"
          sub={agg.sub.mobility}
          stat={agg.mobMinutes ? `${fmt(agg.mobMinutes)} min` : '—'}
          target={`target ${RECOVERY_TARGETS.mobilityMinutes} min/wk`}
          onOpenTab={setTab ? () => setTab('Mobility') : undefined}
        />

        {/* Sauna */}
        <ModalityRow
          icon={RECOVERY_ICONS.sauna}
          name="Sauna"
          sub={agg.sub.sauna}
          stat={agg.saunaSessions ? `${agg.saunaSessions}× · ${fmt(agg.saunaMin)} min` : '—'}
          target={`target ${RECOVERY_TARGETS.saunaSessions}×/wk`}
          open={adding === 'sauna'}
          onToggle={() => setAdding(a => (a === 'sauna' ? null : 'sauna'))}
          chips={
            <Chips
              entries={agg.saunaWk}
              label={e => `${fmt((e as SaunaEntry).duration)}m`}
              onEdit={e => edit({ type: 'sauna', record: e as SaunaEntry })}
            />
          }
        >
          <SessionQuickAdd
            defaultTemp={80}
            onSave={async (e) => { await addSaunaEntry(e); setToast('🧖 Sauna logged'); setAdding(null) }}
            onCancel={() => setAdding(null)}
          />
        </ModalityRow>

        {/* Cold */}
        <ModalityRow
          icon={RECOVERY_ICONS.cold}
          name="Cold"
          sub={agg.sub.cold}
          stat={agg.coldSessions ? `${agg.coldSessions}× · ${fmt(agg.coldMin)} min` : '—'}
          target={`target ${RECOVERY_TARGETS.coldSessions}×/wk`}
          open={adding === 'cold'}
          onToggle={() => setAdding(a => (a === 'cold' ? null : 'cold'))}
          chips={
            <Chips
              entries={agg.coldWk}
              label={e => `${fmt((e as ColdEntry).duration)}m`}
              onEdit={e => edit({ type: 'cold', record: e as ColdEntry })}
            />
          }
        >
          <SessionQuickAdd
            defaultTemp={10}
            onSave={async (e) => { await addColdEntry(e); setToast('🧊 Cold logged'); setAdding(null) }}
            onCancel={() => setAdding(null)}
          />
        </ModalityRow>
      </div>
    </Card>
  )
}

// ── Modality row ──────────────────────────────────────────────────────────────

function ModalityRow({
  icon, name, sub, stat, target, open, onToggle, onOpenTab, chips, children,
}: {
  icon: string
  name: string
  sub: number
  stat: string
  target: string
  open?: boolean
  onToggle?: () => void
  onOpenTab?: () => void
  /** This-week entry chips — always shown when present. */
  chips?: ReactNode
  children?: ReactNode
}) {
  const pct = Math.round(sub * 100)
  const onTarget = sub >= 1
  return (
    <div>
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenTab}
          disabled={!onOpenTab}
          className={`flex items-center gap-1.5 min-w-0 ${onOpenTab ? 'active:scale-[0.97] transition-transform' : 'cursor-default'}`}
        >
          <span className="text-sm">{icon}</span>
          <span className="text-xs font-semibold text-primary">{name}</span>
          {onOpenTab && <span aria-hidden className="text-muted text-xs leading-none">›</span>}
        </button>
        <div className="flex-1 h-1.5 bg-bg rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${onTarget ? 'bg-success' : 'bg-accent'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[11px] text-muted tabular-nums text-right shrink-0">{stat}</span>
        {onToggle && (
          <button
            onClick={onToggle}
            aria-label={`Log ${name}`}
            className="text-xs font-bold text-accent w-5 h-5 rounded-full bg-accent-l flex items-center justify-center shrink-0 active:scale-90 transition-transform"
          >
            {open ? '×' : '+'}
          </button>
        )}
      </div>
      <p className="text-[10px] text-muted mt-0.5 ml-[1.55rem]">{target}</p>
      {chips}
      {open && children}
    </div>
  )
}

// ── This-week entry chips (tap to edit) ─────────────────────────────────────

function Chips<T extends { id: string; date: string }>({
  entries, label, onEdit,
}: {
  entries: T[]
  label: (e: T) => string
  onEdit: (e: T) => void
}) {
  if (entries.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {entries.map(e => (
        <button
          key={e.id}
          onClick={() => onEdit(e)}
          className="text-[10px] px-2 py-0.5 rounded-full bg-bg border border-border text-muted hover:text-accent hover:border-accent active:scale-95 transition"
          title={`${e.date} — tap to edit`}
        >
          {label(e)}
        </button>
      ))}
    </div>
  )
}

// ── Quick-add forms ───────────────────────────────────────────────────────────

function SleepQuickAdd({
  onSave, onCancel,
}: {
  onSave: (e: Omit<SleepEntry, 'id'>) => void | Promise<void>
  onCancel: () => void
}) {
  const [date, setDate] = useState(today())
  const [hours, setHours] = useState('')
  const [quality, setQuality] = useState<SleepQuality | 0>(0)

  const save = () => {
    if (!hours) return
    onSave({ date, hours: +hours, quality: quality || undefined })
  }

  return (
    <div className="mt-2 p-2.5 rounded-lg bg-bg flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <Inp label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
        <Inp label="Hours" type="number" value={hours} onChange={e => setHours(e.target.value)} placeholder="7.5" step="0.25" min="0" />
      </div>
      <div>
        <p className="text-[11px] text-muted font-medium mb-1">Quality (opt.)</p>
        <div className="flex gap-0.5 items-center">
          {STARS.map(s => (
            <button
              key={s}
              onClick={() => setQuality(q => (q === s ? 0 : s))}
              className={`text-xl transition-colors ${s <= quality ? 'text-warning' : 'text-border'}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>
      <QuickAddButtons onSave={save} onCancel={onCancel} />
    </div>
  )
}

function SessionQuickAdd({
  defaultTemp, onSave, onCancel,
}: {
  defaultTemp: number
  onSave: (e: { date: string; duration: number; tempC?: number; notes?: string }) => void | Promise<void>
  onCancel: () => void
}) {
  const [date, setDate] = useState(today())
  const [duration, setDuration] = useState('')
  const [temp, setTemp] = useState('')

  const save = () => {
    if (!duration) return
    onSave({ date, duration: +duration, tempC: temp ? +temp : undefined })
  }

  return (
    <div className="mt-2 p-2.5 rounded-lg bg-bg flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2">
        <Inp label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
        <Inp label="Min" type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="15" step="1" min="0" />
        <Inp label="°C (opt.)" type="number" value={temp} onChange={e => setTemp(e.target.value)} placeholder={String(defaultTemp)} step="1" />
      </div>
      <QuickAddButtons onSave={save} onCancel={onCancel} />
    </div>
  )
}

function QuickAddButtons({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  return (
    <div className="flex gap-2">
      <Btn variant="secondary" onClick={onCancel} className="flex-1 !py-1.5 text-xs">Cancel</Btn>
      <Btn onClick={onSave} className="flex-1 !py-1.5 text-xs">Save</Btn>
    </div>
  )
}
