#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

VENV_DIR="$ROOT_DIR/venv"
REQUIREMENTS="$ROOT_DIR/requirements-frozen.txt"

PYTHON_CMD=python3
if ! command -v "$PYTHON_CMD" >/dev/null 2>&1; then
  PYTHON_CMD=python
fi

if [ ! -d "$VENV_DIR" ]; then
  echo "Creating Python virtual environment in $VENV_DIR..."
  "$PYTHON_CMD" -m venv "$VENV_DIR"
else
  echo "Virtual environment already exists: $VENV_DIR"
fi

echo "Upgrading pip..."
"$VENV_DIR/bin/python" -m pip install --upgrade pip

echo "Installing requirements..."
"$VENV_DIR/bin/python" -m pip install -r "$REQUIREMENTS"

echo
echo "✅ Setup complete."
echo "Activate the environment with: source \"$VENV_DIR/bin/activate\""
