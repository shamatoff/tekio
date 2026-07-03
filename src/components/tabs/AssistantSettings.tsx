import { useEffect, useState } from 'react'
import { useAssistant } from '../../store/assistant'
import { SecTitle } from '../ui/Card'
import { Inp, SelEl } from '../ui/Input'
import { Btn } from '../ui/Button'

const PROVIDERS = [{ value: 'gemini', label: 'Google Gemini' }]

export function AssistantSettings() {
  const { status, statusLoaded, refreshStatus, saveKey, saveModel, removeKey } = useAssistant()
  const [provider, setProvider] = useState('gemini')
  const [model, setModel] = useState('gemini-2.5-flash')
  const [keyInput, setKeyInput] = useState('')
  const [editingKey, setEditingKey] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!statusLoaded) void refreshStatus()
  }, [statusLoaded, refreshStatus])

  useEffect(() => {
    if (status) {
      setProvider(status.provider)
      setModel(status.model)
    }
  }, [status])

  const hasKey = status?.hasKey ?? false

  async function run(fn: () => Promise<void>, okMsg: string) {
    setBusy(true); setErr(''); setMsg('')
    try {
      await fn()
      setMsg(okMsg)
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const onSaveKey = () =>
    run(async () => {
      await saveKey(keyInput.trim(), provider, model)
      setKeyInput('')
      setEditingKey(false)
    }, 'API key saved')

  const onSaveModel = () => run(() => saveModel(model), 'Model updated')
  const onRemove = () => run(() => removeKey(), 'API key removed')

  return (
    <div>
      <SecTitle>Assistant</SecTitle>
      <div className="bg-surface border border-border rounded-xl p-3 flex flex-col gap-3">
        <p className="text-xs text-muted">
          Add an API key to enable the in-app assistant (🤖). Your key is stored securely on the server and is
          never shown again — only the last 4 characters are displayed.
        </p>

        <SelEl
          label="Provider"
          options={PROVIDERS}
          value={provider}
          onChange={e => setProvider(e.target.value)}
        />

        {/* API key */}
        {hasKey && !editingKey ? (
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-muted font-medium">API key</p>
              <p className="text-sm text-primary font-mono">•••• •••• {status?.last4}</p>
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              <Btn small variant="secondary" onClick={() => { setEditingKey(true); setKeyInput('') }}>Replace</Btn>
              <Btn small variant="danger" disabled={busy} onClick={onRemove}>Remove</Btn>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Inp
              label={hasKey ? 'New API key' : 'API key'}
              type="password"
              autoComplete="off"
              placeholder="Paste your Gemini API key"
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
            />
            <div className="flex gap-1.5">
              <Btn small variant="primary" disabled={busy || !keyInput.trim()} onClick={onSaveKey}>Save key</Btn>
              {hasKey && (
                <Btn small variant="ghost" onClick={() => { setEditingKey(false); setKeyInput('') }}>Cancel</Btn>
              )}
            </div>
          </div>
        )}

        {/* Model */}
        <div className="flex items-end gap-2">
          <Inp
            label="Model"
            value={model}
            onChange={e => setModel(e.target.value)}
            placeholder="gemini-2.5-flash"
            className="flex-1"
          />
          {hasKey && (
            <Btn small variant="secondary" disabled={busy || model === status?.model} onClick={onSaveModel}>
              Update
            </Btn>
          )}
        </div>

        {msg && <p className="text-[11px] text-accent">{msg}</p>}
        {err && <p className="text-[11px] text-danger">{err}</p>}
      </div>
    </div>
  )
}
