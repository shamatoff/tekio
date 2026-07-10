#!/usr/bin/env python3
"""One-time helper: log in to Garmin (answering MFA if prompted) and print a
base64 token blob to paste into the GARMIN_TOKENSTORE GitHub Actions secret.

Run locally:  GARMIN_EMAIL=you@x.com GARMIN_PASSWORD=... python gen_token.py
Tokens last ~1 year and auto-refresh; regenerate when the daily job starts 401ing.
"""
import os
import sys

from garminconnect import Garmin

email, password = os.getenv("GARMIN_EMAIL"), os.getenv("GARMIN_PASSWORD")
if not (email and password):
    sys.exit("Set GARMIN_EMAIL and GARMIN_PASSWORD, then re-run.")

client = Garmin(email, password, prompt_mfa=lambda: input("MFA code: "))
client.login()

# garminconnect exposes its garth client as `.client` (newer) or `.garth` (older).
garth_client = getattr(client, "garth", None) or client.client
blob = garth_client.dumps()  # base64 string that login()/loads() can restore later
print("\n=== GARMIN_TOKENSTORE (copy everything between the lines) ===\n")
print(blob)
print("\n=== end — paste into the GitHub Actions secret ===")
