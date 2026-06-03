"""
Quick Start Script for Data Pipeline
Run this to execute entire data phase
"""

import sys
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def main():
    logger.info("\n" + "="*70)
    logger.info("PNEUMONIA DIAGNOSIS - MLOps DATA PIPELINE")
    logger.info("="*70 + "\n")
    
    # Step 1: Data Preparation
    logger.info("STEP 1️⃣: DATA PREPARATION")
    logger.info("-" * 70)
    try:
        from src.data.preparation import DataPreparationPipeline
        pipeline = DataPreparationPipeline(config_path="configs/settings.yaml")
        stats = pipeline.run()
        logger.info(f"✅ Data Preparation Complete")
    except Exception as e:
        logger.error(f"❌ Data Preparation failed: {e}")
        return False
    
    # Step 2: Data Exploration
    logger.info("\n\nSTEP 2️⃣: DATA EXPLORATION (EDA)")
    logger.info("-" * 70)
    try:
        from src.data.exploration import DataExplorer
        explorer = DataExplorer(processed_dir="dataset/processed")
        report = explorer.generate_report()
        explorer.save_report(report, output_path="dataset/processed/eda_report.json")
        logger.info(f"✅ Data Exploration Complete")
        logger.info(f"   Report saved to: dataset/processed/eda_report.json")
    except Exception as e:
        logger.error(f"❌ Data Exploration failed: {e}")
        return False
    
    # Step 3: Data Preprocessing
    logger.info("\n\nSTEP 3️⃣: DATA PREPROCESSING")
    logger.info("-" * 70)
    try:
        from src.data.preprocessing import DataPreprocessor, DataLoader
        
        preprocessor = DataPreprocessor(config_path="configs/settings.yaml")
        
        # Test single image
        example_img = Path("dataset/processed/train/normal")
        if list(example_img.glob("*.jpg")):
            img_path = str(list(example_img.glob("*.jpg"))[0])
            img = preprocessor.preprocess(img_path, augment=False)
            logger.info(f"✅ Single image preprocessing: {img.shape}")
        
        # Test batch loading
        loader = DataLoader(processed_dir="dataset/processed")
        logger.info("Testing batch loading...")
        batch_count = 0
        for batch_X, batch_y in loader.load_batch("train", batch_size=32, augment=False):
            batch_count += 1
            if batch_count == 1:
                logger.info(f"✅ Batch shape: {batch_X.shape}, Labels: {batch_y.shape}")
            if batch_count >= 3:
                break
        
        logger.info(f"✅ Data Preprocessing Complete (tested {batch_count} batches)")
    except Exception as e:
        logger.error(f"❌ Data Preprocessing failed: {e}")
        logger.error(f"   This is expected if chest_xray dataset not available")
        return False
    
    # Step 4: Distributed Processing (Optional)
    logger.info("\n\nSTEP 4️⃣: DISTRIBUTED PROCESSING (Optional - Ray)")
    logger.info("-" * 70)
    try:
        from src.data.distributed import DistributedDataProcessor
        logger.info("Checking Ray availability...")
        processor = DistributedDataProcessor(num_workers=4)
        logger.info(f"✅ Ray initialized (4 workers)")
        logger.info("✅ Distributed processing ready")
    except ImportError:
        logger.info("⚠️  Ray not installed (optional for large datasets)")
        logger.info("   Install with: pip install ray")
    except Exception as e:
        logger.warning(f"⚠️  Distributed processing skipped: {e}")
    
    # Summary
    logger.info("\n" + "="*70)
    logger.info("✅ DATA PIPELINE COMPLETE")
    logger.info("="*70)
    logger.info("\n📊 Next Steps:")
    logger.info("   1. Review EDA report: dataset/processed/eda_report.json")
    logger.info("   2. Check data statistics (class distribution, dimensions)")
    logger.info("   3. Proceed to Model Training Phase 🚀")
    logger.info("\n📚 Documentation:")
    logger.info("   - Data Pipeline Guide: docs/DATA_PIPELINE_GUIDE.md")
    logger.info("   - System Design: docs/SYSTEM_DESIGN.md")
    logger.info("   - Product Requirements: docs/PRD.md")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
