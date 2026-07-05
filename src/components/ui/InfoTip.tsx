import { useState, type ReactNode } from 'react'

interface InfoTipProps {
  children: ReactNode
  /** Accessible label / title for the trigger. */
  label?: string
  /** Optional colour for the panel's left accent bar. */
  accent?: string
}

/**
 * A small tap-to-open info popover anchored to an ⓘ button. Closes on outside
 * tap. Content is any node (used for adaptation "how to train" blurbs).
 */
export function InfoTip({ children, label = 'More info', accent }: InfoTipProps) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label={label}
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v) }}
        className="w-5 h-5 flex items-center justify-center rounded-full border border-border text-[11px] font-bold text-muted hover:text-accent hover:border-accent transition-colors"
      >
        i
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[150]" onClick={(e) => { e.stopPropagation(); setOpen(false) }} />
          <div
            className="absolute right-0 top-6 z-[151] w-60 rounded-xl border border-border bg-surface shadow-xl p-3 text-left"
            style={accent ? { borderLeftWidth: 3, borderLeftColor: accent } : undefined}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </div>
        </>
      )}
    </span>
  )
}
