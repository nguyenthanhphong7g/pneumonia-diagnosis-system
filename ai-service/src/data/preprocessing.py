"""
Data Preprocessing Module
Reference: MadeWithML - Data Preprocessing Phase
Purpose: Normalize, augment, and prepare data for model training
"""

import numpy as np
from PIL import Image
import yaml
import logging
from pathlib import Path
from typing import Tuple, List
import cv2

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DataPreprocessor:
    """
    Image preprocessing pipeline for Pneumonia Detection
    Handles:
    - Image resizing
    - Normalization (ImageNet standard)
    - Data augmentation (rotation, zoom, flip)
    """
    
    def __init__(self, config_path: str = "configs/settings.yaml"):
        with open(config_path, 'r') as f:
            config = yaml.safe_load(f)
        
        self.image_size = tuple(config['DATA']['image_size'])  # (224, 224)
        self.augmentation_config = config['DATA']['augmentation']
        
        # ImageNet normalization parameters
        self.imagenet_mean = np.array([0.485, 0.456, 0.406])
        self.imagenet_std = np.array([0.229, 0.224, 0.225])
        
        logger.info(f"Preprocessor initialized with image size: {self.image_size}")
    
    def load_and_resize(self, image_path: str) -> np.ndarray:
        """
        Load image and resize to target size
        
        Args:
            image_path: Path to image file
        
        Returns:
            Numpy array (H, W, 3) - RGB
        """
        try:
            # Load image
            img = Image.open(image_path)
            
            # Convert to RGB if grayscale/RGBA
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Resize
            img = img.resize(self.image_size, Image.LANCZOS)
            
            # Convert to numpy (values 0-255)
            img_array = np.array(img, dtype=np.float32)
            
            return img_array
        
        except Exception as e:
            logger.error(f"Error loading {image_path}: {e}")
            raise
    
    def normalize(self, img_array: np.ndarray) -> np.ndarray:
        """
        Apply ImageNet normalization
        
        Formula: (x - mean) / std
        
        Args:
            img_array: Image array (H, W, 3) with values 0-255
        
        Returns:
            Normalized image with values ~[-2, 2]
        """
        # Normalize to 0-1
        img_array = img_array / 255.0
        
        # Apply channel-wise normalization
        img_array = (img_array - self.imagenet_mean) / self.imagenet_std
        
        return img_array
    
    def augment(self, img_array: np.ndarray) -> np.ndarray:
        """
        Apply data augmentation to increase training diversity
        
        Augmentations:
        - Random rotation (±20°)
        - Random zoom (0.8x to 1.2x)
        - Random horizontal flip (50%)
        
        Args:
            img_array: Image array (H, W, 3)
        
        Returns:
            Augmented image array
        """
        if not self.augmentation_config['enabled']:
            return img_array
        
        img = Image.fromarray((img_array * 255).astype(np.uint8))
        
        # Random rotation
        angle = np.random.uniform(
            -self.augmentation_config['rotation_range'],
            self.augmentation_config['rotation_range']
        )
        img = img.rotate(angle, expand=False, fillcolor='black')
        
        # Random zoom (crop and resize)
        zoom = np.random.uniform(
            1 - self.augmentation_config['zoom_range'],
            1 + self.augmentation_config['zoom_range']
        )
        h, w = self.image_size
        crop_w = int(w / zoom)
        crop_h = int(h / zoom)
        left = (w - crop_w) // 2
        top = (h - crop_h) // 2
        img = img.crop((left, top, left + crop_w, top + crop_h))
        img = img.resize(self.image_size, Image.LANCZOS)
        
        # Random horizontal flip
        if self.augmentation_config['horizontal_flip'] and np.random.rand() > 0.5:
            img = img.transpose(Image.FLIP_LEFT_RIGHT)
        
        return np.array(img, dtype=np.float32)
    
    def preprocess(self, image_path: str, augment: bool = False) -> np.ndarray:
        """
        Complete preprocessing pipeline
        
        Args:
            image_path: Path to image
            augment: Whether to apply augmentation
        
        Returns:
            Preprocessed image array (H, W, 3)
        """
        # Load and resize
        img = self.load_and_resize(image_path)
        
        # Augment (only for training data)
        if augment:
            img = self.augment(img)
        
        # Normalize
        img = self.normalize(img)
        
        return img

class DataLoader:
    """
    Load preprocessed data in batches
    """
    
    def __init__(self, processed_dir: str = "dataset/processed", config_path: str = "configs/settings.yaml"):
        self.processed_dir = Path(processed_dir)
        self.preprocessor = DataPreprocessor(config_path)
        
        with open(config_path, 'r') as f:
            self.config = yaml.safe_load(f)
    
    def load_split(self, split: str = "train", augment: bool = False) -> Tuple[np.ndarray, np.ndarray]:
        """
        Load entire split into memory
        
        Args:
            split: 'train', 'val', or 'test'
            augment: Apply augmentation
        
        Returns:
            (images, labels) where labels are 0=normal, 1=pneumonia
        """
        split_dir = self.processed_dir / split
        images, labels = [], []
        
        for class_idx, class_name in enumerate(["normal", "pneumonia"]):
            class_dir = split_dir / class_name
            image_paths = list(class_dir.glob("*.jpg"))
            
            logger.info(f"Loading {split}/{class_name}: {len(image_paths)} images")
            
            for img_path in image_paths:
                try:
                    img = self.preprocessor.preprocess(str(img_path), augment=augment and split == "train")
                    images.append(img)
                    labels.append(class_idx)
                except Exception as e:
                    logger.warning(f"Skipping {img_path}: {e}")
        
        return np.array(images), np.array(labels)
    
    def load_batch(self, split: str = "train", batch_size: int = 32, augment: bool = False):
        """
        Generator for loading data in batches (memory efficient)
        """
        split_dir = self.processed_dir / split
        
        # Collect all image paths with labels
        image_list = []
        for class_idx, class_name in enumerate(["normal", "pneumonia"]):
            class_dir = split_dir / class_name
            for img_path in class_dir.glob("*.jpg"):
                image_list.append((img_path, class_idx))
        
        # Shuffle
        np.random.shuffle(image_list)
        
        # Yield batches
        for i in range(0, len(image_list), batch_size):
            batch_paths = image_list[i:i+batch_size]
            
            images, labels = [], []
            for img_path, label in batch_paths:
                try:
                    img = self.preprocessor.preprocess(str(img_path), augment=augment and split == "train")
                    images.append(img)
                    labels.append(label)
                except Exception as e:
                    logger.warning(f"Skipping {img_path}: {e}")
            
            if images:
                yield np.array(images), np.array(labels)

if __name__ == "__main__":
    # Example usage
    logger.info("="*70)
    logger.info("DATA PREPROCESSING PIPELINE")
    logger.info("="*70 + "\n")
    
    # Test single image preprocessing
    preprocessor = DataPreprocessor()
    
    # Example image path (adjust to your dataset)
    example_image = "dataset/processed/train/normal/normal_00001.jpg"
    if Path(example_image).exists():
        img = preprocessor.preprocess(example_image, augment=False)
        logger.info(f"Preprocessed image shape: {img.shape}")
        logger.info(f"Image values range: [{img.min():.2f}, {img.max():.2f}]")
        logger.info(f"✅ Preprocessing works!")
    
    # Load full splits
    loader = DataLoader()
    try:
        logger.info("\nLoading training data...")
        X_train, y_train = loader.load_split("train", augment=True)
        logger.info(f"✅ Training set: {X_train.shape}, Labels: {y_train.shape}")
        logger.info(f"   Normal: {np.sum(y_train==0)}, Pneumonia: {np.sum(y_train==1)}")
    except Exception as e:
        logger.error(f"Cannot load training data: {e}")
