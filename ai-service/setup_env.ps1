# Setup Python virtual environment for ai-service
# Run from ai-service folder:
#   .\setup_env.ps1

Set-Location $PSScriptRoot

$venvDir = Join-Path $PSScriptRoot "venv"
$requirements = Join-Path $PSScriptRoot "requirements-frozen.txt"

if (-not (Test-Path $venvDir)) {
    Write-Host "Creating virtual environment in $venvDir..."
    python -m venv $venvDir
} else {
    Write-Host "Virtual environment already exists: $venvDir"
}

$pythonExe = Join-Path $venvDir "Scripts\python.exe"
if (-not (Test-Path $pythonExe)) {
    Write-Host "❌ Python executable not found in venv. Please check your Python installation." -ForegroundColor Red
    exit 1
}

Write-Host "Upgrading pip..."
& $pythonExe -m pip install --upgrade pip

Write-Host "Installing requirements from requirements-frozen.txt..."
& $pythonExe -m pip install -r $requirements

Write-Host ""
Write-Host "✅ Setup complete."
Write-Host "Activate the environment with: .\venv\Scripts\Activate.ps1"
