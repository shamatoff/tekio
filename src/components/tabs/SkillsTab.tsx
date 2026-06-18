import { useState } from 'react'
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts'
import { useAppStore } from '../../store/app'
import { today, weekKey } from '../../lib/utils'
import { Card, SecTitle } from '../ui/Card'
import { Inp } from '../ui/Input'
import { Btn, DelBtn, EditBtn } from '../ui/Button'
import { SmartInput } from '../ui/SmartInput'
import { ChipListInput } from '../ui/ChipListInput'
import { HistoryList } from '../ui/HistoryList'
import type { QualityRating, MatchResult, NewSkillFlags } from '../../types'

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

export function SkillsTab() {
  const [skill, setSkill] = useState('')
  const [date, setDate] = useState(today())
  const [withTrainer, setWithTrainer] = useState(false)
  const [quality, setQuality] = useState(0)
  const [notes, setNotes] = useState('')
  const [competitorNames, setCompetitorNames] = useState<string[]>([])
  const [result, setResult] = useState<MatchResult | ''>('')
  const [teammates, setTeammates] = useState<string[]>([])
  const [newSkillHasCompetitor, setNewSkillHasCompetitor] = useState(false)
  const [newSkillHasTeammate, setNewSkillHasTeammate] = useState(false)
  const [selSkill, setSelSkill] = useState('')
  const [statsCompetitor, setStatsCompetitor] = useState('')
  const [statsTimeFrame, setStatsTimeFrame] = useState<TimeFrame>('All time')
  const { skills, skillTypes, addSkillEntry, removeSkillEntry, openEditModal, setToast } = useAppStore()

  const allSkills = [...new Set(skills.map(d => d.skill))].sort()
  const allCompetitors = [...new Set(skills.flatMap(d => d.competitorNames ?? []))].sort()
  const allTeammates = [...new Set(skills.flatMap(d => d.teammateNames ?? []))].sort()
  const existingType = skillTypes.find(t => t.name.toLowerCase() === skill.trim().toLowerCase())
  const isNewSkill = skill.trim() !== '' && !existingType
  const hasCompetitor = existingType ? existingType.hasCompetitor : (isNewSkill && newSkillHasCompetitor)
  const hasTeammate = existingType ? existingType.hasTeammate : (isNewSkill && newSkillHasTeammate)

  const handleSelectSkill = (n: string) => {
    setSkill(n)
    setSelSkill(n)
    const prev = skills.filter(d => d.skill.toLowerCase() === n.trim().toLowerCase())
      .sort((a, b) => b.date.localeCompare(a.date))[0]
    if (prev) { setWithTrainer(prev.withTrainer); setQuality(prev.quality) }
  }

  const add = async () => {
    if (!skill.trim()) return
    const newSkillFlags: NewSkillFlags | undefined = isNewSkill
      ? { hasCompetitor: newSkillHasCompetitor, hasTeammate: newSkillHasTeammate }
      : undefined
    try {
      await addSkillEntry({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        skill: skill.trim() as any,
        date,
        withTrainer,
        quality: quality as QualityRating,
        notes,
        competitorNames: hasCompetitor ? (competitorNames.length ? competitorNames : undefined) : undefined,
        result: hasCompetitor ? (result || undefined) : undefined,
        teammateNames: hasTeammate ? teammates : undefined,
      }, newSkillFlags)
      setSkill(''); setNotes(''); setQuality(0); setWithTrainer(false)
      setCompetitorNames([]); setResult(''); setTeammates([])
      setNewSkillHasCompetitor(false); setNewSkillHasTeammate(false)
      setToast('✅ Session logged!')
    } catch {
      setToast('❌ Failed to save.')
    }
  }

  const chartSkill = selSkill || allSkills[0] || ''
  const weekMap: Record<string, number> = {}
  skills.filter(d => d.skill === chartSkill).forEach(d => {
    const wk = weekKey(d.date)
    weekMap[wk] = (weekMap[wk] || 0) + 1
  })
  const chartData = Object.entries(weekMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, sessions]) => ({ week, sessions }))

  const chartSkillType = skillTypes.find(t => t.name.toLowerCase() === chartSkill.toLowerCase())
  const chartHasCompetitor = chartSkillType?.hasCompetitor ?? false
  const competitorsForChartSkill = [...new Set(
    skills.filter(d => d.skill === chartSkill).flatMap(d => d.competitorNames ?? [])
  )].sort()
  const statsEntries = skills.filter(d =>
    d.skill === chartSkill &&
    d.result &&
    withinTimeFrame(d.date, statsTimeFrame) &&
    (!statsCompetitor || (d.competitorNames ?? []).includes(statsCompetitor))
  )
  const wins = statsEntries.filter(d => d.result === 'win').length
  const losses = statsEntries.filter(d => d.result === 'loss').length
  const ties = statsEntries.filter(d => d.result === 'tie').length

  const sortedSkills = [...skills].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <SecTitle>Log Session</SecTitle>
        <div className="flex flex-col gap-2.5 mb-3">
          <div>
            <p className="text-xs text-muted font-medium mb-1">Skill</p>
            <SmartInput
              value={skill}
              onChange={handleSelectSkill}
              suggestions={allSkills}
              placeholder="e.g. Tennis, Swimming"
            />
          </div>
          {isNewSkill && (
            <div className="flex flex-col gap-1.5 px-3 py-2 rounded-lg bg-bg border border-border">
              <p className="text-xs text-muted font-medium">New skill — what should this track?</p>
              <label className="flex items-center gap-2 text-xs text-primary">
                <input type="checkbox" checked={newSkillHasCompetitor} onChange={e => setNewSkillHasCompetitor(e.target.checked)} />
                Competitor (opponent + win/loss)
              </label>
              <label className="flex items-center gap-2 text-xs text-primary">
                <input type="checkbox" checked={newSkillHasTeammate} onChange={e => setNewSkillHasTeammate(e.target.checked)} />
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

      {allSkills.length > 0 && (
        <Card>
          <SecTitle>Sessions per Week — {chartSkill}</SecTitle>
          <select
            value={chartSkill}
            onChange={e => { setSelSkill(e.target.value); setStatsCompetitor('') }}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface text-primary mb-3 focus:outline-none"
          >
            {allSkills.map(s => <option key={s}>{s}</option>)}
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
                  {competitorsForChartSkill.map(c => <option key={c}>{c}</option>)}
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
          items={sortedSkills}
          getDate={d => d.date}
          categories={allSkills}
          categoryLabel="Skill"
          matchesCategory={(d, cat) => d.skill === cat}
          emptyMessage="No sessions yet"
          renderItem={d => (
            <div key={d.id} className="pb-2 mb-2 border-b border-bg last:border-0 last:mb-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-primary">{d.skill}</span>
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
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted">{d.date}</span>
                  <EditBtn onClick={() => openEditModal({ type: 'skill', record: d })} />
                  <DelBtn onClick={() => removeSkillEntry(d.id)} />
                </div>
              </div>
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
