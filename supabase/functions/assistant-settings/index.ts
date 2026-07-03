// Assistant settings: stores/reads the per-user LLM API key server-side.
// The api_key lives in `assistant_settings`, which has RLS enabled and NO
// policies, so the browser (anon key) can never read it. Only this function,
// using the service-role key, can touch it. The full key is never returned to
// the client — `status` only ever exposes the last 4 characters.
//
// MVP: single hard-coded user. When auth/registration lands, derive the user id
// from the request JWT instead of USER_ID and set verify_jwt=true on deploy.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const USER_ID = 'a0000000-0000-0000-0000-000000000001'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

interface Settings {
  provider: string
  model: string
  api_key: string | null
}

function statusOf(s: Settings | null) {
  const key = s?.api_key ?? null
  return {
    hasKey: !!key,
    last4: key ? key.slice(-4) : null,
    provider: s?.provider ?? 'gemini',
    model: s?.model ?? 'gemini-2.5-flash',
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  let body: { action?: string; provider?: string; apiKey?: string; model?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'invalid_json' }, 400)
  }

  const read = async (): Promise<Settings | null> => {
    const { data } = await supabase
      .from('assistant_settings')
      .select('provider, model, api_key')
      .eq('user_id', USER_ID)
      .maybeSingle()
    return (data as Settings | null) ?? null
  }

  try {
    switch (body.action) {
      case 'status':
        return json(statusOf(await read()))

      case 'set': {
        const apiKey = (body.apiKey ?? '').trim()
        if (!apiKey) return json({ error: 'missing_key' }, 400)
        const current = await read()
        const { error } = await supabase.from('assistant_settings').upsert({
          user_id: USER_ID,
          provider: body.provider ?? current?.provider ?? 'gemini',
          model: body.model ?? current?.model ?? 'gemini-2.5-flash',
          api_key: apiKey,
          updated_at: new Date().toISOString(),
        })
        if (error) return json({ error: error.message }, 500)
        return json(statusOf(await read()))
      }

      case 'update_model': {
        const { error } = await supabase
          .from('assistant_settings')
          .update({ model: body.model ?? 'gemini-2.5-flash', provider: body.provider, updated_at: new Date().toISOString() })
          .eq('user_id', USER_ID)
        if (error) return json({ error: error.message }, 500)
        return json(statusOf(await read()))
      }

      case 'clear': {
        const { error } = await supabase
          .from('assistant_settings')
          .update({ api_key: null, updated_at: new Date().toISOString() })
          .eq('user_id', USER_ID)
        if (error) return json({ error: error.message }, 500)
        return json(statusOf(await read()))
      }

      default:
        return json({ error: 'unknown_action' }, 400)
    }
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})
