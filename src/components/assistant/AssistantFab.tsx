import { useAssistant } from '../../store/assistant'
import { AssistantPanel } from './AssistantPanel'

/** Floating assistant button (above the bottom nav) + the slide-up chat panel. */
export function AssistantFab({ hidden }: { hidden?: boolean }) {
  const { open, setOpen } = useAssistant()

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open assistant"
          className={`fixed right-4 bottom-20 z-40 w-12 h-12 rounded-full bg-accent text-white shadow-lg flex items-center justify-center text-xl transition-transform hover:scale-105 active:scale-95 ${
            hidden ? 'translate-y-24 opacity-0 pointer-events-none' : ''
          }`}
        >
          🤖
        </button>
      )}
      <AssistantPanel />
    </>
  )
}
