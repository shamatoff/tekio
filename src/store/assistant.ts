import { create } from 'zustand'
import { useAppStore } from './app'
import { buildContext } from '../lib/assistant/context'
import { executeToolCall } from '../lib/assistant/executor'
import {
  assistantChat, getAssistantStatus, setAssistantKey, updateAssistantModel, clearAssistantKey,
} from '../lib/assistant/client'
import type { AssistantStatus, ChatMessage, GeminiContent, GeminiPart, ToolResult } from '../lib/assistant/types'

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()))
const context = () => buildContext(useAppStore.getState())

interface AssistantStore {
  open: boolean
  status: AssistantStatus | null
  statusLoaded: boolean
  messages: ChatMessage[]
  /** Raw Gemini turn history backing multi-turn function calling. */
  contents: GeminiContent[]
  busy: boolean
  error: string

  setOpen: (open: boolean) => void
  refreshStatus: () => Promise<void>
  saveKey: (apiKey: string, provider?: string, model?: string) => Promise<void>
  saveModel: (model: string) => Promise<void>
  removeKey: () => Promise<void>

  send: (text: string) => Promise<void>
  confirmProposal: (messageId: string) => Promise<void>
  cancelProposal: (messageId: string) => Promise<void>
  clearChat: () => void
}

const hasPending = (messages: ChatMessage[]) => messages.some(m => m.proposal?.status === 'pending')

export const useAssistant = create<AssistantStore>((set, get) => ({
  open: false,
  status: null,
  statusLoaded: false,
  messages: [],
  contents: [],
  busy: false,
  error: '',

  setOpen: (open) => {
    set({ open })
    if (open && !get().statusLoaded) void get().refreshStatus()
  },

  refreshStatus: async () => {
    try {
      const status = await getAssistantStatus()
      set({ status, statusLoaded: true })
    } catch (e) {
      set({ statusLoaded: true, error: e instanceof Error ? e.message : String(e) })
    }
  },

  saveKey: async (apiKey, provider, model) => {
    const status = await setAssistantKey(apiKey, provider, model)
    set({ status })
  },
  saveModel: async (model) => {
    const status = await updateAssistantModel(model)
    set({ status })
  },
  removeKey: async () => {
    const status = await clearAssistantKey()
    set({ status })
  },

  send: async (text) => {
    const t = text.trim()
    if (!t) return
    const s = get()
    if (s.busy || hasPending(s.messages)) return

    const userMsg: ChatMessage = { id: uid(), role: 'user', text: t }
    const contents: GeminiContent[] = [...s.contents, { role: 'user', parts: [{ text: t }] }]
    set({ messages: [...s.messages, userMsg], contents, busy: true, error: '' })

    try {
      const resp = await assistantChat(contents, context())
      const modelParts: GeminiPart[] = [
        ...(resp.text ? [{ text: resp.text }] : []),
        ...resp.toolCalls.map(tc => ({ functionCall: { name: tc.name, args: tc.args } })),
      ]
      const assistantMsg: ChatMessage = {
        id: uid(),
        role: 'assistant',
        text: resp.text || (resp.toolCalls.length ? 'Here are the changes I can make:' : '…'),
        proposal: resp.toolCalls.length ? { calls: resp.toolCalls, status: 'pending' } : undefined,
      }
      set(st => ({
        messages: [...st.messages, assistantMsg],
        contents: [...st.contents, { role: 'model', parts: modelParts }],
        busy: false,
      }))
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      set(st => ({
        busy: false,
        error: msg,
        messages: [...st.messages, { id: uid(), role: 'assistant', text: errorText(msg) }],
      }))
    }
  },

  confirmProposal: async (messageId) => {
    const msg = get().messages.find(m => m.id === messageId)
    if (!msg?.proposal || msg.proposal.status !== 'pending' || get().busy) return
    set({ busy: true })

    const results: ToolResult[] = []
    for (const call of msg.proposal.calls) results.push(await executeToolCall(call))

    const status = results.every(r => r.ok) ? 'applied' : results.some(r => r.ok) ? 'partial' : 'failed'
    set(st => ({
      messages: st.messages.map(m => (m.id === messageId ? { ...m, proposal: { ...m.proposal!, status, results } } : m)),
    }))
    useAppStore.getState().setToast(
      status === 'applied' ? 'Assistant applied changes' : status === 'partial' ? 'Some changes applied' : 'Changes failed',
    )

    // Report results back so the model can give a closing summary.
    const respParts: GeminiPart[] = msg.proposal.calls.map((c, i) => ({
      functionResponse: { name: c.name, response: { success: results[i].ok, detail: results[i].summary } },
    }))
    const contents: GeminiContent[] = [...get().contents, { role: 'user', parts: respParts }]
    set({ contents })
    try {
      const resp = await assistantChat(contents, context())
      if (resp.text) {
        set(st => ({
          messages: [...st.messages, { id: uid(), role: 'assistant', text: resp.text }],
          contents: [...st.contents, { role: 'model', parts: [{ text: resp.text }] }],
        }))
      }
    } catch {
      // The closing summary is optional; the changes are already applied.
    } finally {
      set({ busy: false })
    }
  },

  cancelProposal: async (messageId) => {
    const msg = get().messages.find(m => m.id === messageId)
    if (!msg?.proposal || msg.proposal.status !== 'pending') return
    // Keep the Gemini history valid (a functionCall turn must be answered) so a
    // follow-up message doesn't error — respond with a cancelled marker.
    const respParts: GeminiPart[] = msg.proposal.calls.map(c => ({
      functionResponse: { name: c.name, response: { cancelled: true } },
    }))
    set(st => ({
      messages: st.messages.map(m => (m.id === messageId ? { ...m, proposal: { ...m.proposal!, status: 'cancelled' } } : m)),
      contents: [...st.contents, { role: 'user', parts: respParts }],
    }))
  },

  clearChat: () => set({ messages: [], contents: [], error: '', busy: false }),
}))

function errorText(msg: string): string {
  if (msg === 'no_key') return 'No API key set yet. Add your Gemini API key in Profile → Assistant to get started.'
  return `Something went wrong: ${msg}`
}
