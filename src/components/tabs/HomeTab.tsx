import { useAppStore } from '../../store/app'
import { cycleInfo, getGrouped, weekKey, today } from '../../lib/utils'
import { CYCLE } from '../../constants/app'
import { Card, SecTitle } from '../ui/Card'
import { MiniChart } from '../ui/MiniChart'

interface HomeTabProps {
  setTab: (t: string) => void
}

export function HomeTab({ setTab }: HomeTabProps) {
  const { weights, bodyweight, cardio, mobility, skills, donations, program } = useAppStore()

  const { week, isDeload } = cycleInfo(program)
  const progDay = program ? program.days[program.currentDayIndex % program.days.length] : null

  // Charts
  const bwChart = [...bodyweight]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-20)
    .map(d => ({ x: d.date.slice(5), y: d.weight }))

  const exMap: Record<string, number> = {}
  weights.forEach(e => { exMap[e.exercise] = (exMap[e.exercise] || 0) + 1 })
  const topEx = Object.entries(exMap).sort((a, b) => b[1] - a[1])[0]?.[0]
  const liftChart = weights
    .filter(d => d.exercise === topEx)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(d => ({ x: d.date.slice(5), y: Math.max(...d.sets.map(s => s.weight)) }))

  const cardioChart = [...cardio]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-8)
    .map(d => ({ x: d.date.slice(5), y: d.duration }))

  // This week stats
  const thisWeek = weekKey(today())
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
  const weekStr = weekAgo.toISOString().slice(0, 10)
  const liftWeek = [...new Set(weights.filter(d => d.date >= weekStr).map(d => d.date))].length
  const cardioWeek = cardio.filter(d => d.date >= weekStr).length
  const mobWeek = mobility.filter(d => d.date >= weekStr).length
  const latestBw = [...bodyweight].sort((a, b) => b.date.localeCompare(a.date))[0]

  // Skills this week
  const skillWeekMap: Record<string, number> = {}
  skills.forEach(s => { if (weekKey(s.date) === thisWeek) skillWeekMap[s.skill] = (skillWeekMap[s.skill] || 0) + 1 })

  // Donation eligibility
  const lastFull = [...donations].filter(d => d.type === 'Full Blood').sort((a, b) => b.date.localeCompare(a.date))[0]
  const nextDonDate = lastFull
    ? new Date(new Date(lastFull.date).getTime() + 56 * 86400000).toISOString().slice(0, 10)
    : null
  const donDaysLeft = nextDonDate
    ? Math.ceil((new Date(nextDonDate).getTime() - new Date(today()).getTime()) / 86400000)
    : null

  const statsGrid = [
    { label: 'Lifts', value: liftWeek, emoji: '🏋️', tab: 'Weights' },
    { label: 'Cardio', value: cardioWeek, emoji: '❤️', tab: 'Cardio' },
    { label: 'Mobility', value: mobWeek, emoji: '🧘', tab: 'Mobility' },
    { label: 'Weight', value: latestBw ? `${latestBw.weight}` : '–', emoji: '⚖️', tab: 'Body Weight' },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Program hero card */}
      {program ? (
        <button
          onClick={() => setTab('Program')}
          className={`text-left w-full rounded-2xl p-4 ${isDeload ? 'bg-dl-bg border-2 border-dl-bd' : 'bg-primary shadow-lg'}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-[11px] font-semibold uppercase tracking-wide mb-0.5 ${isDeload ? 'text-dl-tx' : 'text-white/60'}`}>
                {isDeload ? '⚠️ Deload Week' : `Week ${week} of ${CYCLE}`}
              </p>
              <p className={`text-sm font-bold mb-0.5 ${isDeload ? 'text-dl-tx' : 'text-white'}`}>
                {progDay?.name || 'No day set'}
              </p>
              <p className={`text-xs ${isDeload ? 'text-dl-tx' : 'text-white/50'}`}>
                {getGrouped(progDay).map(g =>
                  g.type === 'superset' ? `[SS: ${g.exercises.join('+')}]` : g.exercises[0]
                ).join(' · ')}
              </p>
            </div>
            <span className={`text-2xl ${isDeload ? 'text-dl-tx' : 'text-white/70'}`}>→</span>
          </div>
          {!isDeload && (
            <div className="flex gap-1 mt-3">
              {Array.from({ length: CYCLE }, (_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-0.5 rounded-full ${i < week - 1 ? 'bg-white/90' : i === week - 1 ? 'bg-white/50' : 'bg-white/15'}`}
                />
              ))}
            </div>
          )}
        </button>
      ) : (
        <button
          onClick={() => setTab('Program')}
          className="text-left w-full border-2 border-dashed border-border bg-surface rounded-2xl p-4"
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">📋</span>
            <div>
              <p className="text-sm font-bold text-primary mb-0.5">Set up your training program</p>
              <p className="text-xs text-muted">Get guided sessions with progressive overload targets</p>
            </div>
          </div>
        </button>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-2">
        {statsGrid.map(s => (
          <button
            key={s.label}
            onClick={() => setTab(s.tab)}
            className="bg-surface rounded-xl border border-border py-2.5 px-1.5 text-center"
          >
            <div className="text-xl mb-0.5">{s.emoji}</div>
            <div className="text-base font-bold text-primary">{s.value}</div>
            <div className="text-[10px] text-muted font-medium">{s.label}</div>
          </button>
        ))}
      </div>

      {/* Skills this week */}
      {Object.entries(skillWeekMap).length > 0 && (
        <Card>
          <SecTitle>Skills This Week</SecTitle>
          <div className="flex flex-wrap gap-2">
            {Object.entries(skillWeekMap).map(([sk, count]) => (
              <button
                key={sk}
                onClick={() => setTab('Skills')}
                className="px-3 py-1.5 rounded-full bg-accent-l text-accent text-sm font-semibold"
              >
                {sk} <span className="opacity-70">{count}×</span>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Donation eligibility */}
      {donDaysLeft !== null && (
        <Card className={donDaysLeft <= 0 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}>
          <p className="text-xs text-muted mb-0.5">🩸 Next Full Blood Donation</p>
          <p className={`text-base font-bold ${donDaysLeft <= 0 ? 'text-success' : 'text-warning'}`}>
            {donDaysLeft <= 0 ? '✅ Eligible now' : `In ${donDaysLeft} days (${nextDonDate})`}
          </p>
        </Card>
      )}

      {/* Body weight mini card */}
      <Card>
        <SecTitle>Body Weight</SecTitle>
        {latestBw && (
          <p className="text-xl font-bold text-primary mb-2">
            {latestBw.weight} <span className="text-sm text-muted font-normal">kg</span>
          </p>
        )}
        {bwChart.length >= 2 ? (
          <MiniChart data={bwChart} color="#6366f1" />
        ) : (
          <button onClick={() => setTab('Body Weight')} className="text-sm text-accent">+ Log first weigh-in</button>
        )}
      </Card>

      {/* Top lift mini card */}
      <Card>
        <SecTitle>{topEx ? `Lifting — ${topEx}` : 'Lifting'}</SecTitle>
        {liftChart.length >= 2 ? (
          <MiniChart data={liftChart} color="#1e293b" />
        ) : (
          <button onClick={() => setTab('Weights')} className="text-sm text-accent">+ Log first session</button>
        )}
      </Card>

      {/* Cardio mini card */}
      {cardioChart.length >= 2 && (
        <Card>
          <SecTitle>Cardio</SecTitle>
          <MiniChart data={cardioChart} color="#10b981" />
        </Card>
      )}
    </div>
  )
}
