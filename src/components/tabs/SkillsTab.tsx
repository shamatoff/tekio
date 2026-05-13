import { useState } from 'react'
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts'
import { useAppStore } from '../../store/app'
import { today, weekKey } from '../../lib/utils'
import { Card, SecTitle, EmptyMsg } from '../ui/Card'
import { Inp } from '../ui/Input'
import { Btn, DelBtn } from '../ui/Button'
import { SmartInput } from '../ui/SmartInput'
import type { QualityRating } from '../../types'

const STARS = [1, 2, 3, 4, 5]

export function SkillsTab() {
  const [skill, setSkill] = useState('')
  const [date, setDate] = useState(today())
  const [withTrainer, setWithTrainer] = useState(false)
  const [quality, setQuality] = useState(0)
  const [notes, setNotes] = useState('')
  const [selSkill, setSelSkill] = useState('')
  const { skills, addSkillEntry, removeSkillEntry, setToast } = useAppStore()

  const allSkills = [...new Set(skills.map(d => d.skill))].sort()

  const handleSelectSkill = (n: string) => {
    setSkill(n)
    setSelSkill(n)
    const prev = skills.filter(d => d.skill.toLowerCase() === n.trim().toLowerCase())
      .sort((a, b) => b.date.localeCompare(a.date))[0]
    if (prev) { setWithTrainer(prev.withTrainer); setQuality(prev.quality) }
  }

  const add = async () => {
    if (!skill.trim()) return
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await addSkillEntry({ skill: skill.trim() as any, date, withTrainer, quality: quality as QualityRating, notes })
      setSkill(''); setNotes(''); setQuality(0); setWithTrainer(false)
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

  const recent = [...skills].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30)

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <SecTitle>Log Session</SecTitle>
        <div className="flex flex-col gap-2.5 mb-3">
          <div>
            <p className="text-xs text-muted font-medium mb-1">Skill</p>
            <SmartInput
              value={skill}
              onChange={setSkill}
              suggestions={allSkills}
              placeholder="e.g. Tennis, Swimming"
            />
          </div>
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
          <Inp label="Notes (opt.)" value={notes} onChange={e => setNotes(e.target.value)} placeholder="How did it go?" />
        </div>
        <Btn onClick={add} className="w-full">Log Session</Btn>
      </Card>

      {allSkills.length > 0 && (
        <Card>
          <SecTitle>Sessions per Week — {chartSkill}</SecTitle>
          <select
            value={chartSkill}
            onChange={e => setSelSkill(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface text-primary mb-3 focus:outline-none"
          >
            {allSkills.map(s => <option key={s}>{s}</option>)}
          </select>
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
        {recent.length === 0 ? (
          <EmptyMsg>No sessions yet</EmptyMsg>
        ) : (
          recent.map(d => (
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
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted">{d.date}</span>
                  <DelBtn onClick={() => removeSkillEntry(d.id)} />
                </div>
              </div>
              {d.notes && <p className="text-xs text-muted italic mt-1">{d.notes}</p>}
            </div>
          ))
        )}
      </Card>
    </div>
  )
}
