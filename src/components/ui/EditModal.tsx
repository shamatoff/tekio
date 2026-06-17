import { useState, useRef, useMemo } from 'react'
import { parseDurationMins, formatDurationMins, calcPace } from '../../lib/utils'
import { useAppStore } from '../../store/app'
import { Modal } from './Modal'
import { SetsGrid } from './SetsGrid'
import type { SetStr } from './SetsGrid'
import { Inp, SelEl } from './Input'
import { Btn, DelBtn } from './Button'
import { SmartInput } from './SmartInput'
import { TeammateInput } from './TeammateInput'
import { CARDIO_TYPES, DONATION_TYPES } from '../../constants/app'
import type {
  WeightEntry,
  BodyweightEntry,
  CardioEntry,
  MobilityEntry,
  SkillEntry,
  DonationEntry,
  LiftSet,
  MobilityExercise,
  QualityRating,
  MatchResult,
  NewSkillFlags,
} from '../../types'

// ── Internal helpers ──────────────────────────────────────────────────────────

function toSetStr(sets: LiftSet[]): SetStr[] {
  return sets.map(s => ({ weight: String(s.weight), reps: String(s.reps) }))
}

function parseSets(sets: SetStr[], revealed: number): LiftSet[] {
  return sets
    .slice(0, revealed)
    .filter(s => s.weight && s.reps)
    .map(s => ({ weight: +s.weight, reps: +s.reps }))
}

/** Custom hook — manages a sets grid's local state. */
function useSets(initial: LiftSet[]) {
  const [sets, setSets] = useState<SetStr[]>(() => toSetStr(initial))
  const [revealed, setRevealed] = useState(initial.length || 1)

  const update = (i: number, f: 'weight' | 'reps', v: string) =>
    setSets(p => p.map((s, idx) => (idx === i ? { ...s, [f]: v } : s)))

  const remove = (i: number) => {
    setSets(p => p.filter((_, idx) => idx !== i))
    setRevealed(r => Math.max(1, r - 1))
  }

  const revealNext = () => {
    const n = revealed + 1
    if (n > sets.length) setSets(p => [...p, { weight: p[p.length - 1]?.weight || '', reps: '' }])
    setRevealed(n)
  }

  return { sets, revealed, update, remove, revealNext, parsed: parseSets(sets, revealed) }
}

// ── Save/Cancel footer ────────────────────────────────────────────────────────

function Footer({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  return (
    <div className="flex gap-2">
      <Btn variant="secondary" onClick={onCancel} className="flex-1">Cancel</Btn>
      <Btn onClick={onSave} className="flex-1">Save</Btn>
    </div>
  )
}

// ── WeightForm ────────────────────────────────────────────────────────────────

function WeightForm({ record, onClose, saveRef }: { record: WeightEntry; onClose: () => void; saveRef: { current: () => void } }) {
  const editWeightEntry = useAppStore(s => s.editWeightEntry)
  const setToast = useAppStore(s => s.setToast)
  const [date, setDate] = useState(record.date)
  const s = useSets(record.sets)

  const save = async () => {
    if (!s.parsed.length) return
    try {
      await editWeightEntry(record.id, { sets: s.parsed, date })
      setToast('✅ Updated!')
      onClose()
    } catch {
      setToast('❌ Failed to update.')
    }
  }
  saveRef.current = save

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-primary">{record.exercise}</p>
      <Inp label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
      <SetsGrid
        sets={s.sets} revealed={s.revealed}
        onUpdate={s.update} onRemove={s.remove} onRevealNext={s.revealNext}
      />
    </div>
  )
}

// ── SupersetForm ──────────────────────────────────────────────────────────────

function SupersetForm({ records, onClose, saveRef }: { records: [WeightEntry, WeightEntry]; onClose: () => void; saveRef: { current: () => void } }) {
  const editWeightEntry = useAppStore(s => s.editWeightEntry)
  const setToast = useAppStore(s => s.setToast)
  const [date, setDate] = useState(records[0].date)
  const s0 = useSets(records[0].sets)
  const s1 = useSets(records[1].sets)

  const save = async () => {
    if (!s0.parsed.length || !s1.parsed.length) return
    try {
      await Promise.all([
        editWeightEntry(records[0].id, { sets: s0.parsed, date }),
        editWeightEntry(records[1].id, { sets: s1.parsed, date }),
      ])
      setToast('✅ Updated!')
      onClose()
    } catch {
      setToast('❌ Failed to update.')
    }
  }
  saveRef.current = save

  return (
    <div className="flex flex-col gap-4">
      <Inp label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />

      <div className="border border-ss-b rounded-xl p-3 bg-ss-l">
        <p className="text-xs font-semibold text-ss mb-2">{records[0].exercise}</p>
        <SetsGrid
          sets={s0.sets} revealed={s0.revealed}
          onUpdate={s0.update} onRemove={s0.remove} onRevealNext={s0.revealNext}
        />
      </div>

      <div className="border border-ss-b rounded-xl p-3 bg-ss-l">
        <p className="text-xs font-semibold text-ss mb-2">{records[1].exercise}</p>
        <SetsGrid
          sets={s1.sets} revealed={s1.revealed}
          onUpdate={s1.update} onRemove={s1.remove} onRevealNext={s1.revealNext}
        />
      </div>
    </div>
  )
}

// ── BodyweightForm ────────────────────────────────────────────────────────────

function BodyweightForm({ record, onClose, saveRef }: { record: BodyweightEntry; onClose: () => void; saveRef: { current: () => void } }) {
  const editBodyweightEntry = useAppStore(s => s.editBodyweightEntry)
  const setToast = useAppStore(s => s.setToast)
  const [date, setDate] = useState(record.date)
  const [weight, setWeight] = useState(String(record.weight))

  const save = async () => {
    if (!weight) return
    try {
      await editBodyweightEntry(record.id, { date, weight: +weight })
      setToast('✅ Updated!')
      onClose()
    } catch {
      setToast('❌ Failed to update.')
    }
  }
  saveRef.current = save

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2.5">
        <Inp label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
        <Inp
          label="Weight (kg)"
          type="number"
          value={weight}
          onChange={e => setWeight(e.target.value)}
          step="0.1"
          min="0"
          placeholder="70.5"
        />
      </div>
    </div>
  )
}

// ── CardioForm ────────────────────────────────────────────────────────────────

function CardioForm({ record, onClose, saveRef }: { record: CardioEntry; onClose: () => void; saveRef: { current: () => void } }) {
  const editCardioEntry = useAppStore(s => s.editCardioEntry)
  const setToast = useAppStore(s => s.setToast)
  const [date, setDate] = useState(record.date)
  const [type, setType] = useState(record.type)
  const [duration, setDuration] = useState(formatDurationMins(record.duration))
  const [distance, setDistance] = useState(record.distance != null ? String(record.distance) : '')
  const [notes, setNotes] = useState(record.notes ?? '')

  const durationMins = parseDurationMins(duration)
  const distKm = distance ? +distance : 0
  const livePace = calcPace(durationMins, distKm)

  const save = async () => {
    if (!durationMins) return
    try {
      await editCardioEntry(record.id, {
        date,
        type,
        duration: durationMins,
        distance: distKm || undefined,
        notes: notes || undefined,
      })
      setToast('✅ Updated!')
      onClose()
    } catch {
      setToast('❌ Failed to update.')
    }
  }
  saveRef.current = save

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2.5">
        <SelEl
          label="Type"
          value={type}
          onChange={e => setType(e.target.value as CardioEntry['type'])}
          options={CARDIO_TYPES.map(t => ({ value: t, label: t }))}
        />
        <Inp label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
        <Inp
          label="Duration (MM:SS)"
          type="text"
          value={duration}
          onChange={e => setDuration(e.target.value)}
          placeholder="30:00"
        />
        <div>
          <Inp
            label="Distance (km, opt.)"
            type="number"
            value={distance}
            onChange={e => setDistance(e.target.value)}
            placeholder="5.0"
            step="0.01"
            min="0"
          />
          {livePace && <p className="text-xs text-accent font-medium mt-1">⚡ {livePace}</p>}
        </div>
      </div>
      <Inp
        label="Notes (opt.)"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="e.g. Easy zone 2"
      />
    </div>
  )
}

// ── MobilityForm ──────────────────────────────────────────────────────────────

function emptyEx(): MobilityExercise { return { name: '', duration: 0, notes: '' } }

function MobilityForm({ record, onClose, saveRef }: { record: MobilityEntry; onClose: () => void; saveRef: { current: () => void } }) {
  const editMobilityEntry = useAppStore(s => s.editMobilityEntry)
  const setToast = useAppStore(s => s.setToast)
  const mobility = useAppStore(s => s.mobility)
  const allExNames = useMemo(
    () => [...new Set(mobility.flatMap(m => m.exercises.map(e => e.name)))].sort(),
    [mobility]
  )
  const [date, setDate] = useState(record.date)
  const [exercises, setExercises] = useState<MobilityExercise[]>(
    record.exercises.length ? [...record.exercises] : [emptyEx()]
  )

  const updateEx = (i: number, field: keyof MobilityExercise, value: string | number) =>
    setExercises(prev => prev.map((e, j) => (j === i ? { ...e, [field]: value } : e)))
  const addEx = () => setExercises(p => [...p, emptyEx()])
  const removeEx = (i: number) => setExercises(p => p.filter((_, j) => j !== i))

  const save = async () => {
    const valid = exercises.filter(e => e.name.trim() && e.duration > 0)
    if (!valid.length) return
    try {
      await editMobilityEntry(record.id, {
        date,
        exercises: valid,
        duration: valid.reduce((s, e) => s + e.duration, 0),
      })
      setToast('✅ Updated!')
      onClose()
    } catch {
      setToast('❌ Failed to update.')
    }
  }
  saveRef.current = save

  return (
    <div className="flex flex-col gap-3">
      <Inp label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />

      {exercises.map((ex, i) => (
        <div key={i} className="flex flex-col gap-1.5 pb-3 border-b border-bg last:border-0 last:pb-0">
          {/* Row 1: name + delete */}
          <div className="flex items-center gap-2">
            <SmartInput
              value={ex.name}
              onChange={v => updateEx(i, 'name', v)}
              suggestions={allExNames}
              placeholder={`Exercise ${i + 1}`}
              className="flex-1 min-w-0"
            />
            <DelBtn noConfirm onClick={() => removeEx(i)} />
          </div>
          {/* Row 2: duration + notes */}
          <div className="grid grid-cols-2 gap-2">
            <Inp
              type="number"
              value={ex.duration || ''}
              onChange={e => updateEx(i, 'duration', +e.target.value)}
              placeholder="Duration (min)"
              min="1"
            />
            <Inp
              value={ex.notes}
              onChange={e => updateEx(i, 'notes', e.target.value)}
              placeholder="Notes (opt.)"
            />
          </div>
        </div>
      ))}

      <button onClick={addEx} className="text-xs text-accent text-left">+ Add Exercise</button>
    </div>
  )
}

// ── SkillForm ─────────────────────────────────────────────────────────────────

const STARS = [1, 2, 3, 4, 5]

function SkillForm({ record, onClose, saveRef }: { record: SkillEntry; onClose: () => void; saveRef: { current: () => void } }) {
  const editSkillEntry = useAppStore(s => s.editSkillEntry)
  const setToast = useAppStore(s => s.setToast)
  const skills = useAppStore(s => s.skills)
  const skillTypes = useAppStore(s => s.skillTypes)
  const allSkills = useMemo(() => [...new Set(skills.map(d => d.skill))].sort(), [skills])
  const allCompetitors = useMemo(
    () => [...new Set(skills.map(d => d.competitorName).filter((c): c is string => !!c))].sort(),
    [skills]
  )
  const allTeammates = useMemo(
    () => [...new Set(skills.flatMap(d => d.teammateNames ?? []))].sort(),
    [skills]
  )
  const [date, setDate] = useState(record.date)
  const [skill, setSkill] = useState<string>(record.skill)
  const [withTrainer, setWithTrainer] = useState(record.withTrainer)
  const [quality, setQuality] = useState<number>(record.quality)
  const [notes, setNotes] = useState(record.notes)
  const [competitorName, setCompetitorName] = useState(record.competitorName ?? '')
  const [result, setResult] = useState<MatchResult | ''>(record.result ?? '')
  const [teammates, setTeammates] = useState<string[]>(record.teammateNames ?? [])
  const [newSkillHasCompetitor, setNewSkillHasCompetitor] = useState(false)
  const [newSkillHasTeammate, setNewSkillHasTeammate] = useState(false)

  const existingType = skillTypes.find(t => t.name.toLowerCase() === skill.trim().toLowerCase())
  const isNewSkill = skill.trim() !== '' && !existingType
  const hasCompetitor = existingType ? existingType.hasCompetitor : (isNewSkill && newSkillHasCompetitor)
  const hasTeammate = existingType ? existingType.hasTeammate : (isNewSkill && newSkillHasTeammate)

  const save = async () => {
    if (!skill.trim()) return
    const newSkillFlags: NewSkillFlags | undefined = isNewSkill
      ? { hasCompetitor: newSkillHasCompetitor, hasTeammate: newSkillHasTeammate }
      : undefined
    try {
      await editSkillEntry(record.id, {
        date,
        skill: skill as SkillEntry['skill'],
        withTrainer,
        quality: quality as QualityRating,
        notes,
        competitorName: hasCompetitor ? (competitorName.trim() || undefined) : undefined,
        result: hasCompetitor ? (result || undefined) : undefined,
        teammateNames: hasTeammate ? teammates : undefined,
      }, newSkillFlags)
      setToast('✅ Updated!')
      onClose()
    } catch {
      setToast('❌ Failed to update.')
    }
  }
  saveRef.current = save

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-xs text-muted font-medium mb-1">Skill</p>
        <SmartInput
          value={skill}
          onChange={setSkill}
          suggestions={allSkills}
          placeholder="e.g. Tennis"
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
                className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                  withTrainer === v
                    ? 'border-accent bg-accent-l text-accent'
                    : 'border-border bg-surface text-muted'
                }`}
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
              onClick={() => setQuality(q => (q === s ? 0 : s))}
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
            <p className="text-xs text-muted font-medium mb-1">Competitor (opt.)</p>
            <SmartInput
              value={competitorName}
              onChange={setCompetitorName}
              suggestions={allCompetitors}
              placeholder="e.g. John Smith"
            />
          </div>
          <div>
            <p className="text-xs text-muted font-medium mb-1">Result</p>
            <div className="flex gap-1.5">
              {(['win', 'loss'] as MatchResult[]).map(r => (
                <button
                  key={r}
                  onClick={() => setResult(rv => (rv === r ? '' : r))}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors capitalize ${
                    result === r
                      ? 'border-accent bg-accent-l text-accent'
                      : 'border-border bg-surface text-muted'
                  }`}
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
          <TeammateInput teammates={teammates} onChange={setTeammates} suggestions={allTeammates} />
        </div>
      )}

      <Inp
        label="Notes (opt.)"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="How did it go?"
      />
    </div>
  )
}

// ── DonationForm ──────────────────────────────────────────────────────────────

function DonationForm({ record, onClose, saveRef }: { record: DonationEntry; onClose: () => void; saveRef: { current: () => void } }) {
  const editDonationEntry = useAppStore(s => s.editDonationEntry)
  const setToast = useAppStore(s => s.setToast)
  const [date, setDate] = useState(record.date)
  const [type, setType] = useState(record.type)
  const [notes, setNotes] = useState(record.notes ?? '')

  const save = async () => {
    try {
      await editDonationEntry(record.id, { date, type, notes })
      setToast('✅ Updated!')
      onClose()
    } catch {
      setToast('❌ Failed to update.')
    }
  }
  saveRef.current = save

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2.5">
        <Inp label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
        <SelEl
          label="Type"
          value={type}
          onChange={e => setType(e.target.value as DonationEntry['type'])}
          options={DONATION_TYPES.map(t => ({ value: t, label: t }))}
        />
      </div>
      <Inp
        label="Notes (opt.)"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Optional notes"
      />
    </div>
  )
}

// ── Main EditModal ────────────────────────────────────────────────────────────

const TITLES: Record<string, string> = {
  weight: 'Edit Exercise',
  'weight-superset': 'Edit Superset',
  bodyweight: 'Edit Body Weight',
  cardio: 'Edit Cardio Session',
  mobility: 'Edit Mobility Session',
  skill: 'Edit Skill Session',
  donation: 'Edit Donation',
}

/**
 * Global edit modal — mounted once in AppShell, driven by store.editModal.
 * Each tab opens it via openEditModal(target).
 */
export function EditModal() {
  const editModal = useAppStore(s => s.editModal)
  const closeEditModal = useAppStore(s => s.closeEditModal)
  // Each form writes its save fn here on every render; Footer calls it.
  const saveRef = useRef<() => void>(() => {})

  return (
    <Modal
      open={!!editModal}
      onClose={closeEditModal}
      title={editModal ? TITLES[editModal.type] : ''}
      footer={<Footer onCancel={closeEditModal} onSave={() => saveRef.current()} />}
    >
      {editModal?.type === 'weight' && (
        <WeightForm record={editModal.record} onClose={closeEditModal} saveRef={saveRef} />
      )}
      {editModal?.type === 'weight-superset' && (
        <SupersetForm records={editModal.records} onClose={closeEditModal} saveRef={saveRef} />
      )}
      {editModal?.type === 'bodyweight' && (
        <BodyweightForm record={editModal.record} onClose={closeEditModal} saveRef={saveRef} />
      )}
      {editModal?.type === 'cardio' && (
        <CardioForm record={editModal.record} onClose={closeEditModal} saveRef={saveRef} />
      )}
      {editModal?.type === 'mobility' && (
        <MobilityForm record={editModal.record} onClose={closeEditModal} saveRef={saveRef} />
      )}
      {editModal?.type === 'skill' && (
        <SkillForm record={editModal.record} onClose={closeEditModal} saveRef={saveRef} />
      )}
      {editModal?.type === 'donation' && (
        <DonationForm record={editModal.record} onClose={closeEditModal} saveRef={saveRef} />
      )}
    </Modal>
  )
}
