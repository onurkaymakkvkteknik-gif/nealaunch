#!/usr/bin/env bash
set -eo pipefail

MANIFEST_FILE="$(dirname "$0")/../.protected_manifest.sha256"

echo "==> [CI INTEGRITY GATE] Verifying cryptographic SHA256 of protected test suite..."

if [ ! -f "$MANIFEST_FILE" ]; then
  echo "❌ CRITICAL: .protected_manifest.sha256 missing! Aborting."
  exit 1
fi

cd "$(dirname "$0")/.."

if shasum -a 256 -c "$MANIFEST_FILE" > /dev/null 2>&1; then
  echo "✔ [CI INTEGRITY GATE] All protected test hashes MATCH locked manifest. Zero tampering detected."
  exit 0
else
  echo "❌ [SECURITY ALERT] Protected test tamper detected! Hashes DO NOT MATCH locked manifest."
  shasum -a 256 -c "$MANIFEST_FILE" || true
  exit 2
fi
