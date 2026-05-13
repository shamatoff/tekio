import { useState, useRef, useEffect } from 'react'

interface SmartInputProps {
  value: string
  onChange: (val: string) => void
  suggestions: string[]
  placeholder?: string
  className?: string
  onFocus?: () => void
  onBlur?: () => void
}

export function SmartInput({ value, onChange, suggestions, placeholder, className = '', onFocus, onBlur }: SmartInputProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = suggestions.filter(
    s => s.toLowerCase().includes(value.toLowerCase()) && s !== value
  ).slice(0, 8)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className={`relative ${className}`}>
      <input
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => { setOpen(true); onFocus?.() }}
        onBlur={onBlur}
        placeholder={placeholder}
        className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 w-full top-full mt-1 bg-surface border border-border rounded-lg shadow-lg overflow-hidden">
          {filtered.map(s => (
            <button
              key={s}
              type="button"
              onMouseDown={e => { e.preventDefault(); onChange(s); setOpen(false) }}
              className="w-full text-left px-3 py-2 text-sm text-primary hover:bg-bg transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
