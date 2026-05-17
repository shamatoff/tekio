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
import type { WeightEntry, BodyweightEntry, CardioEntry, MobilityEntry, SkillEntry, DonationEntry, Program } from '../../types'
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
    let parsed: Record<string, unknown>
    try { parsed = JSON.parse(text) } catch { return false }
    if (!Array.isArray(parsed.weights) || !Array.isArray(parsed.bodyweight)) return false

    try {
      const p = parsed
      setLoading(true)

      // Remap non-UUID supersetIds (e.g. nanoid strings) to proper UUIDs, preserving grouping
      const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
      const supersetIdMap = new Map<string, string>()
      const inWeights: WeightEntry[] = ((p.weights as WeightEntry[]) || []).map(w => {
        if (!w.supersetId || isUuid(w.supersetId)) return w
        if (!supersetIdMap.has(w.supersetId)) supersetIdMap.set(w.supersetId, crypto.randomUUID())
        return { ...w, supersetId: supersetIdMap.get(w.supersetId)! }
      })

      const newWeights: WeightEntry[] = mergeById(store.weights, inWeights)
      const newBodyweight: BodyweightEntry[] = mergeById(store.bodyweight, (p.bodyweight as BodyweightEntry[]) || [])
      const newCardio: CardioEntry[] = mergeById(store.cardio, (p.cardio as CardioEntry[]) || [])
      const newMobility: MobilityEntry[] = mergeById(store.mobility, (p.mobility as MobilityEntry[]) || [])
      const newSkills: SkillEntry[] = mergeById(store.skills, (p.skills as SkillEntry[]) || [])
      const newDonations: DonationEntry[] = mergeById(store.donations, (p.donations as DonationEntry[]) || [])

      const existingWIds = new Set(store.weights.map(w => w.id))
      const existingBIds = new Set(store.bodyweight.map(b => b.id))
      const existingCIds = new Set(store.cardio.map(c => c.id))
      const existingMIds = new Set(store.mobility.map(m => m.id))
      const existingSkIds = new Set(store.skills.map(s => s.id))
      const existingDIds = new Set(store.donations.map(d => d.id))

      // Weights: process date-by-date to avoid concurrent session creation race condition
      const newWeightEntries = inWeights.filter(w => !existingWIds.has(w.id))
      const byDate = new Map<string, WeightEntry[]>()
      for (const w of newWeightEntries) {
        const arr = byDate.get(w.date) ?? []
        arr.push(w)
        byDate.set(w.date, arr)
      }
      for (const entries of byDate.values()) {
        for (const w of entries) await saveWeightEntry(w)
      }

      // Other domains are safe to run in parallel (no shared session concept)
      await Promise.all([
        ...(p.bodyweight as BodyweightEntry[]).filter(b => !existingBIds.has(b.id)).map(b => saveBodyweightEntry(b)),
        ...(p.cardio as CardioEntry[]).filter(c => !existingCIds.has(c.id)).map(c => saveCardioEntry(c)),
        ...(p.mobility as MobilityEntry[]).filter(m => !existingMIds.has(m.id)).map(m => saveMobilityEntry(m)),
        ...((p.skills as SkillEntry[]) || []).filter(s => !existingSkIds.has(s.id)).map(s => saveSkillEntry(s)),
        ...((p.donations as DonationEntry[]) || []).filter(d => !existingDIds.has(d.id)).map(d => saveDonationEntry(d)),
      ])

      store.setWeights(newWeights)
      store.setBodyweight(newBodyweight)
      store.setCardio(newCardio)
      store.setMobility(newMobility)
      store.setSkills(newSkills)
      store.setDonations(newDonations)

      if (p.program && !store.program) {
        const result = await saveProgram(p.program as Program)
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
