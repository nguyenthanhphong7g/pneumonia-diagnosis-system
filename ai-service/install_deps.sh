#!/usr/bin/env bash
set -e
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "[install_deps.sh] Running in $ROOT_DIR"
PYTHON=${PYTHON:-python3}
if ! command -v "$PYTHON" >/dev/null 2>&1; then
  echo "Python not found: $PYTHON" >&2
  exit 1
fi
cd "$ROOT_DIR"
if [ ! -d "venv" ]; then
  echo "Creating virtualenv..."
  "$PYTHON" -m venv venv
fi
echo "Activating venv and installing requirements..."
source venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
echo "Dependencies installed."
