import { useEffect, useRef, useState } from 'react'
import { useAssistant } from '../../store/assistant'
import { Modal } from '../ui/Modal'
import { ProposalCard } from './ProposalCard'

const SUGGESTIONS = [
  'Add a daily "Farmer\'s Carry" habit for grip and forearms',
  'Add Face Pulls to my Push day',
  'Replace Back Squat with Front Squat on Leg day',
]

export function AssistantPanel() {
  const { open, setOpen, messages, busy, status, statusLoaded, send, clearChat } = useAssistant()
  const [draft, setDraft] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  const noKey = statusLoaded && status !== null && !status.hasKey

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, busy])

  function submit() {
    const t = draft.trim()
    if (!t || busy) return
    setDraft('')
    void send(t)
  }

  const footer = (
    <div className="flex flex-col gap-2">
      {noKey && (
        <p className="text-[11px] text-danger">
          No API key set. Add your Gemini key in Profile → Assistant first.
        </p>
      )}
      <div className="flex gap-2 items-end">
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
          }}
          rows={1}
          placeholder="Ask to add or change something…"
          className="flex-1 min-w-0 resize-none border border-border rounded-lg px-3 py-2 text-sm bg-surface text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40 max-h-32"
        />
        <button
          onClick={submit}
          disabled={busy || !draft.trim()}
          className="flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium bg-accent text-white disabled:opacity-40 transition-opacity"
        >
          Send
        </button>
      </div>
    </div>
  )

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="🤖 Assistant" footer={footer}>
      <div className="flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="text-sm text-muted">
            <p className="mb-3">
              I can add or change habits, exercise↔muscle mappings, and your program. I'll always show you
              exactly what I'll do before anything is saved.
            </p>
            <p className="text-xs font-medium mb-1.5">Try:</p>
            <div className="flex flex-col gap-1.5">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => { setDraft(''); void send(s) }}
                  disabled={busy || noKey}
                  className="text-left text-xs px-3 py-2 rounded-lg border border-border bg-bg hover:bg-surface disabled:opacity-40 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(m => (
          <div key={m.id} className={m.role === 'user' ? 'self-end max-w-[85%]' : 'self-start w-full'}>
            {m.text && (
              <div
                className={
                  m.role === 'user'
                    ? 'px-3 py-2 rounded-2xl rounded-br-sm bg-accent text-white text-sm whitespace-pre-wrap break-words'
                    : 'px-3 py-2 rounded-2xl rounded-bl-sm bg-bg border border-border text-primary text-sm whitespace-pre-wrap break-words'
                }
              >
                {m.text}
              </div>
            )}
            {m.proposal && <ProposalCard message={m} />}
          </div>
        ))}

        {busy && (
          <div className="self-start px-3 py-2 rounded-2xl rounded-bl-sm bg-bg border border-border text-muted text-sm">
            <span className="inline-flex gap-1">
              <span className="animate-bounce">•</span>
              <span className="animate-bounce [animation-delay:0.15s]">•</span>
              <span className="animate-bounce [animation-delay:0.3s]">•</span>
            </span>
          </div>
        )}

        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="self-center text-[11px] text-muted hover:text-primary underline mt-1"
          >
            Clear conversation
          </button>
        )}
        <div ref={endRef} />
      </div>
    </Modal>
  )
}
