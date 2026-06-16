import { useState } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ss' | 'ghost'

const variantClasses: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:opacity-90',
  secondary: 'bg-surface border border-border text-primary hover:bg-bg',
  danger: 'bg-danger text-white hover:opacity-90',
  ss: 'bg-ss text-white hover:opacity-90',
  ghost: 'text-muted hover:text-primary',
}

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
  small?: boolean
}

export function Btn({ variant = 'primary', children, small, className = '', ...props }: BtnProps) {
  return (
    <button
      className={`${small ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'} font-medium rounded-lg transition-opacity disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

interface DelBtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string
  noConfirm?: boolean
}

export function DelBtn({ label = 'Delete', onClick, noConfirm = false, className = '', ...rest }: DelBtnProps) {
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-1">
        <button
          onClick={e => { setConfirming(false); onClick?.(e) }}
          className="px-2 py-0.5 text-[11px] font-semibold text-white bg-danger rounded hover:opacity-90"
        >
          Yes
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="px-2 py-0.5 text-[11px] font-semibold text-muted border border-border bg-surface rounded hover:bg-bg"
        >
          No
        </button>
      </span>
    )
  }

  return (
    <button
      aria-label={label}
      onClick={noConfirm ? onClick : () => setConfirming(true)}
      className={`w-7 h-7 flex items-center justify-center text-danger hover:bg-danger/10 rounded transition-colors ${className}`}
      {...rest}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v6M14 11v6" />
        <path d="M9 6V4h6v2" />
      </svg>
    </button>
  )
}

export function EditBtn({ label = 'Edit', className = '', ...props }: DelBtnProps) {
  return (
    <button
      aria-label={label}
      className={`w-7 h-7 flex items-center justify-center text-muted hover:text-accent hover:bg-accent/10 rounded transition-colors ${className}`}
      {...props}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    </button>
  )
}
