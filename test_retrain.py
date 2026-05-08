#!/usr/bin/env python3
"""
Test script for retrain functionality
Usage: python test_retrain.py
"""

import requests
import json
from pathlib import Path
from datetime import datetime

# Configuration
BACKEND_URL = "http://localhost:8080"
AI_SERVICE_URL = "http://localhost:8000"

def test_ai_service():
    """Test AI Service endpoint"""
    print("\n" + "="*50)
    print("🧪 Testing AI Service")
    print("="*50)
    
    try:
        response = requests.get(f"{AI_SERVICE_URL}/")
        print(f"✅ AI Service is running: {response.json()}")
    except Exception as e:
        print(f"❌ AI Service error: {e}")
        return False
    
    return True

def test_backend():
    """Test Backend API"""
    print("\n" + "="*50)
    print("🧪 Testing Backend API")
    print("="*50)
    
    try:
        # Test stats endpoint
        response = requests.get(f"{BACKEND_URL}/api/review/training-data-stats")
        stats = response.json()
        print(f"✅ Training Data Stats:")
        print(f"   Total Reviews: {stats.get('totalReviews')}")
        print(f"   Used for Training: {stats.get('usedForTraining')}")
        print(f"   Unused for Training: {stats.get('unusedForTraining')}")
        print(f"   Pneumonia: {stats.get('pneumoniaCount')}")
        print(f"   Normal: {stats.get('normalCount')}")
        
        return stats.get('unusedForTraining', 0) > 0
    except Exception as e:
        print(f"❌ Backend error: {e}")
        return False

def test_retrain_api():
    """Test Retrain API"""
    print("\n" + "="*50)
    print("🧪 Testing Retrain API")
    print("="*50)
    
    try:
        # Try retrain with unused reviews
        response = requests.post(f"{BACKEND_URL}/api/admin/retrain-unused")
        result = response.json()
        
        if result.get('success'):
            print(f"✅ Retrain successful!")
            print(f"   Message: {result.get('message')}")
            print(f"   Samples: {result.get('samples_processed')}")
            print(f"   Time: {result.get('timestamp')}")
        else:
            print(f"⚠️  Retrain not executed")
            print(f"   Reason: {result.get('message', result.get('error'))}")
        
        return result.get('success', False)
    except Exception as e:
        print(f"❌ Retrain API error: {e}")
        return False

def main():
    print("\n" + "="*50)
    print("🚀 RETRAIN FUNCTIONALITY TEST")
    print("="*50)
    print(f"Started at: {datetime.now().isoformat()}")
    
    # Test 1: AI Service
    ai_ok = test_ai_service()
    
    # Test 2: Backend
    backend_ok = test_backend()
    
    # Test 3: Retrain (only if backend is OK and has unused reviews)
    retrain_ok = False
    if backend_ok:
        retrain_ok = test_retrain_api()
    
    # Summary
    print("\n" + "="*50)
    print("📊 TEST SUMMARY")
    print("="*50)
    print(f"AI Service: {'✅ OK' if ai_ok else '❌ FAILED'}")
    print(f"Backend API: {'✅ OK' if backend_ok else '❌ FAILED'}")
    print(f"Retrain API: {'✅ OK' if retrain_ok else '⚠️ NO DATA OR FAILED'}")
    print("="*50 + "\n")

if __name__ == "__main__":
    main()
