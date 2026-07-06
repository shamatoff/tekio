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
  const tint = accent ?? 'var(--color-accent)'
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v) }}
        className="w-5 h-5 flex items-center justify-center rounded-full border text-[11px] font-bold transition-colors"
        style={
          open
            ? { backgroundColor: tint, borderColor: tint, color: '#fff' }
            : { color: tint, borderColor: tint }
        }
      >
        i
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/30"
          onClick={(e) => { e.stopPropagation(); setOpen(false) }}
        >
          <div
            className="relative z-[151] w-full max-w-xs max-h-[80vh] overflow-y-auto rounded-xl border border-border bg-surface shadow-xl p-4 text-left"
            style={accent ? { borderLeftWidth: 3, borderLeftColor: accent } : undefined}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={(e) => { e.stopPropagation(); setOpen(false) }}
              className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full text-muted hover:text-primary text-sm"
            >
              ✕
            </button>
            {children}
          </div>
        </div>
      )}
    </span>
  )
}
