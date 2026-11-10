#!/usr/bin/env bash
# Run any command with FAL_KEY pulled from Azure Key Vault (never written to disk).
# Usage: scripts/run.sh python3 scripts/generate.py [--dry-run]
set -euo pipefail
VAULT="${KEYVAULT_NAME:-dp-kv-deliverypilot}"
SECRET="${FAL_SECRET_NAME:-FAL-AI-KEY}"
FAL_KEY="$(az keyvault secret show --vault-name "$VAULT" --name "$SECRET" --query value -o tsv)"
export FAL_KEY
exec "$@"
