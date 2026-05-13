import { useState } from 'react'
import { useAppStore } from '../../store/app'
import { today } from '../../lib/utils'
import { DONATION_TYPES, DONATION_ICONS, DONATION_ELIGIBILITY_DAYS } from '../../constants/app'
import { Card, SecTitle, EmptyMsg } from '../ui/Card'
import { Inp } from '../ui/Input'
import { Btn, DelBtn } from '../ui/Button'
import type { DonationType } from '../../types'

export function DonationsTab() {
  const [date, setDate] = useState(today())
  const [type, setType] = useState<DonationType>('Full Blood')
  const [notes, setNotes] = useState('')
  const { donations, addDonationEntry, removeDonationEntry, setToast } = useAppStore()

  const add = async () => {
    try {
      await addDonationEntry({ date, type, notes })
      setNotes('')
      setToast('✅ Donation logged!')
    } catch {
      setToast('❌ Failed to save.')
    }
  }

  const recent = [...donations].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20)
  const byType = (t: DonationType) => donations.filter(d => d.type === t).sort((a, b) => b.date.localeCompare(a.date))

  const nextDate = (last: typeof donations[0] | undefined, days: number) => {
    if (!last) return null
    const d = new Date(last.date)
    d.setDate(d.getDate() + days)
    return d.toISOString().slice(0, 10)
  }

  const daysUntil = (ds: string | null) =>
    ds ? Math.ceil((new Date(ds).getTime() - new Date(today()).getTime()) / 86400000) : null

  const nextFull = nextDate(byType('Full Blood')[0], 56)
  const nextPlasma = nextDate(byType('Plasma')[0], 14)

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <SecTitle>Log Donation</SecTitle>
        <div className="grid grid-cols-2 gap-2.5 mb-3">
          <Inp label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
          <div>
            <p className="text-xs text-muted font-medium mb-1">Type</p>
            <div className="flex gap-1.5">
              {DONATION_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors ${type === t ? 'border-accent bg-accent-l text-accent' : 'border-border bg-surface text-muted'}`}
                >
                  {DONATION_ICONS[t]} {t}
                </button>
              ))}
            </div>
          </div>
        </div>
        <Inp label="Notes (opt.)" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Morning, fasted" className="mb-3" />
        <Btn onClick={add} className="w-full">Log Donation</Btn>
      </Card>

      {/* Eligibility */}
      {DONATION_TYPES.map(t => {
        const nd = t === 'Full Blood' ? nextFull : nextPlasma
        const days = daysUntil(nd)
        const eligible = days !== null && days <= 0
        return (
          <Card key={t}>
            <SecTitle>{DONATION_ICONS[t]} Next {t}</SecTitle>
            {nd ? (
              <p className={`text-lg font-bold ${eligible ? 'text-success' : 'text-primary'}`}>
                {eligible ? '✅ Eligible now' : `${days} days (${nd})`}
              </p>
            ) : (
              <p className="text-sm text-muted">No donations logged yet</p>
            )}
            {byType(t)[0] && (
              <p className="text-xs text-muted mt-1">Last: {byType(t)[0].date} · {DONATION_ELIGIBILITY_DAYS[t]} day wait</p>
            )}
          </Card>
        )
      })}

      <Card>
        <SecTitle>History</SecTitle>
        {recent.length === 0 ? (
          <EmptyMsg>No donations logged yet</EmptyMsg>
        ) : (
          recent.map(d => (
            <div key={d.id} className="flex items-center justify-between py-2 border-b border-bg last:border-0">
              <div>
                <span className="text-sm font-medium text-primary">{DONATION_ICONS[d.type]} {d.type}</span>
                {d.notes && <span className="text-xs text-muted italic ml-2">— {d.notes}</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted">{d.date}</span>
                <DelBtn onClick={() => removeDonationEntry(d.id)} />
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  )
}
