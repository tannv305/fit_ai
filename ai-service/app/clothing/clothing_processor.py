from PIL import Image
import numpy as np
from typing import Tuple
from app.segmentation.clothing_segmenter import clothing_segmenter

class ClothingProcessor:
    @staticmethod
    def process(clothing_pil: Image.Image) -> Tuple[Image.Image, np.ndarray, Tuple[int, int, int, int]]:
        """
        Processes clothing image:
        - Removes background
        - Returns cropped transparent RGBA image, mask, bounding box
        """
        transparent_rgba, mask, bbox = clothing_segmenter.extract_transparent_clothing(clothing_pil)
        
        # Crop to bounding box
        x1, y1, x2, y2 = bbox
        if (x2 - x1) > 10 and (y2 - y1) > 10:
            cropped_rgba = transparent_rgba.crop((x1, y1, x2, y2))
            cropped_mask = mask[y1:y2, x1:x2]
        else:
            cropped_rgba = transparent_rgba
            cropped_mask = mask

        return cropped_rgba, cropped_mask, bbox

clothing_processor = ClothingProcessor()
