import { useState } from 'react'
import { useAppStore } from '../../store/app'
import { Btn } from '../ui/Button'
import { Inp } from '../ui/Input'
import { today } from '../../lib/utils'

interface ExportPaneProps {
  onClose: () => void
}

export function ExportPane({ onClose }: ExportPaneProps) {
  const store = useAppStore()
  const [fromDate, setFromDate] = useState(today())
  const [exportAll, setExportAll] = useState(false)

  const doExport = () => {
    const cutoff = exportAll ? '' : fromDate
    const f = <T extends { date: string }>(arr: T[]) => cutoff ? arr.filter(e => e.date >= cutoff) : arr

    const filtered = {
      weights: f(store.weights),
      bodyweight: f(store.bodyweight),
      cardio: f(store.cardio),
      mobility: f(store.mobility),
      skills: f(store.skills),
      donations: f(store.donations),
      program: store.program,
    }
    const json = JSON.stringify(filtered, null, 2)

    // Copy to clipboard
    const ta = document.createElement('textarea')
    ta.value = json
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;'
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    let ok = false
    try { ok = document.execCommand('copy') } catch { /* noop */ }
    document.body.removeChild(ta)

    store.setToast(ok
      ? `✅ Copied ${filtered.weights.length} weight entries (${Math.round(json.length / 1024)}KB)`
      : '❌ Copy failed — try manual copy.'
    )
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-end">
      <div onClick={onClose} className="absolute inset-0 bg-black/50" />
      <div className="relative w-full bg-surface rounded-t-2xl p-5 shadow-xl">
        <div className="w-10 h-1 bg-border rounded mx-auto mb-4" />
        <p className="text-base font-bold text-primary mb-1">Export Data</p>
        <p className="text-sm text-muted mb-3">Copy all entries from a date onwards to clipboard.</p>
        <label className="flex items-center gap-2 text-sm text-primary mb-3 cursor-pointer">
          <input
            type="checkbox"
            checked={exportAll}
            onChange={e => setExportAll(e.target.checked)}
            className="accent-accent"
          />
          Export all data
        </label>
        {!exportAll && (
          <Inp label="From date" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
        )}
        <div className="flex gap-2 mt-3">
          <Btn onClick={doExport} className="flex-1">📤 Copy to Clipboard</Btn>
          <Btn onClick={onClose} variant="secondary" className="flex-1">Cancel</Btn>
        </div>
      </div>
    </div>
  )
}
