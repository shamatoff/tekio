import type { AdaptationMeta } from '../../../constants/adaptations'
import type { AdaptationSummary } from '../../../lib/adaptations'
import { InfoTip } from '../../ui/InfoTip'
import { AdaptationRxTable } from './AdaptationRx'
import { MuscleStatusList } from './MuscleStatusList'

interface AdaptationCardProps {
  meta: AdaptationMeta
  summary: AdaptationSummary
  open: boolean
  onToggle: () => void
}

export function AdaptationCard({ meta, summary, open, onToggle }: AdaptationCardProps) {
  const isResistance = meta.modality === 'resistance' && meta.weeklyMuscleTarget > 0
  const worked = summary.volume > 0

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden" style={{ borderLeft: `3px solid ${meta.color}` }}>
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle() } }}
        className="w-full flex items-center gap-3 p-3 text-left cursor-pointer active:scale-[0.99] transition-transform"
      >
        <span className="text-2xl w-8 text-center shrink-0">{meta.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold text-primary truncate">{meta.label}</p>
            <span onClick={(e) => e.stopPropagation()}>
              <InfoTip label={`How to train ${meta.label}`} accent={meta.color}>
                <p className="text-xs font-bold text-primary mb-1.5">{meta.icon} {meta.label}</p>
                <AdaptationRxTable rx={meta.rx} />
              </InfoTip>
            </span>
          </div>
          <p className="text-[11px] text-muted truncate">{meta.summary}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-base font-bold tabular-nums" style={{ color: worked ? meta.color : '#94a3b8' }}>
            {summary.volume}
          </p>
          <p className="text-[10px] text-muted -mt-0.5">{summary.unit}</p>
        </div>
        {isResistance && (
          <div className="shrink-0 text-right w-14">
            <p className="text-[11px] font-semibold tabular-nums text-primary">
              {summary.onTrack}/{summary.totalMuscles}
            </p>
            <p className="text-[9px] text-muted -mt-0.5 leading-tight">on track</p>
          </div>
        )}
        <span className="text-muted text-xs shrink-0">{open ? '▾' : '▸'}</span>
      </div>

      {open && (
        <div className="px-3 pb-3 pt-1 border-t border-bg flex flex-col gap-3">
          <div className="bg-bg rounded-lg p-2.5">
            <AdaptationRxTable rx={meta.rx} />
          </div>
          {isResistance ? (
            <div>
              <p className="text-[11px] font-semibold text-muted uppercase tracking-wide mb-2">
                Muscle groups · this week
              </p>
              <MuscleStatusList muscles={summary.muscles} />
            </div>
          ) : (
            <p className="text-[11px] text-muted">
              {worked
                ? `${summary.volume} ${summary.unit} logged this week toward ${meta.label.toLowerCase()}.`
                : `No ${meta.label.toLowerCase()} work logged this week.`}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
