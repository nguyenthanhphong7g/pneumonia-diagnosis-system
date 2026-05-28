"""
Distributed Data Processing with Ray
Reference: MadeWithML - Distributed Data Processing
Purpose: Process terabyte-scale datasets efficiently using Ray
"""

import numpy as np
from pathlib import Path
import yaml
import logging
from typing import Callable, List
import time

try:
    import ray
    from ray import tune
    from ray.data import read_images, Dataset
    RAY_AVAILABLE = True
except ImportError:
    RAY_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning("Ray not installed. Install with: pip install ray")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DistributedDataProcessor:
    """
    Distributed data processing using Ray Data
    
    Handles:
    - Parallel image loading
    - Distributed preprocessing
    - Batch creation across multiple workers
    """
    
    def __init__(self, config_path: str = "configs/settings.yaml", num_workers: int = 4):
        if not RAY_AVAILABLE:
            raise ImportError("Ray is required. Install with: pip install ray")
        
        with open(config_path, 'r') as f:
            self.config = yaml.safe_load(f)
        
        self.num_workers = num_workers
        self.image_size = tuple(self.config['DATA']['image_size'])
        
        # Initialize Ray
        if not ray.is_initialized():
            ray.init(num_cpus=num_workers)
            logger.info(f"✅ Ray initialized with {num_workers} CPUs")
        
        # ImageNet normalization
        self.imagenet_mean = np.array([0.485, 0.456, 0.406])
        self.imagenet_std = np.array([0.229, 0.224, 0.225])
    
    def load_distributed(self, split: str = "train") -> "Dataset":
        """
        Load images distributed across workers
        
        Args:
            split: 'train', 'val', or 'test'
        
        Returns:
            Ray Dataset with images and labels
        """
        processed_dir = Path(self.config['DATA']['processed_dir'])
        split_dir = processed_dir / split
        
        logger.info(f"Loading {split} dataset in distributed manner...")
        
        # Read all images
        normal_dir = str(split_dir / "normal")
        pneumonia_dir = str(split_dir / "pneumonia")
        
        try:
            # Load normal images (label 0)
            normal_dataset = ray.data.read_images(normal_dir)
            normal_dataset = normal_dataset.add_column("label", lambda x: 0)
            
            # Load pneumonia images (label 1)
            pneumonia_dataset = ray.data.read_images(pneumonia_dir)
            pneumonia_dataset = pneumonia_dataset.add_column("label", lambda x: 1)
            
            # Combine datasets
            dataset = normal_dataset.union(pneumonia_dataset)
            
            logger.info(f"✅ Loaded {dataset.count()} images from {split} split")
            return dataset
        
        except Exception as e:
            logger.error(f"Error loading distributed dataset: {e}")
            raise
    
    def preprocess_batch(self, batch: dict) -> dict:
        """
        Preprocessing function for Ray batch processing
        
        Args:
            batch: Dictionary with 'image' and 'label' keys
        
        Returns:
            Processed batch
        """
        # Convert to numpy
        images = np.array(batch['image'])
        
        # Resize
        images = np.array([
            np.array(Image.fromarray(img).resize(self.image_size))
            for img in images
        ], dtype=np.float32)
        
        # Normalize
        images = images / 255.0
        images = (images - self.imagenet_mean) / self.imagenet_std
        
        batch['image'] = images
        return batch
    
    def process_distributed(self, split: str = "train", batch_size: int = 32) -> "Dataset":
        """
        Process dataset in distributed manner
        
        Args:
            split: Data split
            batch_size: Batch size for processing
        
        Returns:
            Processed Ray Dataset
        """
        logger.info(f"Processing {split} dataset in distributed manner...")
        
        # Load distributed
        dataset = self.load_distributed(split)
        
        # Map preprocessing across partitions
        from src.data.preprocessing import DataPreprocessor
        preprocessor = DataPreprocessor()
        
        def preprocess_fn(batch):
            """Process a batch of images"""
            images = []
            labels = []
            
            for row in batch:
                try:
                    # Resize
                    img = np.array(Image.fromarray(row['image']).resize(self.image_size), dtype=np.float32)
                    
                    # Normalize
                    img = img / 255.0
                    img = (img - self.imagenet_mean) / self.imagenet_std
                    
                    images.append(img)
                    labels.append(row['label'])
                except Exception as e:
                    logger.warning(f"Error in batch preprocessing: {e}")
            
            return {
                "image": np.array(images),
                "label": np.array(labels)
            }
        
        # Apply preprocessing in parallel
        processed = dataset.map_batches(preprocess_fn, batch_size=batch_size)
        logger.info(f"✅ Distributed preprocessing complete")
        
        return processed
    
    def create_train_val_test_splits(self, val_split: float = 0.15, test_split: float = 0.15):
        """
        Create train/val/test splits using distributed sampling
        """
        logger.info(f"Creating train/val/test splits (val={val_split}, test={test_split})...")
        
        splits = {}
        for split_name in ["train", "val", "test"]:
            dataset = self.load_distributed(split_name)
            processed = self.process_distributed(split_name)
            splits[split_name] = processed
        
        return splits
    
    def to_numpy_iter(self, dataset: "Dataset"):
        """
        Convert Ray Dataset to numpy iterator (memory efficient)
        
        Useful for feeding to model training
        """
        for batch in dataset.iter_batches(batch_size=32):
            yield batch['image'], batch['label']

# Single-threaded fallback (when Ray unavailable)
class LocalDataProcessor:
    """
    Local data processing without Ray
    For small datasets or development
    """
    
    def __init__(self, config_path: str = "configs/settings.yaml"):
        with open(config_path, 'r') as f:
            self.config = yaml.safe_load(f)
        
        from src.data.preprocessing import DataLoader
        self.loader = DataLoader(config_path=config_path)
    
    def load_all_splits(self):
        """Load all splits into memory"""
        splits = {}
        for split_name in ["train", "val", "test"]:
            try:
                X, y = self.loader.load_split(split_name)
                splits[split_name] = (X, y)
                logger.info(f"✅ {split_name}: {X.shape}")
            except Exception as e:
                logger.error(f"Error loading {split_name}: {e}")
        
        return splits

if __name__ == "__main__":
    logger.info("="*70)
    logger.info("DISTRIBUTED DATA PROCESSING WITH RAY")
    logger.info("="*70 + "\n")
    
    try:
        # Use distributed processor if Ray available
        processor = DistributedDataProcessor(num_workers=4)
        train_dataset = processor.load_distributed("train")
        logger.info(f"Train dataset size: {train_dataset.count()}")
        
    except ImportError:
        logger.warning("Ray not available, using local processing...")
        processor = LocalDataProcessor()
        splits = processor.load_all_splits()
        
        for split_name, (X, y) in splits.items():
            logger.info(f"{split_name}: images={X.shape}, labels={y.shape}")
    
    logger.info("\n✅ Data loading complete!")
