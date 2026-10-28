import cv2
import numpy as np
from PIL import Image
import logging
from typing import Tuple, Optional

logger = logging.getLogger("clothing_segmenter")

class ClothingSegmenter:
    def extract_transparent_clothing(
        self, clothing_pil: Image.Image
    ) -> Tuple[Image.Image, np.ndarray, Tuple[int, int, int, int]]:
        """
        Extracts clothing from image:
        1. Identifies background and removes it.
        2. Creates transparent RGBA PIL Image.
        3. Returns (transparent_rgba_img, binary_mask_np, bounding_box_tuple).
        """
        # Ensure RGBA
        rgba_pil = clothing_pil.convert("RGBA")
        img_np = np.array(rgba_pil)
        height, width = img_np.shape[:2]

        alpha_channel = img_np[:, :, 3]

        # Case 1: Image already has non-trivial transparent background (alpha channel)
        if np.min(alpha_channel) < 50 and np.mean(alpha_channel < 50) > 0.05:
            logger.info("[ClothingSegmenter] Detected pre-existing alpha channel transparency.")
            mask = np.where(alpha_channel > 50, 255, 0).astype(np.uint8)
        else:
            # Case 2: Solid or semi-solid background (White/Light gray/Green)
            logger.info("[ClothingSegmenter] Isolating clothing from solid background...")
            rgb = img_np[:, :, :3]
            
            # Detect corner colors (background candidates)
            corners = [
                rgb[0, 0], rgb[0, width - 1],
                rgb[height - 1, 0], rgb[height - 1, width - 1]
            ]
            bg_color = np.mean(corners, axis=0)

            # Color distance from bg
            diff = np.linalg.norm(rgb.astype(np.float32) - bg_color, axis=2)
            mask = np.where(diff > 30, 255, 0).astype(np.uint8)

            # Refine mask with Morphological operations & contours
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
            mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
            mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)

            # Keep largest connected contour
            contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            if contours:
                c_max = max(contours, key=cv2.contourArea)
                refined_mask = np.zeros_like(mask)
                cv2.drawContours(refined_mask, [c_max], -1, 255, thickness=cv2.FILLED)
                mask = refined_mask
            else:
                mask = np.full((height, width), 255, dtype=np.uint8)

        # Calculate Bounding Box
        coords = cv2.findNonZero(mask)
        if coords is not None and len(coords) > 0:
            x, y, w, h = cv2.boundingRect(coords)
            bounding_box = (x, y, x + w, y + h)
        else:
            mask = np.full((height, width), 255, dtype=np.uint8)
            bounding_box = (0, 0, width, height)


        # Apply mask to alpha channel
        img_np[:, :, 3] = mask
        transparent_rgba = Image.fromarray(img_np, mode="RGBA")

        return transparent_rgba, mask, bounding_box

clothing_segmenter = ClothingSegmenter()
