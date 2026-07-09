import type { MuscleStatus, MuscleStatusRow } from '../../../lib/adaptations'
import { STATUS_STYLE } from './MuscleStatusList'

const NEUTRAL = '#e2e8f0'
const OUTLINE = '#94a3b8'

const RANK: Record<MuscleStatus, number> = { on_track: 2, needs_work: 1, untouched: 0 }

/**
 * Schematic front/back figure whose zones (Shoulders, Chest/Back, Arms, Core,
 * Legs) are tinted by their weekly status for the selected adaptation. The arm
 * is split so the upper arm follows Biceps/Triceps and the forearm follows
 * Forearms — otherwise training only grip lights up the whole arm.
 */
export function BodyMap({ muscles }: { muscles: MuscleStatusRow[] }) {
  const topByName = new Map(muscles.map(m => [m.name.toLowerCase(), m]))

  const tint = (st: MuscleStatus | undefined) => (st ? STATUS_STYLE[st].bar : NEUTRAL)

  /** Fill for a top-level zone by its own rolled-up status. */
  const fill = (group: string) => tint(topByName.get(group.toLowerCase())?.status)

  /**
   * Fill from specific child muscles of a top-level group (best status among
   * them). Falls back to the parent's status when no such children exist, so
   * setups without a child breakdown still colour correctly.
   */
  const fillChildren = (topName: string, childNames: string[]) => {
    const top = topByName.get(topName.toLowerCase())
    if (!top) return NEUTRAL
    const wanted = childNames.map(n => n.toLowerCase())
    const kids = top.children.filter(c => wanted.includes(c.name.toLowerCase()))
    if (kids.length === 0) return tint(top.status)
    const best = kids.reduce<MuscleStatus>((acc, c) => (RANK[c.status] > RANK[acc] ? c.status : acc), 'untouched')
    return tint(best)
  }

  const armFill = {
    upper: fillChildren('Arms', ['Biceps', 'Triceps']),
    fore: fillChildren('Arms', ['Forearms']),
  }

  return (
    <div className="flex justify-center gap-6">
      <Figure torso="Chest" label="Front" fill={fill} arm={armFill} />
      <Figure torso="Back" label="Back" fill={fill} arm={armFill} />
    </div>
  )
}

function Figure({
  torso, label, fill, arm,
}: {
  torso: 'Chest' | 'Back'
  label: string
  fill: (g: string) => string
  arm: { upper: string; fore: string }
}) {
  const zone = { stroke: OUTLINE, strokeWidth: 0.8 }
  return (
    <div className="flex flex-col items-center gap-1">
      <svg viewBox="0 0 120 226" className="w-24 h-auto" role="img" aria-label={`${label} body map`}>
        {/* arms: upper (biceps/triceps) then forearm */}
        <g {...zone}>
          <rect x="27" y="48" width="11" height="32" rx="5" fill={arm.upper} />
          <rect x="24" y="79" width="10" height="30" rx="5" fill={arm.fore} />
          <rect x="82" y="48" width="11" height="32" rx="5" fill={arm.upper} />
          <rect x="86" y="79" width="10" height="30" rx="5" fill={arm.fore} />
        </g>
        {/* legs */}
        <g {...zone}>
          <rect x="46" y="110" width="13" height="52" rx="6" fill={fill('Legs')} />
          <rect x="61" y="110" width="13" height="52" rx="6" fill={fill('Legs')} />
          <rect x="47" y="160" width="11" height="56" rx="5" fill={fill('Legs')} />
          <rect x="62" y="160" width="11" height="56" rx="5" fill={fill('Legs')} />
        </g>
        {/* torso: chest (front) or back */}
        <rect x="43" y="42" width="34" height="30" rx="6" fill={fill(torso)} {...zone} />
        {/* core (front) or lower back (back figure) */}
        <rect x="46" y="70" width="28" height="36" rx="5" fill={fill(torso === 'Back' ? 'Lower Back' : 'Core')} {...zone} />
        {/* pelvis bridge (legs colour) */}
        <path d="M46 104 h28 v6 q-14 6 -28 0 z" fill={fill('Legs')} {...zone} />
        {/* shoulders */}
        <g {...zone}>
          <ellipse cx="41" cy="46" rx="12" ry="8" fill={fill('Shoulders')} />
          <ellipse cx="79" cy="46" rx="12" ry="8" fill={fill('Shoulders')} />
        </g>
        {/* neck + head (neutral) */}
        <rect x="55" y="28" width="10" height="8" rx="2" fill={NEUTRAL} {...zone} />
        <circle cx="60" cy="17" r="11" fill={NEUTRAL} {...zone} />
      </svg>
      <span className="text-[10px] text-muted font-medium">{label}</span>
    </div>
  )
}
