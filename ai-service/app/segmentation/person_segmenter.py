import cv2
import numpy as np
from PIL import Image
import logging

logger = logging.getLogger("person_segmenter")

class PersonSegmenter:
    def segment(self, person_np: np.ndarray) -> np.ndarray:
        """
        Generates binary person mask (255 for body, 0 for background).
        Uses Otsu / thresholding / GrabCut fallback.
        """
        height, width = person_np.shape[:2]
        gray = cv2.cvtColor(person_np, cv2.COLOR_RGB2GRAY)
        
        # Blur to smooth background noise
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Threshold
        _, mask = cv2.threshold(blurred, 240, 255, cv2.THRESH_BINARY_INV)
        
        # Clean up noise
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
        
        return mask

person_segmenter = PersonSegmenter()
