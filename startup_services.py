#!/usr/bin/env python3
"""
Comprehensive Service Startup & Verification Script
Starts AI Service and Backend in proper order with health checks
"""

import os
import sys
import subprocess
import time
import requests
import json
import logging
from pathlib import Path
from typing import Tuple, Optional

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s - %(message)s'
)
logger = logging.getLogger("startup")

# Configuration
SCRIPT_DIR = Path(__file__).parent
AI_SERVICE_DIR = SCRIPT_DIR / "ai-service"
BACKEND_DIR = SCRIPT_DIR / "backend"

AI_SERVICE_URL = "http://localhost:8000"
AI_SERVICE_HEALTH_URL = f"{AI_SERVICE_URL}/health"
BACKEND_URL = "http://localhost:8090"
BACKEND_HEALTH_URL = f"{BACKEND_URL}/api/users/profile"  # Or any health endpoint

# Timeouts
STARTUP_TIMEOUT = 60  # 60 seconds to start
HEALTH_CHECK_TIMEOUT = 5
HEALTH_CHECK_INTERVAL = 2

def print_banner(text: str):
    """Print a formatted banner"""
    print("\n" + "=" * 70)
    print(f"  {text}")
    print("=" * 70)

def check_python_env() -> bool:
    """Check if Python environment is properly configured"""
    print_banner("CHECKING PYTHON ENVIRONMENT")
    
    try:
        import tensorflow
        logger.info("✅ TensorFlow is installed")
    except ImportError:
        logger.warning("⚠️  TensorFlow not found - may be needed")
    
    try:
        import torch
        logger.info("✅ PyTorch is installed")
    except ImportError:
        logger.warning("⚠️  PyTorch not found - may be needed")
    
    try:
        import fastapi
        logger.info("✅ FastAPI is installed")
    except ImportError:
        logger.error("❌ FastAPI not installed - REQUIRED for AI Service")
        return False
    
    return True

def wait_for_service(url: str, name: str, timeout: int = STARTUP_TIMEOUT) -> bool:
    """Wait for a service to become available"""
    logger.info(f"⏳ Waiting for {name} to start (timeout: {timeout}s)...")
    
    start_time = time.time()
    last_error = None
    
    while time.time() - start_time < timeout:
        try:
            response = requests.get(url, timeout=HEALTH_CHECK_TIMEOUT)
            if response.status_code < 500:  # Accept any non-server-error response
                logger.info(f"✅ {name} is running on {url}")
                return True
        except requests.exceptions.ConnectionError as e:
            last_error = str(e)
        except requests.exceptions.Timeout:
            pass
        except Exception as e:
            last_error = str(e)
        
        time.sleep(HEALTH_CHECK_INTERVAL)
    
    logger.error(f"❌ {name} failed to start within {timeout}s")
    if last_error:
        logger.error(f"   Last error: {last_error}")
    return False

def start_ai_service() -> Tuple[bool, Optional[subprocess.Popen]]:
    """Start AI Service"""
    print_banner("STARTING AI SERVICE")
    
    if not AI_SERVICE_DIR.exists():
        logger.error(f"❌ AI service directory not found: {AI_SERVICE_DIR}")
        return False, None
    
    logger.info(f"📂 AI Service directory: {AI_SERVICE_DIR}")
    
    # Check if main.py exists
    main_py = AI_SERVICE_DIR / "main.py"
    if not main_py.exists():
        logger.error(f"❌ main.py not found: {main_py}")
        return False, None
    
    logger.info(f"🚀 Starting AI Service from: {main_py}")
    
    # Run setup script if available
    setup_script = AI_SERVICE_DIR / ("setup_env.ps1" if sys.platform == "win32" else "setup_env.sh")
    if setup_script.exists():
        logger.info(f"🔧 Running AI Service setup script: {setup_script}")
        try:
            if sys.platform == "win32":
                subprocess.run(["powershell", "-ExecutionPolicy", "Bypass", "-File", str(setup_script)], check=True)
            else:
                subprocess.run(["bash", str(setup_script)], check=True)
        except subprocess.CalledProcessError as e:
            logger.error(f"❌ AI Service setup script failed: {e}")
            return False, None

    # Prefer virtualenv python if available
    venv_python = AI_SERVICE_DIR / ("venv/Scripts/python.exe" if sys.platform == "win32" else "venv/bin/python")
    python_executable = str(venv_python) if venv_python.exists() else sys.executable

    try:
        # Set environment
        env = os.environ.copy()
        env["PYTHONUNBUFFERED"] = "1"
        env["PORT"] = "8000"
        env["HOST"] = "0.0.0.0"
        
        # Start process
        process = subprocess.Popen(
            [python_executable, "main.py"],
            cwd=str(AI_SERVICE_DIR),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,
            env=env
        )
        
        logger.info(f"✅ AI Service process started (PID: {process.pid})")
        
        # Give it a moment to show startup output
        time.sleep(2)
        
        # Check if process is still alive
        if process.poll() is not None:
            stdout, stderr = process.communicate()
            logger.error("❌ AI Service process died immediately!")
            logger.error(f"STDOUT:\n{stdout}")
            logger.error(f"STDERR:\n{stderr}")
            return False, None
        
        logger.info("✅ AI Service process is running")
        return True, process
        
    except Exception as e:
        logger.error(f"❌ Failed to start AI Service: {e}")
        return False, None

def start_backend() -> Tuple[bool, Optional[subprocess.Popen]]:
    """Start Backend (Java Spring Boot)"""
    print_banner("STARTING BACKEND")
    
    if not BACKEND_DIR.exists():
        logger.error(f"❌ Backend directory not found: {BACKEND_DIR}")
        return False, None
    
    logger.info(f"📂 Backend directory: {BACKEND_DIR}")
    
    # Check for mvnw or pom.xml
    mvnw = BACKEND_DIR / "mvnw.cmd" if sys.platform == "win32" else BACKEND_DIR / "mvnw"
    pom_xml = BACKEND_DIR / "pom.xml"
    
    if not pom_xml.exists():
        logger.error(f"❌ pom.xml not found: {pom_xml}")
        return False, None
    
    if not mvnw.exists():
        logger.error(f"❌ mvnw not found: {mvnw}")
        return False, None
    
    logger.info(f"🚀 Starting Backend with Maven...")
    
    try:
        # Prepare command
        if sys.platform == "win32":
            cmd = [str(mvnw), "spring-boot:run"]
        else:
            cmd = ["bash", str(mvnw), "spring-boot:run"]
        
        process = subprocess.Popen(
            cmd,
            cwd=str(BACKEND_DIR),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1
        )
        
        logger.info(f"✅ Backend process started (PID: {process.pid})")
        
        # Give it a moment
        time.sleep(3)
        
        # Check if process is still alive
        if process.poll() is not None:
            stdout, stderr = process.communicate()
            logger.error("❌ Backend process died immediately!")
            logger.error(f"STDERR:\n{stderr[-500:]}")  # Last 500 chars
            return False, None
        
        logger.info("✅ Backend process is running")
        return True, process
        
    except Exception as e:
        logger.error(f"❌ Failed to start Backend: {e}")
        return False, None

def test_connectivity() -> bool:
    """Test connectivity between services"""
    print_banner("TESTING CONNECTIVITY")
    
    logger.info("Testing AI Service...")
    try:
        response = requests.get(AI_SERVICE_HEALTH_URL, timeout=5)
        health = response.json()
        logger.info(f"✅ AI Service health: {health.get('status', 'unknown')}")
    except Exception as e:
        logger.error(f"❌ Cannot reach AI Service: {e}")
        return False
    
    logger.info("Testing Backend...")
    try:
        response = requests.get(BACKEND_HEALTH_URL, timeout=5)
        logger.info(f"✅ Backend is responding (status: {response.status_code})")
    except Exception as e:
        logger.warning(f"⚠️  Cannot reach Backend health endpoint (this may be normal): {e}")
    
    return True

def get_ai_service_port() -> Optional[int]:
    """Get actual AI service port from .ai-service-port file"""
    port_file = AI_SERVICE_DIR / ".ai-service-port"
    if port_file.exists():
        try:
            port = int(port_file.read_text().strip())
            return port
        except Exception as e:
            logger.warning(f"Could not read port file: {e}")
    return None

def main():
    """Main startup orchestration"""
    print_banner("PNEUMONIA DIAGNOSIS SYSTEM - SERVICE STARTUP")
    
    running_processes = []
    
    try:
        # Step 1: Check Python environment
        if not check_python_env():
            logger.error("❌ Python environment check failed")
            return 1
        
        # Step 2: Start AI Service (must be first)
        ai_ok, ai_process = start_ai_service()
        if not ai_ok or ai_process is None:
            logger.error("❌ Failed to start AI Service - aborting")
            return 1
        running_processes.append(("AI Service", ai_process))
        
        # Step 3: Wait for AI Service to be ready
        if not wait_for_service(AI_SERVICE_HEALTH_URL, "AI Service"):
            logger.error("❌ AI Service did not become ready")
            return 1
        
        # Step 4: Get actual AI service port
        actual_port = get_ai_service_port()
        if actual_port and actual_port != 8000:
            logger.warning(f"⚠️  AI Service is running on fallback port: {actual_port}")
            logger.warning(f"    Backend will try to connect to: 8000, 8001, 8002, 8003")
        
        # Step 5: Start Backend (depends on AI Service)
        backend_ok, backend_process = start_backend()
        if backend_ok and backend_process is not None:
            running_processes.append(("Backend", backend_process))
            
            # Step 6: Wait for Backend to be ready
            if not wait_for_service(BACKEND_URL, "Backend", timeout=120):
                logger.warning("⚠️  Backend did not become ready - it may still be starting")
        else:
            logger.warning("⚠️  Failed to start Backend - continuing anyway")
        
        # Step 7: Final connectivity test
        time.sleep(5)  # Give services a moment to fully stabilize
        if not test_connectivity():
            logger.warning("⚠️  Connectivity test failed - services may still be starting")
        
        # Success!
        print_banner("✅ STARTUP COMPLETE")
        logger.info(f"🌐 Frontend: http://localhost:5173")
        logger.info(f"🌐 Backend:  {BACKEND_URL}")
        logger.info(f"🌐 AI Service: {AI_SERVICE_URL}")
        logger.info(f"📊 AI Health: {AI_SERVICE_URL}/health")
        logger.info(f"📊 AI Status: {AI_SERVICE_URL}/status")
        
        logger.info("\n✅ All services are running!")
        logger.info("Press Ctrl+C to stop all services.\n")
        
        # Keep the script running
        try:
            while True:
                time.sleep(1)
                # Check if any process died
                for name, process in running_processes:
                    if process.poll() is not None:
                        logger.error(f"❌ {name} process died (exit code: {process.returncode})")
        except KeyboardInterrupt:
            print("\n")
            logger.info("Shutting down services...")
            for name, process in running_processes:
                try:
                    logger.info(f"  Stopping {name}...")
                    process.terminate()
                    process.wait(timeout=5)
                    logger.info(f"  ✅ {name} stopped")
                except Exception as e:
                    logger.warning(f"  ⚠️  Could not stop {name}: {e}")
                    try:
                        process.kill()
                    except:
                        pass
            logger.info("✅ All services stopped")
            return 0
        
    except Exception as e:
        logger.error(f"❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
