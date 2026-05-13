const NAV = [
  { key: 'Weights', icon: '🏋️', label: 'Weights' },
  { key: 'Body Weight', icon: '⚖️', label: 'Body Weight' },
  { key: 'Cardio', icon: '❤️', label: 'Cardio' },
  { key: 'Mobility', icon: '🧘', label: 'Mobility' },
  { key: 'Skills', icon: '🎯', label: 'Skills' },
  { key: 'Donations', icon: '🩸', label: 'Donations' },
]

interface DrawerProps {
  open: boolean
  onClose: () => void
  tab: string
  setTab: (tab: string) => void
  onExport: () => void
  onImport: () => void
}

function NavItem({ icon, label, active, onClick }: { icon: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2.5 w-full text-left transition-colors ${active ? 'bg-accent-l text-accent' : 'text-primary hover:bg-bg'}`}
    >
      <span className="text-lg w-6 text-center">{icon}</span>
      <span className={`text-sm ${active ? 'font-semibold' : 'font-normal'}`}>{label}</span>
      {active && <span className="ml-auto w-0.5 h-5 bg-accent rounded-full" />}
    </button>
  )
}

export function Drawer({ open, onClose, tab, setTab, onExport, onImport }: DrawerProps) {
  return (
    <>
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 z-[200] backdrop-blur-sm"
        />
      )}
      <div
        className={`fixed top-0 left-0 h-full w-[280px] bg-surface z-[201] shadow-xl flex flex-col transition-transform duration-[250ms] ease-[cubic-bezier(.4,0,.2,1)] ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Header */}
        <div className="px-4 py-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-lg">💪</div>
            <div>
              <p className="text-sm font-bold text-primary leading-tight">Tekiō</p>
              <p className="text-[11px] text-muted">Fitness Tracker</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted hover:text-primary text-xl leading-none">✕</button>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-2">
          <NavItem icon="📋" label="Program" active={tab === 'Program'} onClick={() => { setTab('Program'); onClose() }} />
          <div className="px-4 pt-3 pb-1">
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Log</p>
          </div>
          {NAV.map(n => (
            <NavItem key={n.key} icon={n.icon} label={n.label} active={tab === n.key} onClick={() => { setTab(n.key); onClose() }} />
          ))}
        </div>

        {/* Data section */}
        <div className="p-4 border-t border-border flex flex-col gap-2">
          <p className="text-[11px] font-bold text-muted uppercase tracking-widest mb-1">Data</p>
          <button
            onClick={onExport}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-border bg-bg text-sm font-medium text-primary hover:bg-surface transition-colors"
          >
            <span>📤</span> Export to clipboard
          </button>
          <button
            onClick={onImport}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-border bg-bg text-sm font-medium text-primary hover:bg-surface transition-colors"
          >
            <span>📥</span> Import from clipboard
          </button>
        </div>
      </div>
    </>
  )
}
