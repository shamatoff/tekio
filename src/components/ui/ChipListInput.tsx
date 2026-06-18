import { useState } from 'react'
import { SmartInput } from './SmartInput'

interface ChipListInputProps {
  items: string[]
  onChange: (items: string[]) => void
  suggestions: string[]
  placeholder: string
}

export function ChipListInput({ items, onChange, suggestions, placeholder }: ChipListInputProps) {
  const [input, setInput] = useState('')

  const add = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed || items.includes(trimmed)) return
    onChange([...items, trimmed])
    setInput('')
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1.5">
        <SmartInput
          value={input}
          onChange={setInput}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(input) } }}
          suggestions={suggestions.filter(s => !items.includes(s))}
          placeholder={placeholder}
          className="flex-1"
        />
        <button
          type="button"
          onClick={() => add(input)}
          className="px-3 py-2 rounded-lg text-xs font-semibold border border-border bg-surface text-muted hover:border-accent/50 transition-colors"
        >
          Add
        </button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {items.map(t => (
            <span
              key={t}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-accent-l text-accent"
            >
              {t}
              <button
                type="button"
                onClick={() => onChange(items.filter(x => x !== t))}
                className="text-accent/70 hover:text-accent"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
