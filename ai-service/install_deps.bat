@echo off
SETLOCAL
echo [install_deps.bat] Running in %~dp0
cd /d %~dp0
where python >nul 2>&1
if errorlevel 1 (
  echo Python not found. Please install Python 3.x and add to PATH.
  exit /b 1
)
if not exist venv (
  python -m venv venv
)
call venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
echo Dependencies installed.
ENDLOCAL
