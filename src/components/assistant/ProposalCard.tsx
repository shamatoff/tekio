import { useAssistant } from '../../store/assistant'
import { describeToolCall } from '../../lib/assistant/executor'
import { Btn } from '../ui/Button'
import type { ChatMessage } from '../../lib/assistant/types'

export function ProposalCard({ message }: { message: ChatMessage }) {
  const proposal = message.proposal!
  const { confirmProposal, cancelProposal, busy } = useAssistant()
  const pending = proposal.status === 'pending'

  return (
    <div className="mt-2 border border-border rounded-xl overflow-hidden bg-bg">
      <ul className="divide-y divide-border">
        {proposal.calls.map((call, i) => {
          const result = proposal.results?.[i]
          const mark = result ? (result.ok ? '✅' : '⚠️') : '•'
          return (
            <li key={i} className="px-3 py-2 text-xs text-primary flex gap-2">
              <span className="flex-shrink-0">{mark}</span>
              <span className="min-w-0">
                <span className="break-words">{describeToolCall(call)}</span>
                {result && !result.ok && (
                  <span className="block text-danger mt-0.5">{result.summary}</span>
                )}
              </span>
            </li>
          )
        })}
      </ul>

      {pending ? (
        <div className="flex gap-2 px-3 py-2 border-t border-border">
          <Btn small variant="primary" disabled={busy} onClick={() => confirmProposal(message.id)}>
            Confirm
          </Btn>
          <Btn small variant="secondary" disabled={busy} onClick={() => cancelProposal(message.id)}>
            Cancel
          </Btn>
        </div>
      ) : (
        <div className="px-3 py-1.5 border-t border-border text-[11px] font-medium text-muted">
          {proposal.status === 'applied' && '✅ Applied'}
          {proposal.status === 'partial' && '⚠️ Partially applied'}
          {proposal.status === 'failed' && '⚠️ Failed — nothing changed'}
          {proposal.status === 'cancelled' && '✕ Cancelled'}
        </div>
      )}
    </div>
  )
}
