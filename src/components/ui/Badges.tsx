export function SSBadge() {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold text-white bg-ss rounded">
      SS
    </span>
  )
}

export function DeloadBadge({ week }: { week?: number }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold text-dl-tx bg-dl-bg border border-dl-bd rounded-full">
      {week ? `Deload Wk ${week}` : 'Deload'}
    </span>
  )
}
