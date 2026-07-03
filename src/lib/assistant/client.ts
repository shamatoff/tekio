// Thin client for the assistant edge functions. All LLM traffic and the API key
// live server-side; the browser only ever sees masked status + model output.
import { supabase } from '../supabase'
import type { AssistantStatus, GeminiContent, ToolCall } from './types'

/** Invoke an edge function, surfacing the function's own `{ error }` body when it
 *  returns a non-2xx status (supabase-js otherwise hides it behind FunctionsHttpError). */
async function invokeFn<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body })
  if (error) {
    // FunctionsHttpError carries the original Response in `context`.
    const ctx = (error as { context?: Response }).context
    if (ctx && typeof ctx.json === 'function') {
      const parsed = await ctx.json().catch(() => null)
      if (parsed?.error) throw new Error(parsed.error)
    }
    throw error
  }
  if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error)
  return data as T
}

export function getAssistantStatus(): Promise<AssistantStatus> {
  return invokeFn('assistant-settings', { action: 'status' })
}

export function setAssistantKey(apiKey: string, provider = 'gemini', model?: string): Promise<AssistantStatus> {
  return invokeFn('assistant-settings', { action: 'set', apiKey, provider, model })
}

export function updateAssistantModel(model: string, provider?: string): Promise<AssistantStatus> {
  return invokeFn('assistant-settings', { action: 'update_model', model, provider })
}

export function clearAssistantKey(): Promise<AssistantStatus> {
  return invokeFn('assistant-settings', { action: 'clear' })
}

export interface ChatResponse {
  text: string
  toolCalls: ToolCall[]
}

export function assistantChat(contents: GeminiContent[], context: string): Promise<ChatResponse> {
  return invokeFn('assistant-chat', { contents, context })
}
