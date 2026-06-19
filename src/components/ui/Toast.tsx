import { useAppStore } from '../../store/app'

export function Toast() {
  const toast = useAppStore(s => s.toast)
  if (!toast) return null
  return (
    <div
      key={toast}
      className="fixed top-4 left-1/2 z-[100] bg-primary text-white text-sm px-4 py-2 rounded-lg shadow-lg animate-toast-fade"
    >
      {toast}
    </div>
  )
}
