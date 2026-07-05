import type { MuscleStatusRow } from '../../../lib/adaptations'
import { STATUS_STYLE } from './MuscleStatusList'

const NEUTRAL = '#e2e8f0'
const OUTLINE = '#94a3b8'

/**
 * Schematic front/back figure whose six zones (Shoulders, Chest/Back, Arms,
 * Core, Legs) are tinted by their weekly status for the selected adaptation.
 * Zones are keyed to the top-level muscle groups shown in the bar list.
 */
export function BodyMap({ muscles }: { muscles: MuscleStatusRow[] }) {
  const statusByName = new Map(muscles.map(m => [m.name.toLowerCase(), m.status]))
  const fill = (group: string) => {
    const st = statusByName.get(group.toLowerCase())
    return st ? STATUS_STYLE[st].bar : NEUTRAL
  }

  return (
    <div className="flex justify-center gap-6">
      <Figure torso="Chest" label="Front" fill={fill} />
      <Figure torso="Back" label="Back" fill={fill} />
    </div>
  )
}

function Figure({ torso, label, fill }: { torso: 'Chest' | 'Back'; label: string; fill: (g: string) => string }) {
  const zone = { stroke: OUTLINE, strokeWidth: 0.8 }
  return (
    <div className="flex flex-col items-center gap-1">
      <svg viewBox="0 0 120 226" className="w-24 h-auto" role="img" aria-label={`${label} body map`}>
        {/* arms */}
        <g {...zone}>
          <rect x="27" y="48" width="11" height="32" rx="5" fill={fill('Arms')} />
          <rect x="24" y="79" width="10" height="30" rx="5" fill={fill('Arms')} />
          <rect x="82" y="48" width="11" height="32" rx="5" fill={fill('Arms')} />
          <rect x="86" y="79" width="10" height="30" rx="5" fill={fill('Arms')} />
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
