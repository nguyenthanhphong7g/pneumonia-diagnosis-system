"""
Data Preparation Module
Reference: MadeWithML - Data Preparation Phase
Purpose: Load, validate, and organize chest X-ray dataset
"""

import os
import shutil
from pathlib import Path
import numpy as np
from PIL import Image
import yaml
import logging
from collections import Counter
from typing import Tuple, List

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load configuration
def load_config(config_path: str = "configs/settings.yaml") -> dict:
    """Load YAML configuration file"""
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)
    return config

class DataPreparationPipeline:
    """
    Data Preparation Pipeline for Pneumonia Diagnosis
    
    Converts raw chest_xray folder structure to organized train/val/test split
    """
    
    def __init__(self, config_path: str = "configs/settings.yaml"):
        self.config = load_config(config_path)
        self.raw_dir = Path(self.config['DATA']['raw_dir'])
        self.processed_dir = Path(self.config['DATA']['processed_dir'])
        self.train_split = self.config['DATA']['train_split']
        self.val_split = self.config['DATA']['val_split']
        self.test_split = self.config['DATA']['test_split']
        
        logger.info(f"Data Preparation initialized")
        logger.info(f"  Raw dir: {self.raw_dir}")
        logger.info(f"  Processed dir: {self.processed_dir}")
        logger.info(f"  Splits: {self.train_split} / {self.val_split} / {self.test_split}")
    
    def discover_data(self) -> dict:
        """
        Discover and catalog all images in raw dataset
        Expected structure from chest_xray/:
        - chest_xray/train/NORMAL/*.jpeg
        - chest_xray/train/PNEUMONIA/*.jpeg
        - chest_xray/val/NORMAL/*.jpeg
        - chest_xray/val/PNEUMONIA/*.jpeg
        - chest_xray/test/NORMAL/*.jpeg
        - chest_xray/test/PNEUMONIA/*.jpeg
        """
        data = {"train": {}, "val": {}, "test": {}}
        
        for split in ["train", "val", "test"]:
            split_dir = self.raw_dir / split
            if not split_dir.exists():
                logger.warning(f"  ⚠️  {split_dir} does not exist")
                continue
            
            for class_label in ["NORMAL", "PNEUMONIA"]:
                class_dir = split_dir / class_label
                if not class_dir.exists():
                    logger.warning(f"    ⚠️  {class_dir} does not exist")
                    continue
                
                images = list(class_dir.glob("*.jpeg")) + list(class_dir.glob("*.jpg"))
                data[split][class_label] = images
                logger.info(f"  ✅ {split}/{class_label}: {len(images)} images")
        
        return data
    
    def validate_images(self, data: dict) -> dict:
        """
        Validate image integrity
        - Check file size > 0
        - Check image can be opened
        - Check image dimensions reasonable
        """
        valid_data = {"train": {}, "val": {}, "test": {}}
        invalid_count = 0
        
        for split in ["train", "val", "test"]:
            for class_label in ["NORMAL", "PNEUMONIA"]:
                valid_data[split][class_label] = []
                
                if class_label not in data[split]:
                    continue
                
                for img_path in data[split][class_label]:
                    try:
                        # Check file size
                        if img_path.stat().st_size == 0:
                            logger.warning(f"  ⚠️  Empty file: {img_path}")
                            invalid_count += 1
                            continue
                        
                        # Check image can be opened
                        img = Image.open(img_path)
                        width, height = img.size
                        
                        # Check reasonable dimensions
                        if width < 100 or height < 100:
                            logger.warning(f"  ⚠️  Too small: {img_path} ({width}x{height})")
                            invalid_count += 1
                            continue
                        
                        valid_data[split][class_label].append(img_path)
                    
                    except Exception as e:
                        logger.warning(f"  ⚠️  Invalid image: {img_path} - {str(e)}")
                        invalid_count += 1
        
        logger.info(f"✅ Validation complete: {invalid_count} invalid images excluded")
        return valid_data
    
    def organize_processed_dataset(self, data: dict):
        """
        Organize validated data into processed folder
        Create structure:
        - data/processed/train/normal/
        - data/processed/train/pneumonia/
        - data/processed/val/...
        - data/processed/test/...
        - data/processed/metadata.txt
        """
        self.processed_dir.mkdir(parents=True, exist_ok=True)
        
        stats = {"total": 0, "splits": {}}
        
        for split in ["train", "val", "test"]:
            stats["splits"][split] = {"normal": 0, "pneumonia": 0}
            
            for class_label in ["NORMAL", "PNEUMONIA"]:
                class_lower = class_label.lower()
                class_dir = self.processed_dir / split / class_lower
                class_dir.mkdir(parents=True, exist_ok=True)
                
                if class_label not in data[split]:
                    continue
                
                for i, img_path in enumerate(data[split][class_label], 1):
                    # Copy image with new name
                    new_name = f"{class_lower}_{i:05d}.jpg"
                    dest_path = class_dir / new_name
                    shutil.copy2(img_path, dest_path)
                    
                    stats["splits"][split][class_lower] += 1
                    stats["total"] += 1
                
                logger.info(f"✅ Processed {split}/{class_label}: {stats['splits'][split][class_lower]} images")
        
        # Save metadata
        metadata_path = self.processed_dir / "metadata.txt"
        with open(metadata_path, 'w') as f:
            f.write("Dataset Metadata\n")
            f.write("=" * 50 + "\n")
            f.write(f"Total images: {stats['total']}\n\n")
            for split in ["train", "val", "test"]:
                normal = stats["splits"][split]["normal"]
                pneumonia = stats["splits"][split]["pneumonia"]
                total = normal + pneumonia
                f.write(f"{split.upper()}:\n")
                f.write(f"  NORMAL: {normal} ({100*normal/total:.1f}%)\n")
                f.write(f"  PNEUMONIA: {pneumonia} ({100*pneumonia/total:.1f}%)\n")
                f.write(f"  TOTAL: {total}\n\n")
        
        logger.info(f"✅ Metadata saved to {metadata_path}")
        return stats
    
    def run(self):
        """Execute full data preparation pipeline"""
        logger.info("\n" + "="*70)
        logger.info("DATA PREPARATION PIPELINE")
        logger.info("="*70 + "\n")
        
        # Step 1: Discover
        logger.info("STEP 1: Discovering raw dataset...")
        raw_data = self.discover_data()
        
        # Step 2: Validate
        logger.info("\nSTEP 2: Validating images...")
        valid_data = self.validate_images(raw_data)
        
        # Step 3: Organize
        logger.info("\nSTEP 3: Organizing processed dataset...")
        stats = self.organize_processed_dataset(valid_data)
        
        logger.info("\n" + "="*70)
        logger.info("✅ DATA PREPARATION COMPLETE")
        logger.info("="*70 + "\n")
        
        return stats

if __name__ == "__main__":
    # Run data preparation
    pipeline = DataPreparationPipeline()
    stats = pipeline.run()
    
    # Print summary
    print("\n📊 DATASET SUMMARY:")
    print(f"Total images: {stats['total']}")
    for split in ["train", "val", "test"]:
        n = stats["splits"][split]["normal"]
        p = stats["splits"][split]["pneumonia"]
        print(f"  {split}: {n} normal + {p} pneumonia = {n+p} total")
