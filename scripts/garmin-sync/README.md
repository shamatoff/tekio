# Garmin → Supabase sleep sync

A daily [GitHub Actions job](../../.github/workflows/garmin-sleep-sync.yml) pulls
your Garmin Connect sleep (duration, **Sleep Score**, HRV, resting HR, bed/wake
times) and upserts it into the `sleep_logs` table.

It uses the unofficial Garmin Connect API (via [`garminconnect`](https://github.com/cyberjunky/python-garminconnect)).
Fine for reading your own account on this single-user app; it can break if Garmin
changes their internal API (bump the library version if so).

## How it works

- Auth is **token-based**: a base64 garth token blob (generated once, locally,
  answering MFA if you have it on) is stored as a secret. CI never needs your
  password and never hits an MFA prompt. Tokens last ~1 year and auto-refresh.
- Each run syncs the last `SYNC_DAYS` nights (default 3) to catch late watch
  syncs. It's **idempotent** — upserts on the `(user_id, log_date)` key.
- Only objective columns are written (`source='garmin'`). Your subjective
  `quality` stars and `notes` are never overwritten.

## One-time setup

### 1. Generate the token blob (local machine)

Needs Python 3. If `python`/`pip` isn't found, install it first
(`winget install -e --id Python.Python.3.12`), then **reopen the terminal**.

**Windows (PowerShell):**

```powershell
cd scripts\garmin-sync
python -m pip install -r requirements.txt
$env:GARMIN_EMAIL = "you@example.com"
$env:GARMIN_PASSWORD = "your-garmin-password"
python gen_token.py
# when done, clear the password from the session:
$env:GARMIN_PASSWORD = $null
```

**macOS / Linux (bash):**

```bash
cd scripts/garmin-sync
python3 -m pip install -r requirements.txt
GARMIN_EMAIL=you@example.com GARMIN_PASSWORD='...' python3 gen_token.py
```

Answer the MFA prompt if asked, then copy the printed base64 string.

### 2. Add GitHub Actions secrets

Repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value |
| --- | --- |
| `GARMIN_TOKENSTORE` | the base64 blob from step 1 |
| `SUPABASE_URL` | `https://snpjfzfqjwkdwzzqfhsz.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → **service_role** key (server-side only) |
| `TEKIO_USER_ID` | the `USER_ID` from `src/constants/app.ts` |

> The service_role key bypasses RLS. It only ever lives in GitHub secrets and
> runs server-side — never expose it in the browser/Vite build.

### 3. Run it

Actions tab → **Garmin sleep sync** → **Run workflow**. Check the logs, then
confirm rows landed in `sleep_logs`. After that it runs daily at 09:00 UTC.

## Troubleshooting

- **401 / auth errors after months** → the token expired; re-run `gen_token.py`
  and update the `GARMIN_TOKENSTORE` secret.
- **No sleep data** → the watch hadn't synced that night, or the device doesn't
  produce a Sleep Score. Duration still syncs even without a score.
- **Run it locally** to debug: set the same env vars and
  `python sync_sleep.py`.
