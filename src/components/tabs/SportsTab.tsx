import { useState } from 'react'
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts'
import { useAppStore } from '../../store/app'
import { usePrefs } from '../../store/prefs'
import { today, weekKey, parseDurationMins, formatDurationMins } from '../../lib/utils'
import { Card, SecTitle } from '../ui/Card'
import { Inp } from '../ui/Input'
import { Btn, DelBtn, EditBtn } from '../ui/Button'
import { SmartInput } from '../ui/SmartInput'
import { ChipListInput } from '../ui/ChipListInput'
import { HistoryList } from '../ui/HistoryList'
import type { QualityRating, MatchResult, NewSportFlags } from '../../types'

const STARS = [1, 2, 3, 4, 5]
const TIME_FRAMES = ['All time', 'Last 30 days', 'Last 90 days', 'This year'] as const
type TimeFrame = typeof TIME_FRAMES[number]

function withinTimeFrame(date: string, frame: TimeFrame): boolean {
  if (frame === 'All time') return true
  const d = new Date(date)
  const now = new Date()
  if (frame === 'This year') return d.getFullYear() === now.getFullYear()
  const days = frame === 'Last 30 days' ? 30 : 90
  const cutoff = new Date(now)
  cutoff.setDate(cutoff.getDate() - days)
  return d >= cutoff
}

export function SportsTab() {
  const [sport, setSport] = useState('')
  const [date, setDate] = useState(today())
  const [withTrainer, setWithTrainer] = useState(false)
  const [quality, setQuality] = useState(0)
  const [duration, setDuration] = useState('')
  const [avgHr, setAvgHr] = useState('')
  const [notes, setNotes] = useState('')
  const [competitorNames, setCompetitorNames] = useState<string[]>([])
  const [result, setResult] = useState<MatchResult | ''>('')
  const [teammates, setTeammates] = useState<string[]>([])
  const [newSportHasCompetitor, setNewSportHasCompetitor] = useState(false)
  const [newSportHasTeammate, setNewSportHasTeammate] = useState(false)
  const [selSport, setSelSport] = useState('')
  const [statsCompetitor, setStatsCompetitor] = useState('')
  const [statsTimeFrame, setStatsTimeFrame] = useState<TimeFrame>('All time')
  const { sports, sportTypes, addSportEntry, removeSportEntry, openEditModal, setToast } = useAppStore()
  const { weekStartDay } = usePrefs()

  const allSports = [...new Set(sports.map(d => d.sport))].sort()
  const allCompetitors = [...new Set(sports.flatMap(d => d.competitorNames ?? []))].sort()
  const allTeammates = [...new Set(sports.flatMap(d => d.teammateNames ?? []))].sort()
  const existingType = sportTypes.find(t => t.name.toLowerCase() === sport.trim().toLowerCase())
  const isNewSport = sport.trim() !== '' && !existingType
  const hasCompetitor = existingType ? existingType.hasCompetitor : (isNewSport && newSportHasCompetitor)
  const hasTeammate = existingType ? existingType.hasTeammate : (isNewSport && newSportHasTeammate)

  const handleSelectSport = (n: string) => {
    setSport(n)
    setSelSport(n)
    const prev = sports.filter(d => d.sport.toLowerCase() === n.trim().toLowerCase())
      .sort((a, b) => b.date.localeCompare(a.date))[0]
    if (prev) { setWithTrainer(prev.withTrainer); setQuality(prev.quality) }
  }

  const add = async () => {
    if (!sport.trim()) return
    const newSportFlags: NewSportFlags | undefined = isNewSport
      ? { hasCompetitor: newSportHasCompetitor, hasTeammate: newSportHasTeammate }
      : undefined
    try {
      await addSportEntry({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sport: sport.trim() as any,
        date,
        withTrainer,
        quality: quality as QualityRating,
        duration: parseDurationMins(duration) || undefined,
        avgHr: avgHr ? +avgHr : undefined,
        notes,
        competitorNames: hasCompetitor ? (competitorNames.length ? competitorNames : undefined) : undefined,
        result: hasCompetitor ? (result || undefined) : undefined,
        teammateNames: hasTeammate ? teammates : undefined,
      }, newSportFlags)
      setSport(''); setNotes(''); setQuality(0); setWithTrainer(false)
      setDuration(''); setAvgHr('')
      setCompetitorNames([]); setResult(''); setTeammates([])
      setNewSportHasCompetitor(false); setNewSportHasTeammate(false)
      setToast('✅ Session logged!')
    } catch {
      setToast('❌ Failed to save.')
    }
  }

  const chartSport = selSport || allSports[0] || ''
  const weekMap: Record<string, number> = {}
  sports.filter(d => d.sport === chartSport).forEach(d => {
    const wk = weekKey(d.date, weekStartDay)
    weekMap[wk] = (weekMap[wk] || 0) + 1
  })
  const chartData = Object.entries(weekMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, sessions]) => ({ week: week.slice(5), sessions }))

  const chartSportType = sportTypes.find(t => t.name.toLowerCase() === chartSport.toLowerCase())
  const chartHasCompetitor = chartSportType?.hasCompetitor ?? false
  const competitorsForChartSport = [...new Set(
    sports.filter(d => d.sport === chartSport).flatMap(d => d.competitorNames ?? [])
  )].sort()
  const statsEntries = sports.filter(d =>
    d.sport === chartSport &&
    d.result &&
    withinTimeFrame(d.date, statsTimeFrame) &&
    (!statsCompetitor || (d.competitorNames ?? []).includes(statsCompetitor))
  )
  const wins = statsEntries.filter(d => d.result === 'win').length
  const losses = statsEntries.filter(d => d.result === 'loss').length
  const ties = statsEntries.filter(d => d.result === 'tie').length

  const sortedSports = [...sports].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <SecTitle>Log Session</SecTitle>
        <div className="flex flex-col gap-2.5 mb-3">
          <div>
            <p className="text-xs text-muted font-medium mb-1">Sport</p>
            <SmartInput
              value={sport}
              onChange={handleSelectSport}
              suggestions={allSports}
              placeholder="e.g. Tennis, Swimming"
            />
          </div>
          {isNewSport && (
            <div className="flex flex-col gap-1.5 px-3 py-2 rounded-lg bg-bg border border-border">
              <p className="text-xs text-muted font-medium">New sport — what should this track?</p>
              <label className="flex items-center gap-2 text-xs text-primary">
                <input type="checkbox" checked={newSportHasCompetitor} onChange={e => setNewSportHasCompetitor(e.target.checked)} />
                Competitor (opponent + win/loss)
              </label>
              <label className="flex items-center gap-2 text-xs text-primary">
                <input type="checkbox" checked={newSportHasTeammate} onChange={e => setNewSportHasTeammate(e.target.checked)} />
                Teammate(s)
              </label>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2.5">
            <Inp label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
            <div>
              <p className="text-xs text-muted font-medium mb-1">With Trainer?</p>
              <div className="flex gap-1.5">
                {([false, true] as boolean[]).map(v => (
                  <button
                    key={String(v)}
                    onClick={() => setWithTrainer(v)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors ${withTrainer === v ? 'border-accent bg-accent-l text-accent' : 'border-border bg-surface text-muted'}`}
                  >
                    {v ? 'Yes' : 'No'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <Inp
              label="Duration (MM:SS, opt.)"
              type="text"
              value={duration}
              onChange={e => setDuration(e.target.value)}
              placeholder="60:00"
            />
            <Inp
              label="Avg HR (bpm, opt.)"
              type="number"
              value={avgHr}
              onChange={e => setAvgHr(e.target.value)}
              placeholder="130"
              min="0"
              step="1"
            />
          </div>
          <div>
            <p className="text-xs text-muted font-medium mb-1">Quality</p>
            <div className="flex gap-1 items-center">
              {STARS.map(s => (
                <button
                  key={s}
                  onClick={() => setQuality(q => q === s ? 0 : s)}
                  className={`text-2xl transition-colors ${s <= quality ? 'text-warning' : 'text-border'}`}
                >
                  ★
                </button>
              ))}
              {quality > 0 && <span className="text-xs text-muted ml-1">{quality}/5</span>}
            </div>
          </div>
          {hasCompetitor && (
            <>
              <div>
                <p className="text-xs text-muted font-medium mb-1">Competitor(s) (opt.)</p>
                <ChipListInput items={competitorNames} onChange={setCompetitorNames} suggestions={allCompetitors} placeholder="Add competitor" />
              </div>
              <div>
                <p className="text-xs text-muted font-medium mb-1">Result</p>
                <div className="flex gap-1.5">
                  {(['win', 'loss', 'tie'] as MatchResult[]).map(r => (
                    <button
                      key={r}
                      onClick={() => setResult(rv => rv === r ? '' : r)}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors capitalize ${result === r ? 'border-accent bg-accent-l text-accent' : 'border-border bg-surface text-muted'}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          {hasTeammate && (
            <div>
              <p className="text-xs text-muted font-medium mb-1">Teammate(s) (opt.)</p>
              <ChipListInput items={teammates} onChange={setTeammates} suggestions={allTeammates} placeholder="Add teammate" />
            </div>
          )}
          <Inp label="Notes (opt.)" value={notes} onChange={e => setNotes(e.target.value)} placeholder="How did it go?" />
        </div>
        <Btn onClick={add} className="w-full">Log Session</Btn>
      </Card>

      {allSports.length > 0 && (
        <Card>
          <SecTitle>Sessions per Week — {chartSport}</SecTitle>
          <select
            value={chartSport}
            onChange={e => { setSelSport(e.target.value); setStatsCompetitor('') }}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface text-primary mb-3 focus:outline-none"
          >
            {allSports.map(s => <option key={s}>{s}</option>)}
          </select>
          {chartHasCompetitor && (
            <div className="flex flex-col gap-2.5 mb-3 px-3 py-2.5 rounded-lg bg-bg border border-border">
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={statsCompetitor}
                  onChange={e => setStatsCompetitor(e.target.value)}
                  className="border border-border rounded-lg px-2 py-1.5 text-xs bg-surface text-primary focus:outline-none"
                >
                  <option value="">All competitors</option>
                  {competitorsForChartSport.map(c => <option key={c}>{c}</option>)}
                </select>
                <select
                  value={statsTimeFrame}
                  onChange={e => setStatsTimeFrame(e.target.value as TimeFrame)}
                  className="border border-border rounded-lg px-2 py-1.5 text-xs bg-surface text-primary focus:outline-none"
                >
                  {TIME_FRAMES.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div className="flex items-center justify-center gap-6">
                <div className="text-center">
                  <p className="text-lg font-bold text-green-700">{wins}</p>
                  <p className="text-[10px] text-muted font-medium">Win</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-red-700">{losses}</p>
                  <p className="text-[10px] text-muted font-medium">Loss</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-600">{ties}</p>
                  <p className="text-[10px] text-muted font-medium">Tie</p>
                </div>
              </div>
            </div>
          )}
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#64748b' }} angle={-25} textAnchor="end" height={36} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} width={20} />
                <Tooltip formatter={(v: number) => [v, 'Sessions']} />
                <Bar dataKey="sessions" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted text-center py-6">Not enough data to chart</p>
          )}
        </Card>
      )}

      <Card>
        <SecTitle>Recent Sessions</SecTitle>
        <HistoryList
          items={sortedSports}
          getDate={d => d.date}
          categories={allSports}
          categoryLabel="Sport"
          matchesCategory={(d, cat) => d.sport === cat}
          emptyMessage="No sessions yet"
          renderItem={d => (
            <div key={d.id} className="pb-2 mb-2 border-b border-bg last:border-0 last:mb-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-primary truncate">{d.sport}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs text-muted">{d.date}</span>
                  <EditBtn onClick={() => openEditModal({ type: 'sport', record: d })} />
                  <DelBtn onClick={() => removeSportEntry(d.id)} />
                </div>
              </div>
              {(d.withTrainer || d.quality > 0 || d.result) && (
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  {d.withTrainer && (
                    <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
                      with trainer
                    </span>
                  )}
                  {d.quality > 0 && (
                    <span className="text-xs text-warning">{'★'.repeat(d.quality)}</span>
                  )}
                  {d.result && (
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize ${d.result === 'win' ? 'text-green-700 bg-green-50' : d.result === 'loss' ? 'text-red-700 bg-red-50' : 'text-slate-700 bg-slate-100'}`}>
                      {d.result}
                    </span>
                  )}
                </div>
              )}
              {(d.duration || d.avgHr) && (
                <p className="text-xs text-muted mt-1">
                  {d.duration ? `⏱️ ${formatDurationMins(d.duration)}` : ''}
                  {d.duration && d.avgHr ? ' · ' : ''}
                  {d.avgHr ? `❤️ ${d.avgHr} bpm` : ''}
                </p>
              )}
              {d.competitorNames && d.competitorNames.length > 0 && <p className="text-xs text-muted mt-1">vs {d.competitorNames.join(', ')}</p>}
              {d.teammateNames && d.teammateNames.length > 0 && (
                <p className="text-xs text-muted mt-1">with {d.teammateNames.join(', ')}</p>
              )}
              {d.notes && <p className="text-xs text-muted italic mt-1">{d.notes}</p>}
            </div>
          )}
        />
      </Card>
    </div>
  )
}
