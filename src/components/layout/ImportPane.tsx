import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '../../store/app'
import { mergeById } from '../../lib/utils'
import { saveWeightEntry } from '../../lib/db/weights'
import { saveBodyweightEntry } from '../../lib/db/bodyweight'
import { saveCardioEntry } from '../../lib/db/cardio'
import { saveMobilityEntry } from '../../lib/db/mobility'
import { saveSkillEntry } from '../../lib/db/skills'
import { saveDonationEntry } from '../../lib/db/donations'
import { saveProgram } from '../../lib/db/program'
import type { WeightEntry, BodyweightEntry, CardioEntry, MobilityEntry, SkillEntry, DonationEntry } from '../../types'
import { Btn } from '../ui/Button'

interface ImportPaneProps {
  onClose: () => void
}

export function ImportPane({ onClose }: ImportPaneProps) {
  const [val, setVal] = useState('')
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)
  const store = useAppStore()

  useEffect(() => {
    const t = setTimeout(() => ref.current?.focus(), 50)
    return () => clearTimeout(t)
  }, [])

  async function applyData(text: string): Promise<boolean> {
    try {
      const p = JSON.parse(text)
      if (!p.weights || !p.bodyweight || !p.cardio || !p.mobility) return false
      setLoading(true)

      const newWeights: WeightEntry[] = mergeById(store.weights, p.weights || [])
      const newBodyweight: BodyweightEntry[] = mergeById(store.bodyweight, p.bodyweight || [])
      const newCardio: CardioEntry[] = mergeById(store.cardio, p.cardio || [])
      const newMobility: MobilityEntry[] = mergeById(store.mobility, p.mobility || [])
      const newSkills: SkillEntry[] = mergeById(store.skills, p.skills || [])
      const newDonations: DonationEntry[] = mergeById(store.donations, p.donations || [])

      // Find entries that don't exist in the store (new ones from import)
      const existingWIds = new Set(store.weights.map(w => w.id))
      const existingBIds = new Set(store.bodyweight.map(b => b.id))
      const existingCIds = new Set(store.cardio.map(c => c.id))
      const existingMIds = new Set(store.mobility.map(m => m.id))
      const existingSkIds = new Set(store.skills.map(s => s.id))
      const existingDIds = new Set(store.donations.map(d => d.id))

      await Promise.all([
        ...p.weights.filter((w: WeightEntry) => !existingWIds.has(w.id)).map((w: WeightEntry) => saveWeightEntry(w)),
        ...p.bodyweight.filter((b: BodyweightEntry) => !existingBIds.has(b.id)).map((b: BodyweightEntry) => saveBodyweightEntry(b)),
        ...p.cardio.filter((c: CardioEntry) => !existingCIds.has(c.id)).map((c: CardioEntry) => saveCardioEntry(c)),
        ...p.mobility.filter((m: MobilityEntry) => !existingMIds.has(m.id)).map((m: MobilityEntry) => saveMobilityEntry(m)),
        ...(p.skills || []).filter((s: SkillEntry) => !existingSkIds.has(s.id)).map((s: SkillEntry) => saveSkillEntry(s)),
        ...(p.donations || []).filter((d: DonationEntry) => !existingDIds.has(d.id)).map((d: DonationEntry) => saveDonationEntry(d)),
      ])

      store.setWeights(newWeights)
      store.setBodyweight(newBodyweight)
      store.setCardio(newCardio)
      store.setMobility(newMobility)
      store.setSkills(newSkills)
      store.setDonations(newDonations)

      if (p.program && !store.program) {
        const result = await saveProgram(p.program)
        store.setProgram(result.program)
      }

      store.setToast('✅ Data imported!')
      return true
    } catch {
      return false
    } finally {
      setLoading(false)
    }
  }

  const handlePaste = async (e: React.ClipboardEvent) => {
    const text = e.clipboardData?.getData('text') || ''
    if (!text) return
    e.preventDefault()
    setVal(text)
    ref.current?.blur()
    setTimeout(async () => {
      const ok = await applyData(text)
      if (!ok) store.setToast('❌ Invalid data format.')
      onClose()
    }, 100)
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-end">
      <div onClick={onClose} className="absolute inset-0 bg-black/50" />
      <div className="relative w-full bg-surface rounded-t-2xl p-5 shadow-xl">
        <div className="w-10 h-1 bg-border rounded mx-auto mb-4" />
        <p className="text-base font-bold text-primary mb-1">Import Data</p>
        <p className="text-sm text-muted mb-3">Paste JSON — loads automatically on paste.</p>
        <textarea
          ref={ref}
          value={val}
          onPaste={handlePaste}
          onChange={e => setVal(e.target.value)}
          placeholder="Paste here…"
          className="w-full h-20 border border-border rounded-xl px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
        <div className="flex gap-2 mt-2">
          <Btn
            onClick={async () => {
              const ok = await applyData(val)
              if (!ok) store.setToast('❌ Invalid data format.')
              else onClose()
            }}
            disabled={!val.trim() || loading}
            className="flex-1"
          >
            {loading ? 'Loading…' : 'Load'}
          </Btn>
          <Btn onClick={onClose} variant="secondary" className="flex-1">Cancel</Btn>
        </div>
      </div>
    </div>
  )
}
