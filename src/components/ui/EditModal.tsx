import { useState } from 'react'
import { useAppStore } from '../../store/app'
import { Modal } from './Modal'
import { SetsGrid } from './SetsGrid'
import type { SetStr } from './SetsGrid'
import { Inp, SelEl } from './Input'
import { Btn, DelBtn } from './Button'
import { SmartInput } from './SmartInput'
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
    <div className="flex gap-2 pt-2">
      <Btn variant="secondary" onClick={onCancel} className="flex-1">Cancel</Btn>
      <Btn onClick={onSave} className="flex-1">Save</Btn>
    </div>
  )
}

// ── WeightForm ────────────────────────────────────────────────────────────────

function WeightForm({ record, onClose }: { record: WeightEntry; onClose: () => void }) {
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

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-primary">{record.exercise}</p>
      <Inp label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
      <SetsGrid
        sets={s.sets} revealed={s.revealed}
        onUpdate={s.update} onRemove={s.remove} onRevealNext={s.revealNext}
      />
      <Footer onCancel={onClose} onSave={save} />
    </div>
  )
}

// ── SupersetForm ──────────────────────────────────────────────────────────────

function SupersetForm({ records, onClose }: { records: [WeightEntry, WeightEntry]; onClose: () => void }) {
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

      <Footer onCancel={onClose} onSave={save} />
    </div>
  )
}

// ── BodyweightForm ────────────────────────────────────────────────────────────

function BodyweightForm({ record, onClose }: { record: BodyweightEntry; onClose: () => void }) {
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
      <Footer onCancel={onClose} onSave={save} />
    </div>
  )
}

// ── CardioForm ────────────────────────────────────────────────────────────────

function CardioForm({ record, onClose }: { record: CardioEntry; onClose: () => void }) {
  const editCardioEntry = useAppStore(s => s.editCardioEntry)
  const setToast = useAppStore(s => s.setToast)
  const [date, setDate] = useState(record.date)
  const [type, setType] = useState(record.type)
  const [duration, setDuration] = useState(String(record.duration))
  const [distance, setDistance] = useState(record.distance != null ? String(record.distance) : '')
  const [notes, setNotes] = useState(record.notes ?? '')

  const save = async () => {
    if (!duration) return
    try {
      await editCardioEntry(record.id, {
        date,
        type,
        duration: +duration,
        distance: distance ? +distance : undefined,
        notes: notes || undefined,
      })
      setToast('✅ Updated!')
      onClose()
    } catch {
      setToast('❌ Failed to update.')
    }
  }

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
          label="Duration (min)"
          type="number"
          value={duration}
          onChange={e => setDuration(e.target.value)}
          placeholder="30"
          min="1"
        />
        <Inp
          label="Distance (km, opt.)"
          type="number"
          value={distance}
          onChange={e => setDistance(e.target.value)}
          placeholder="5.0"
          step="0.01"
          min="0"
        />
      </div>
      <Inp
        label="Notes (opt.)"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="e.g. Easy zone 2"
      />
      <Footer onCancel={onClose} onSave={save} />
    </div>
  )
}

// ── MobilityForm ──────────────────────────────────────────────────────────────

function emptyEx(): MobilityExercise { return { name: '', duration: 0, notes: '' } }

function MobilityForm({ record, onClose }: { record: MobilityEntry; onClose: () => void }) {
  const editMobilityEntry = useAppStore(s => s.editMobilityEntry)
  const setToast = useAppStore(s => s.setToast)
  const allExNames = useAppStore(s =>
    [...new Set(s.mobility.flatMap(m => m.exercises.map(e => e.name)))].sort()
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
            <DelBtn onClick={() => removeEx(i)} />
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

      <Footer onCancel={onClose} onSave={save} />
    </div>
  )
}

// ── SkillForm ─────────────────────────────────────────────────────────────────

const STARS = [1, 2, 3, 4, 5]

function SkillForm({ record, onClose }: { record: SkillEntry; onClose: () => void }) {
  const editSkillEntry = useAppStore(s => s.editSkillEntry)
  const setToast = useAppStore(s => s.setToast)
  const allSkills = useAppStore(s =>
    [...new Set(s.skills.map(d => d.skill))].sort()
  )
  const [date, setDate] = useState(record.date)
  const [skill, setSkill] = useState<string>(record.skill)
  const [withTrainer, setWithTrainer] = useState(record.withTrainer)
  const [quality, setQuality] = useState<number>(record.quality)
  const [notes, setNotes] = useState(record.notes)

  const save = async () => {
    if (!skill.trim()) return
    try {
      await editSkillEntry(record.id, {
        date,
        skill: skill as SkillEntry['skill'],
        withTrainer,
        quality: quality as QualityRating,
        notes,
      })
      setToast('✅ Updated!')
      onClose()
    } catch {
      setToast('❌ Failed to update.')
    }
  }

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

      <Inp
        label="Notes (opt.)"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="How did it go?"
      />

      <Footer onCancel={onClose} onSave={save} />
    </div>
  )
}

// ── DonationForm ──────────────────────────────────────────────────────────────

function DonationForm({ record, onClose }: { record: DonationEntry; onClose: () => void }) {
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
      <Footer onCancel={onClose} onSave={save} />
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

  return (
    <Modal
      open={!!editModal}
      onClose={closeEditModal}
      title={editModal ? TITLES[editModal.type] : ''}
    >
      {editModal?.type === 'weight' && (
        <WeightForm record={editModal.record} onClose={closeEditModal} />
      )}
      {editModal?.type === 'weight-superset' && (
        <SupersetForm records={editModal.records} onClose={closeEditModal} />
      )}
      {editModal?.type === 'bodyweight' && (
        <BodyweightForm record={editModal.record} onClose={closeEditModal} />
      )}
      {editModal?.type === 'cardio' && (
        <CardioForm record={editModal.record} onClose={closeEditModal} />
      )}
      {editModal?.type === 'mobility' && (
        <MobilityForm record={editModal.record} onClose={closeEditModal} />
      )}
      {editModal?.type === 'skill' && (
        <SkillForm record={editModal.record} onClose={closeEditModal} />
      )}
      {editModal?.type === 'donation' && (
        <DonationForm record={editModal.record} onClose={closeEditModal} />
      )}
    </Modal>
  )
}
