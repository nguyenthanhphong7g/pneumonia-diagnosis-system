"""
Data Exploration (EDA) Module
Reference: MadeWithML - Data Exploration Phase
Purpose: Understand dataset characteristics, distributions, and quality
"""

import os
from pathlib import Path
import numpy as np
from PIL import Image
import matplotlib.pyplot as plt
import seaborn as sns
import yaml
import logging
from collections import Counter
from typing import Dict, Tuple
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DataExplorer:
    """
    Exploratory Data Analysis for Pneumonia Dataset
    """
    
    def __init__(self, processed_dir: str = "data/processed"):
        self.processed_dir = Path(processed_dir)
        self.stats = {}
        
    def load_config(self, config_path: str = "configs/settings.yaml") -> dict:
        """Load configuration"""
        with open(config_path, 'r') as f:
            return yaml.safe_load(f)
    
    def analyze_image_statistics(self) -> dict:
        """
        Analyze image properties:
        - Dimensions (width, height)
        - File sizes
        - Pixel statistics (mean, std, min, max)
        """
        stats = {
            "splits": {},
            "dimensions": {"widths": [], "heights": []},
            "file_sizes": [],
            "pixel_stats": {"means": [], "stds": []}
        }
        
        for split in ["train", "val", "test"]:
            split_dir = self.processed_dir / split
            if not split_dir.exists():
                continue
            
            stats["splits"][split] = {"normal": {}, "pneumonia": {}}
            
            for class_label in ["normal", "pneumonia"]:
                class_dir = split_dir / class_label
                class_paths = list(class_dir.glob("*.jpg"))
                
                widths, heights, sizes, means, stds = [], [], [], [], []
                
                for img_path in class_paths:
                    try:
                        # Get file size
                        file_size = os.path.getsize(img_path) / 1024  # KB
                        sizes.append(file_size)
                        
                        # Load image
                        img = Image.open(img_path)
                        w, h = img.size
                        widths.append(w)
                        heights.append(h)
                        
                        # Pixel statistics
                        img_array = np.array(img).astype(float) / 255.0
                        means.append(img_array.mean())
                        stds.append(img_array.std())
                    
                    except Exception as e:
                        logger.warning(f"Error analyzing {img_path}: {e}")
                
                stats["splits"][split][class_label] = {
                    "count": len(class_paths),
                    "dimensions": {
                        "width_mean": np.mean(widths) if widths else 0,
                        "width_std": np.std(widths) if widths else 0,
                        "height_mean": np.mean(heights) if heights else 0,
                        "height_std": np.std(heights) if heights else 0,
                    },
                    "file_size_kb": {
                        "mean": np.mean(sizes) if sizes else 0,
                        "std": np.std(sizes) if sizes else 0,
                        "min": np.min(sizes) if sizes else 0,
                        "max": np.max(sizes) if sizes else 0,
                    },
                    "pixel_stats": {
                        "mean_intensity_avg": np.mean(means) if means else 0,
                        "intensity_std_avg": np.mean(stds) if stds else 0,
                    }
                }
                
                stats["dimensions"]["widths"].extend(widths)
                stats["dimensions"]["heights"].extend(heights)
                stats["file_sizes"].extend(sizes)
                stats["pixel_stats"]["means"].extend(means)
                stats["pixel_stats"]["stds"].extend(stds)
        
        return stats
    
    def analyze_class_distribution(self) -> dict:
        """
        Analyze class imbalance
        - Count normal vs pneumonia per split
        - Calculate ratio
        """
        dist = {"splits": {}}
        
        for split in ["train", "val", "test"]:
            split_dir = self.processed_dir / split
            if not split_dir.exists():
                continue
            
            normal_count = len(list((split_dir / "normal").glob("*.jpg")))
            pneumonia_count = len(list((split_dir / "pneumonia").glob("*.jpg")))
            total = normal_count + pneumonia_count
            
            dist["splits"][split] = {
                "normal": normal_count,
                "pneumonia": pneumonia_count,
                "total": total,
                "pneumonia_ratio": pneumonia_count / total if total > 0 else 0,
                "class_weight": {
                    "normal": (1 / normal_count) if normal_count > 0 else 1,
                    "pneumonia": (1 / pneumonia_count) if pneumonia_count > 0 else 1,
                }
            }
        
        return dist
    
    def generate_report(self) -> dict:
        """Generate comprehensive EDA report"""
        logger.info("\n" + "="*70)
        logger.info("DATA EXPLORATION (EDA)")
        logger.info("="*70 + "\n")
        
        # Image statistics
        logger.info("Analyzing image statistics...")
        img_stats = self.analyze_image_statistics()
        
        # Class distribution
        logger.info("Analyzing class distribution...")
        class_dist = self.analyze_class_distribution()
        
        report = {
            "image_statistics": img_stats,
            "class_distribution": class_dist,
        }
        
        # Print summary
        logger.info("\n📊 CLASS DISTRIBUTION:")
        for split, data in class_dist["splits"].items():
            print(f"\n{split.upper()}:")
            print(f"  NORMAL:    {data['normal']:5d} ({100*data['normal']/data['total']:.1f}%)")
            print(f"  PNEUMONIA: {data['pneumonia']:5d} ({100*data['pneumonia']/data['total']:.1f}%)")
            print(f"  TOTAL:     {data['total']:5d}")
            print(f"  ⚠️  Class imbalance ratio: 1:{data['pneumonia']/max(data['normal'], 1):.2f}")
            print(f"  💡 Rebalance with class_weights or oversampling")
        
        logger.info("\n📐 IMAGE DIMENSIONS:")
        for split, split_data in img_stats["splits"].items():
            print(f"\n{split.upper()}:")
            for class_label, class_stats in split_data.items():
                dims = class_stats["dimensions"]
                print(f"  {class_label.upper()}:")
                print(f"    Width:  {dims['width_mean']:.0f} ± {dims['width_std']:.0f}")
                print(f"    Height: {dims['height_mean']:.0f} ± {dims['height_std']:.0f}")
        
        logger.info("\n📦 FILE SIZES:")
        print(f"  Mean: {np.mean(img_stats['file_sizes']):.1f} KB")
        print(f"  Std:  {np.std(img_stats['file_sizes']):.1f} KB")
        print(f"  Min:  {np.min(img_stats['file_sizes']):.1f} KB")
        print(f"  Max:  {np.max(img_stats['file_sizes']):.1f} KB")
        
        logger.info("\n💡 KEY FINDINGS:")
        print("  ✅ Dataset is ready for preprocessing")
        print("  ⚠️  Handle class imbalance (use class_weights)")
        print("  💡 Resize images to 224x224 for model input")
        print("  📌 Apply ImageNet normalization: mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]")
        
        logger.info("\n" + "="*70)
        logger.info("✅ EDA COMPLETE - See report below\n")
        
        return report
    
    def save_report(self, report: dict, output_path: str = "data/processed/eda_report.json"):
        """Save EDA report to JSON"""
        # Convert numpy types to Python types for JSON serialization
        def convert_to_serializable(obj):
            if isinstance(obj, np.integer):
                return int(obj)
            elif isinstance(obj, np.floating):
                return float(obj)
            elif isinstance(obj, dict):
                return {k: convert_to_serializable(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [convert_to_serializable(v) for v in obj]
            return obj
        
        serializable_report = convert_to_serializable(report)
        
        with open(output_path, 'w') as f:
            json.dump(serializable_report, f, indent=2)
        
        logger.info(f"✅ Report saved to {output_path}")

if __name__ == "__main__":
    explorer = DataExplorer()
    report = explorer.generate_report()
    explorer.save_report(report)
