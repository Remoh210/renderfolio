#!/usr/bin/env bash
set -euo pipefail

# Always serve the project root (directory containing this script).
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$script_dir"

port=8000

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

echo "Serving on http://localhost:${port}"

if command_exists python3; then
  python3 -m http.server "${port}"
  exit $?
fi

if command_exists python; then
  python -m http.server "${port}"
  exit $?
fi

if command_exists npx; then
  npx serve . -l "${port}"
  exit $?
fi

echo "No server found. Install Python or Node (npx), then rerun."
exit 1
