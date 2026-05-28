#!/usr/bin/env python3
"""Watch uploads folder and process new images.
When a new image file is created, the script will wait for the file to be stable,
then call the incremental extractor and POST the image to the local fusion endpoint
to obtain a prediction.

Usage:
  python scripts/watch_and_extract.py --uploads ./uploads --server http://localhost:8000
  python scripts/watch_and_extract.py --config .env.watcher

Environment Variables (or .env file):
  WATCH_UPLOADS_DIR, AI_SERVICE_URL, TARGET_SPLIT, LOG_LEVEL, LOG_FILE, 
  FILE_STABILITY_TIMEOUT, API_REQUEST_TIMEOUT, RETRY_ATTEMPTS, RETRY_DELAY
"""
import time
from pathlib import Path
import requests
import argparse
import subprocess
import threading
import logging
import os
from datetime import datetime
import sys

from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# ============================================================
# LOGGING SETUP
# ============================================================
def setup_logging(level=logging.INFO, log_file=None):
    """Configure logging to console and optionally to file"""
    formatter = logging.Formatter(
        '[%(asctime)s] [%(levelname)s] %(name)s: %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    logger = logging.getLogger()
    logger.setLevel(level)
    
    # Clear existing handlers
    logger.handlers = []
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # File handler (if specified)
    if log_file:
        Path(log_file).parent.mkdir(parents=True, exist_ok=True)
        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    
    return logger


logger = logging.getLogger(__name__)


# ============================================================
# CONFIG LOADING
# ============================================================
def load_config(env_file=None):
    """Load configuration from environment or .env file"""
    config = {
        'uploads_dir': os.getenv('WATCH_UPLOADS_DIR', './uploads'),
        'server_url': os.getenv('AI_SERVICE_URL', 'http://localhost:8000'),
        'target_split': os.getenv('TARGET_SPLIT', 'test'),
        'log_level': os.getenv('LOG_LEVEL', 'INFO'),
        'log_file': os.getenv('LOG_FILE', ''),
        'file_stability_timeout': float(os.getenv('FILE_STABILITY_TIMEOUT', '5')),
        'api_request_timeout': float(os.getenv('API_REQUEST_TIMEOUT', '60')),
        'retry_attempts': int(os.getenv('RETRY_ATTEMPTS', '3')),
        'retry_delay': float(os.getenv('RETRY_DELAY', '2')),
    }
    
    # Load from .env file if provided
    if env_file and Path(env_file).exists():
        logger.info(f"Loading config from {env_file}")
        with open(env_file) as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                key, _, val = line.partition('=')
                key = key.strip()
                val = val.strip()
                env_key = key.upper()
                if env_key in [k.upper() for k in config.keys()]:
                    # Case-insensitive key matching
                    for k in config.keys():
                        if k.upper() == env_key:
                            if k in ('file_stability_timeout', 'api_request_timeout', 'retry_delay'):
                                config[k] = float(val)
                            elif k == 'retry_attempts':
                                config[k] = int(val)
                            else:
                                config[k] = val
                            break
    
    return config


# ============================================================
# FILE HANDLER
# ============================================================
class NewFileHandler(FileSystemEventHandler):
    def __init__(self, config):
        self.config = config
        self.uploads_dir = Path(config['uploads_dir'])
        self.server_url = config['server_url']
        self.target_split = config['target_split']
        self.retry_attempts = config['retry_attempts']
        self.retry_delay = config['retry_delay']
        self.stability_timeout = config['file_stability_timeout']
        self.api_timeout = config['api_request_timeout']

    def on_created(self, event):
        if event.is_directory:
            return
        path = Path(event.src_path)
        if path.suffix.lower() not in ('.jpg', '.jpeg', '.png'):
            return

        # Process in background thread
        thread = threading.Thread(target=self._process_file, args=(path,))
        thread.daemon = True
        thread.start()

    def _wait_for_stability(self, path, timeout=None):
        """Wait for file to be fully written (size stable)"""
        if timeout is None:
            timeout = self.stability_timeout
        
        start = time.time()
        while time.time() - start < timeout:
            try:
                size1 = path.stat().st_size
                time.sleep(0.5)
                size2 = path.stat().st_size
                if size1 == size2:
                    logger.info(f"File stable: {path.name} ({size1} bytes)")
                    return True
            except Exception as e:
                logger.debug(f"Error checking file size: {e}")
                time.sleep(0.5)
        
        logger.warning(f"File did not stabilize within {timeout}s: {path}")
        return False

    def _run_extractor(self, path):
        """Run incremental extractor CLI"""
        cmd = [
            "python",
            "scripts/incremental_extract.py",
            "--file", str(path),
            "--out", "./dataset/chest_xray",
            "--split", self.target_split
        ]
        logger.info(f"Running extractor: {' '.join(cmd)}")
        try:
            result = subprocess.run(cmd, check=True, capture_output=True, text=True, timeout=120)
            logger.info(f"Extractor output: {result.stdout}")
            return True
        except subprocess.TimeoutExpired:
            logger.error(f"Extractor timeout for {path}")
            return False
        except Exception as e:
            logger.error(f"Extractor failed for {path}: {e}")
            return False

    def _call_prediction_api(self, path):
        """Call fusion prediction endpoint with retry logic"""
        for attempt in range(1, self.retry_attempts + 1):
            try:
                logger.info(f"[Attempt {attempt}/{self.retry_attempts}] POSTing to {self.server_url}/api/fusion/predict/image")
                with open(path, 'rb') as f:
                    files = {'file': (path.name, f, 'image/jpeg')}
                    resp = requests.post(
                        f"{self.server_url}/api/fusion/predict/image",
                        files=files,
                        timeout=self.api_timeout
                    )
                    resp.raise_for_status()
                    data = resp.json()
                    preds = data.get('predictions', [])
                    probs = data.get('probabilities', {})
                    logger.info(
                        f"✅ Prediction for {path.name}: "
                        f"pred={preds}, normal_prob={probs.get('normal', [])}, pneumonia_prob={probs.get('pneumonia', [])}"
                    )
                    return True
            except requests.exceptions.Timeout:
                logger.warning(f"[Attempt {attempt}] API timeout")
                if attempt < self.retry_attempts:
                    time.sleep(self.retry_delay)
            except requests.exceptions.ConnectionError:
                logger.warning(f"[Attempt {attempt}] Connection error to {self.server_url}")
                if attempt < self.retry_attempts:
                    time.sleep(self.retry_delay)
            except requests.exceptions.HTTPError as e:
                logger.error(f"[Attempt {attempt}] HTTP error: {e.response.status_code} {e.response.text}")
                if attempt < self.retry_attempts:
                    time.sleep(self.retry_delay)
            except Exception as e:
                logger.error(f"[Attempt {attempt}] Prediction error: {e}")
                if attempt < self.retry_attempts:
                    time.sleep(self.retry_delay)
        
        logger.error(f"Failed to get prediction after {self.retry_attempts} attempts")
        return False

    def _process_file(self, path):
        """Main processing flow for a new image file"""
        try:
            logger.info(f"📌 New file detected: {path.name}")
            
            # 1. Wait for file stability
            if not self._wait_for_stability(path):
                logger.warning(f"File not stable, skipping: {path}")
                return
            
            # 2. Run extractor
            if not self._run_extractor(path):
                logger.warning(f"Extractor failed, skipping prediction: {path}")
                return
            
            # 3. Call prediction API
            if not self._call_prediction_api(path):
                logger.warning(f"Prediction failed: {path}")
                return
            
            logger.info(f"✅ Successfully processed {path.name}")
        
        except Exception as e:
            logger.error(f"Unexpected error processing {path}: {type(e).__name__}: {e}", exc_info=True)


# ============================================================
# MAIN
# ============================================================
def main():
    parser = argparse.ArgumentParser(
        description='Watch folder for new X-ray images and run predictions'
    )
    parser.add_argument('--config', type=str, help='Path to .env config file')
    parser.add_argument('--uploads', type=str, help='Folder to watch for new images (overrides config)')
    parser.add_argument('--server', type=str, help='AI service base URL (overrides config)')
    parser.add_argument('--split', type=str, help='Target split (train/test, overrides config)')
    parser.add_argument('--loglevel', type=str, choices=['DEBUG','INFO','WARNING','ERROR'], help='Log level (overrides config)')
    parser.add_argument('--logfile', type=str, help='Log file path (overrides config)')
    args = parser.parse_args()
    
    # Load config
    config = load_config(args.config)
    
    # Override with CLI args if provided
    if args.uploads:
        config['uploads_dir'] = args.uploads
    if args.server:
        config['server_url'] = args.server
    if args.split:
        config['target_split'] = args.split
    if args.loglevel:
        config['log_level'] = args.loglevel
    if args.logfile:
        config['log_file'] = args.logfile
    
    # Setup logging
    log_level = getattr(logging, config['log_level'].upper(), logging.INFO)
    setup_logging(level=log_level, log_file=config['log_file'] if config['log_file'] else None)
    
    logger.info("="*70)
    logger.info("🚀 Watcher started")
    logger.info(f"  Watching: {config['uploads_dir']}")
    logger.info(f"  Server: {config['server_url']}")
    logger.info(f"  Target split: {config['target_split']}")
    logger.info(f"  Log level: {config['log_level']}")
    logger.info("="*70)
    
    # Create uploads directory
    uploads = Path(config['uploads_dir'])
    uploads.mkdir(parents=True, exist_ok=True)
    
    # Setup watcher
    event_handler = NewFileHandler(config)
    observer = Observer()
    observer.schedule(event_handler, str(uploads), recursive=False)
    observer.start()
    
    logger.info(f"Watching {uploads} for new images...")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("Shutting down...")
        observer.stop()
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        observer.stop()
    
    observer.join()
    logger.info("Watcher stopped")


if __name__ == '__main__':
    main()
