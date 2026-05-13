import type { InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react'

interface InpProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function Inp({ label, className = '', ...props }: InpProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs text-muted font-medium">{label}</label>}
      <input
        className={`border border-border rounded-lg px-3 py-2 text-sm bg-surface text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40 ${className}`}
        {...props}
      />
    </div>
  )
}

interface SelElProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
  children?: ReactNode
}

export function SelEl({ label, options, className = '', children, ...props }: SelElProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs text-muted font-medium">{label}</label>}
      <select
        className={`border border-border rounded-lg px-3 py-2 text-sm bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 ${className}`}
        {...props}
      >
        {children ?? options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}
