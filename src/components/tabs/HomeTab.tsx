import { useState } from 'react'
import { useAppStore } from '../../store/app'
import { usePrefs } from '../../store/prefs'
import { cycleInfo, getGrouped, weekKey, today } from '../../lib/utils'
import { CYCLE } from '../../constants/app'
import { Card, SecTitle } from '../ui/Card'
import { Chip } from '../ui/Chip'
import { MiniChart } from '../ui/MiniChart'
import type { ActiveProgram } from '../../types'

interface HomeTabProps {
  setTab: (t: string) => void
}

function ProgramHeroCard({ ap, setTab }: { ap: ActiveProgram; setTab: (t: string) => void }) {
  const { week, isDeload, isComplete } = cycleInfo(ap)
  const progDay = ap.days[ap.currentDayIndex % ap.days.length]

  if (isComplete) {
    return (
      <button
        onClick={() => setTab('Program')}
        className="text-left w-full rounded-2xl p-4 bg-accent-l border-2 border-accent"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide mb-0.5 text-accent">
              🎉 Cycle Complete
            </p>
            <p className="text-sm font-bold mb-0.5 text-accent">{ap.name}</p>
            <p className="text-xs text-accent/70">Tap to restart or configure a new program</p>
          </div>
          <span className="text-2xl text-accent/60">→</span>
        </div>
      </button>
    )
  }

  return (
    <button
      onClick={() => setTab('Program')}
      className={`text-left w-full rounded-2xl p-4 ${isDeload ? 'bg-dl-bg border-2 border-dl-bd' : 'bg-primary shadow-lg'}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-[11px] font-semibold uppercase tracking-wide mb-0.5 ${isDeload ? 'text-dl-tx' : 'text-white/60'}`}>
            {isDeload ? `⚠️ Deload — ${ap.name}` : `${ap.name} · Week ${week} of ${CYCLE}`}
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
  )
}

const WATER_PILLS = [100, 200, 300, 400, 500]

export function HomeTab({ setTab }: HomeTabProps) {
  const { weights, bodyweight, cardio, mobility, skills, donations, water, addWaterEntry, setToast, programs } = useAppStore()
  const { sections, weekStartDay } = usePrefs()

  const homeOn = (key: string) => {
    if (sections.length === 0) return true
    return sections.find(s => s.sectionKey === key)?.showInHome ?? true
  }

  const sectionOrder = sections.length > 0
    ? Object.fromEntries(sections.map(s => [s.sectionKey, s.sortOrder]))
    : {} as Record<string, number>

  // Charts
  const bwChart = [...bodyweight]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-20)
    .map(d => ({ x: d.date.slice(5), y: d.weight }))

  const exMap: Record<string, number> = {}
  weights.forEach(e => { exMap[e.exercise] = (exMap[e.exercise] || 0) + 1 })
  const topExercises = Object.entries(exMap).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([ex]) => ex)
  const topEx = topExercises[0]
  const [selectedExercise, setSelectedExercise] = useState<string | undefined>(undefined)
  const activeExercise = selectedExercise && topExercises.includes(selectedExercise) ? selectedExercise : topEx

  const activeExerciseEntries = weights
    .filter(d => d.exercise === activeExercise)
    .sort((a, b) => a.date.localeCompare(b.date))
  const liftMaxes = activeExerciseEntries.map(d => Math.max(...d.sets.map(s => s.weight)))
  const liftChart = activeExerciseEntries.map((d, i) => ({ x: d.date.slice(5), y: liftMaxes[i] }))
  const latestLiftMax = liftMaxes[liftMaxes.length - 1]
  const prevLiftMax = liftMaxes[liftMaxes.length - 2]
  const liftDiff = latestLiftMax != null && prevLiftMax != null ? +(latestLiftMax - prevLiftMax).toFixed(1) : null
  const isLiftPR = latestLiftMax != null && liftMaxes.length > 0 && latestLiftMax >= Math.max(...liftMaxes)

  const cardioChart = [...cardio]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-8)
    .map(d => ({ x: d.date.slice(5), y: d.duration }))

  const thisWeek = weekKey(today(), weekStartDay)
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
  const weekStr = weekAgo.toISOString().slice(0, 10)
  const liftWeek = [...new Set(weights.filter(d => d.date >= weekStr).map(d => d.date))].length
  const cardioWeek = cardio.filter(d => d.date >= weekStr).length
  const mobWeek = mobility.filter(d => d.date >= weekStr).length
  const sortedBw = [...bodyweight].sort((a, b) => b.date.localeCompare(a.date))
  const latestBw = sortedBw[0]
  const prevBw = sortedBw[1]
  const bwDiff = latestBw && prevBw ? +(latestBw.weight - prevBw.weight).toFixed(1) : null

  const skillWeekMap: Record<string, number> = {}
  skills.forEach(s => { if (weekKey(s.date, weekStartDay) === thisWeek) skillWeekMap[s.skill] = (skillWeekMap[s.skill] || 0) + 1 })

  const todayWaterMl = water.filter(w => w.date === today()).reduce((s, w) => s + w.amountMl, 0)
  const addWater = (ml: number) => {
    addWaterEntry({ date: today(), amountMl: ml })
    setToast(`✅ +${ml} ml water`)
  }

  const lastFull = [...donations].filter(d => d.type === 'Full Blood').sort((a, b) => b.date.localeCompare(a.date))[0]
  const nextDonDate = lastFull
    ? new Date(new Date(lastFull.date).getTime() + 56 * 86400000).toISOString().slice(0, 10)
    : null
  const donDaysLeft = nextDonDate
    ? Math.ceil((new Date(nextDonDate).getTime() - new Date(today()).getTime()) / 86400000)
    : null

  const statsGridAll = [
    { label: 'Lifts',    value: liftWeek,                              emoji: '🏋️', tab: 'Weights',     sectionKey: 'Weights' },
    { label: 'Cardio',   value: cardioWeek,                            emoji: '❤️', tab: 'Cardio',      sectionKey: 'Cardio' },
    { label: 'Mobility', value: mobWeek,                               emoji: '🧘', tab: 'Mobility',    sectionKey: 'Mobility' },
    { label: 'Weight',   value: latestBw ? `${latestBw.weight}` : '–', emoji: '⚖️', tab: 'Body Weight', sectionKey: 'Body Weight' },
  ]
  const statsGrid = statsGridAll.filter(s => homeOn(s.sectionKey))

  return (
    <div className="flex flex-col gap-4">
      {/* Program hero cards */}
      {programs.length > 0 ? (
        programs.map(ap => (
          <ProgramHeroCard key={ap.userProgramId} ap={ap} setTab={setTab} />
        ))
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

      {/* Optional home cards — sorted & gated by prefs */}
      {[
        {
          key: 'Skills',
          order: sectionOrder['Skills'] ?? 4,
          show: homeOn('Skills') && Object.entries(skillWeekMap).length > 0,
          node: (
            <Card key="Skills">
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
          ),
        },
        {
          key: 'Donations',
          order: sectionOrder['Donations'] ?? 5,
          show: homeOn('Donations') && donDaysLeft !== null,
          node: (
            <Card key="Donations" className={donDaysLeft !== null && donDaysLeft <= 0 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}>
              <p className="text-xs text-muted mb-0.5">🩸 Next Full Blood Donation</p>
              <p className={`text-base font-bold ${donDaysLeft !== null && donDaysLeft <= 0 ? 'text-success' : 'text-warning'}`}>
                {donDaysLeft !== null && donDaysLeft <= 0 ? '✅ Eligible now' : `In ${donDaysLeft} days (${nextDonDate})`}
              </p>
            </Card>
          ),
        },
        {
          key: 'Body Weight',
          order: sectionOrder['Body Weight'] ?? 1,
          show: homeOn('Body Weight'),
          node: (
            <Card key="Body Weight">
              <div className="flex items-center justify-between mb-2">
                <SecTitle className="mb-0">⚖️ Body Weight</SecTitle>
                {bwDiff != null && (
                  <span className={`text-xs font-bold ${bwDiff === 0 ? 'text-muted' : bwDiff > 0 ? 'text-danger' : 'text-success'}`}>
                    {bwDiff > 0 ? `+${bwDiff}` : bwDiff} kg
                  </span>
                )}
              </div>
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
          ),
        },
        {
          key: 'Weights',
          order: sectionOrder['Weights'] ?? 0,
          show: homeOn('Weights'),
          node: (
            <Card key="Weights">
              <div className="flex items-center justify-between mb-2">
                <SecTitle className="mb-0">🏋️ Lifting</SecTitle>
                {liftDiff != null && (
                  <span className={`text-xs font-bold ${liftDiff === 0 ? 'text-muted' : liftDiff > 0 ? 'text-success' : 'text-danger'}`}>
                    {liftDiff > 0 ? `+${liftDiff}` : liftDiff} kg
                  </span>
                )}
              </div>
              {topExercises.length > 1 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {topExercises.map(ex => (
                    <Chip key={ex} small active={ex === activeExercise} onClick={() => setSelectedExercise(ex)}>
                      {ex}
                    </Chip>
                  ))}
                </div>
              )}
              {activeExercise ? (
                <>
                  {topExercises.length <= 1 && (
                    <p className="text-[11px] text-muted font-medium mb-0.5">{activeExercise}</p>
                  )}
                  <p className="text-xl font-bold text-primary mb-2 flex items-center gap-1.5">
                    {latestLiftMax ?? '–'} <span className="text-sm text-muted font-normal">kg</span>
                    {isLiftPR && liftMaxes.length > 1 && <span className="text-xs font-bold text-accent">🏆 PR</span>}
                  </p>
                  {liftChart.length >= 2 ? (
                    <MiniChart data={liftChart} color="#1e293b" />
                  ) : (
                    <button onClick={() => setTab('Weights')} className="text-sm text-accent">+ Log another session</button>
                  )}
                </>
              ) : (
                <button onClick={() => setTab('Weights')} className="text-sm text-accent">+ Log first session</button>
              )}
            </Card>
          ),
        },
        {
          key: 'Cardio',
          order: sectionOrder['Cardio'] ?? 2,
          show: homeOn('Cardio') && cardioChart.length >= 2,
          node: (
            <Card key="Cardio">
              <SecTitle>Cardio</SecTitle>
              <MiniChart data={cardioChart} color="#10b981" />
            </Card>
          ),
        },
        {
          key: 'Water',
          order: sectionOrder['Water'] ?? 6,
          show: homeOn('Water'),
          node: (
            <Card key="Water">
              <SecTitle>💧 Water</SecTitle>
              <p className="text-xl font-bold text-primary mb-2 flex items-center gap-1.5">
                <span className="text-lg">🥤</span>
                {todayWaterMl} <span className="text-sm text-muted font-normal">ml today</span>
              </p>
              <div className="flex gap-1.5">
                {WATER_PILLS.map(ml => (
                  <button
                    key={ml}
                    onClick={() => addWater(ml)}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold border border-border bg-bg text-primary hover:bg-accent-l hover:text-accent hover:border-accent transition-colors flex flex-col items-center gap-0.5"
                  >
                    <span className="text-sm leading-none">💧</span>
                    +{ml}
                  </button>
                ))}
              </div>
            </Card>
          ),
        },
      ]
        .filter(item => item.show)
        .sort((a, b) => a.order - b.order)
        .map(item => item.node)}
    </div>
  )
}
