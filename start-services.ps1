# Pneumonia Diagnosis System - Windows Startup Script
# This script starts all required services in the correct order

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "  PNEUMONIA DIAGNOSIS SYSTEM - SERVICE STARTUP (Windows)" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$AIServiceDir = Join-Path $ScriptDir "ai-service"
$BackendDir = Join-Path $ScriptDir "backend"

$AIServicePort = 8000
$BackendPort = 8090
$FrontendPort = 5173

# Colors for output
$SuccessColor = "Green"
$ErrorColor = "Red"
$WarningColor = "Yellow"
$InfoColor = "Cyan"

function Test-Port {
    param([int]$Port)
    $TcpClient = New-Object System.Net.Sockets.TcpClient
    $TcpClient.ReceiptTimeout = 100
    try {
        $TcpClient.Connect("127.0.0.1", $Port)
        $TcpClient.Close()
        return $true
    }
    catch {
        return $false
    }
}

function Stop-ProcessOnPort {
    param([int]$Port)

    try {
        $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction Stop
        foreach ($connection in $connections) {
            $pid = $connection.OwningProcess
            if ($pid -and $pid -ne $PID) {
                Write-Host "⚠️  Stopping process $pid on port $Port..." -ForegroundColor $WarningColor
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            }
        }
    }
    catch {
        # Ignore if nothing is listening or if the cmdlet is unavailable
    }
}

function Wait-ForService {
    param(
        [string]$URL,
        [string]$Name,
        [int]$TimeoutSeconds = 60
    )
    
    Write-Host "⏳ Waiting for $Name to start (timeout: ${TimeoutSeconds}s)..." -ForegroundColor $InfoColor
    $StartTime = Get-Date
    
    while ((Get-Date) - $StartTime -lt [TimeSpan]::FromSeconds($TimeoutSeconds)) {
        try {
            $response = Invoke-WebRequest -Uri $URL -TimeoutSec 3 -ErrorAction Stop
            Write-Host "✅ $Name is running on $URL" -ForegroundColor $SuccessColor
            return $true
        }
        catch {
            Start-Sleep -Seconds 2
        }
    }
    
    Write-Host "❌ $Name failed to start within ${TimeoutSeconds}s" -ForegroundColor $ErrorColor
    return $false
}

# Verify directories exist
if (-not (Test-Path $AIServiceDir)) {
    Write-Host "❌ AI service directory not found: $AIServiceDir" -ForegroundColor $ErrorColor
    exit 1
}

if (-not (Test-Path $BackendDir)) {
    Write-Host "❌ Backend directory not found: $BackendDir" -ForegroundColor $ErrorColor
    exit 1
}

# Check if ports are already in use
Write-Host ""
Write-Host "Checking port availability..." -ForegroundColor $InfoColor

if (Test-Port $AIServicePort) {
    Write-Host "⚠️  Port $AIServicePort is already in use" -ForegroundColor $WarningColor
    Write-Host "   AI Service will try to use alternative port (8001, 8002, etc.)" -ForegroundColor $WarningColor
}

if (Test-Port $BackendPort) {
    Write-Host "⚠️  Port $BackendPort is already in use" -ForegroundColor $WarningColor
    Write-Host "   Attempting to free the port before starting Backend..." -ForegroundColor $WarningColor
    Stop-ProcessOnPort -Port $BackendPort
    Start-Sleep -Seconds 2
}

# Start AI Service
Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "  STARTING AI SERVICE" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan

$mainPy = Join-Path $AIServiceDir "main.py"
if (-not (Test-Path $mainPy)) {
    Write-Host "❌ main.py not found: $mainPy" -ForegroundColor $ErrorColor
    exit 1
}

Write-Host "🚀 Starting AI Service from: $mainPy" -ForegroundColor $InfoColor
Write-Host "   Directory: $AIServiceDir" -ForegroundColor $InfoColor

$env:PYTHONUNBUFFERED = 1
$env:PORT = "8000"
$env:HOST = "0.0.0.0"

$AIProcess = Start-Process -FilePath python -ArgumentList $mainPy -WorkingDirectory $AIServiceDir -PassThru -NoNewWindow
Write-Host "✅ AI Service process started (PID: $($AIProcess.Id))" -ForegroundColor $SuccessColor

# Give it a moment to start
Start-Sleep -Seconds 3

# Check if process is still alive
if ($AIProcess.HasExited) {
    Write-Host "❌ AI Service process died immediately!" -ForegroundColor $ErrorColor
    exit 1
}

Write-Host "✅ AI Service process is running" -ForegroundColor $SuccessColor

# Wait for AI Service to be ready
if (-not (Wait-ForService "http://localhost:8000/health" "AI Service")) {
    Write-Host "❌ AI Service health check failed - continuing anyway" -ForegroundColor $WarningColor
}

# Start Backend
Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "  STARTING BACKEND" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan

$pomXml = Join-Path $BackendDir "pom.xml"
if (-not (Test-Path $pomXml)) {
    Write-Host "❌ pom.xml not found: $pomXml" -ForegroundColor $ErrorColor
    $AIProcess.Kill()
    exit 1
}

$mvnw = Join-Path $BackendDir "mvnw.cmd"
if (-not (Test-Path $mvnw)) {
    Write-Host "❌ mvnw.cmd not found: $mvnw" -ForegroundColor $ErrorColor
    $AIProcess.Kill()
    exit 1
}

Write-Host "🚀 Starting Backend with Maven..." -ForegroundColor $InfoColor
Write-Host "   Directory: $BackendDir" -ForegroundColor $InfoColor
Write-Host "   Command: $mvnw spring-boot:run" -ForegroundColor $InfoColor

$BackendProcess = Start-Process -FilePath $mvnw -ArgumentList "spring-boot:run" -WorkingDirectory $BackendDir -PassThru
Write-Host "✅ Backend process started (PID: $($BackendProcess.Id))" -ForegroundColor $SuccessColor

# Give it more time since Maven needs to download dependencies
Start-Sleep -Seconds 5

if ($BackendProcess.HasExited) {
    Write-Host "❌ Backend process died immediately!" -ForegroundColor $ErrorColor
}
else {
    Write-Host "✅ Backend process is running" -ForegroundColor $SuccessColor
}

# Wait for Backend to be ready
if (-not (Wait-ForService "http://localhost:8090" "Backend" 120)) {
    Write-Host "⚠️  Backend health check failed - it may still be starting" -ForegroundColor $WarningColor
}

# Final summary
Write-Host ""
Write-Host "================================================================================" -ForegroundColor Green
Write-Host "  ✅ STARTUP COMPLETE" -ForegroundColor Green
Write-Host "================================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Access points:" -ForegroundColor $InfoColor
Write-Host "   Frontend: http://localhost:$FrontendPort" -ForegroundColor $SuccessColor
Write-Host "   Backend:  http://localhost:$BackendPort" -ForegroundColor $SuccessColor
Write-Host "   AI Service: http://localhost:$AIServicePort" -ForegroundColor $SuccessColor
Write-Host ""
Write-Host "📊 Health checks:" -ForegroundColor $InfoColor
Write-Host "   AI Health: http://localhost:$AIServicePort/health" -ForegroundColor $SuccessColor
Write-Host "   AI Status: http://localhost:$AIServicePort/status" -ForegroundColor $SuccessColor
Write-Host ""
Write-Host "📋 Process IDs:" -ForegroundColor $InfoColor
Write-Host "   AI Service: $($AIProcess.Id)" -ForegroundColor $SuccessColor
Write-Host "   Backend: $($BackendProcess.Id)" -ForegroundColor $SuccessColor
Write-Host ""
Write-Host "! Both processes are running. Close this window or press Ctrl+C to stop all services." -ForegroundColor $WarningColor
Write-Host ""

# Keep script running and monitor processes
try {
    while ($true) {
        Start-Sleep -Seconds 5
        
        # Check if AI Service is still running
        if ($AIProcess.HasExited) {
            Write-Host "❌ AI Service process died (exit code: $($AIProcess.ExitCode))" -ForegroundColor $ErrorColor
        }
        
        # Check if Backend is still running  
        if ($BackendProcess.HasExited) {
            Write-Host "❌ Backend process died (exit code: $($BackendProcess.ExitCode))" -ForegroundColor $ErrorColor
        }
    }
}
catch [System.OperationCanceledException] {
    Write-Host ""
    Write-Host "Shutting down services..." -ForegroundColor $InfoColor
}
finally {
    Write-Host ""
    Write-Host "Stopping processes..." -ForegroundColor $InfoColor
    
    try {
        if (-not $AIProcess.HasExited) {
            Write-Host "  Stopping AI Service (PID: $($AIProcess.Id))..." -ForegroundColor $InfoColor
            $AIProcess.Kill()
            $AIProcess.WaitForExit(5000)
            Write-Host "  ✅ AI Service stopped" -ForegroundColor $SuccessColor
        }
    }
    catch {
        Write-Host "  ⚠️  Could not stop AI Service cleanly" -ForegroundColor $WarningColor
    }
    
    try {
        if (-not $BackendProcess.HasExited) {
            Write-Host "  Stopping Backend (PID: $($BackendProcess.Id))..." -ForegroundColor $InfoColor
            $BackendProcess.Kill()
            $BackendProcess.WaitForExit(5000)
            Write-Host "  ✅ Backend stopped" -ForegroundColor $SuccessColor
        }
    }
    catch {
        Write-Host "  ⚠️  Could not stop Backend cleanly" -ForegroundColor $WarningColor
    }
    
    Write-Host "✅ All services stopped" -ForegroundColor $SuccessColor
}
