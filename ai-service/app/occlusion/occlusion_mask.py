import cv2
import numpy as np
from typing import Tuple
from app.pose.landmark_extractor import BodyLandmarks

class OcclusionMask:
    @staticmethod
    def generate_hands_mask(
        target_size: Tuple[int, int],
        landmarks: BodyLandmarks
    ) -> np.ndarray:
        """
        Creates binary mask for hands/wrists/arms to prevent clothing from drawing over hands.
        Returns uint8 mask (255 for foreground hands/arms, 0 elsewhere).
        """
        target_w, target_h = target_size
        hands_mask = np.zeros((target_h, target_w), dtype=np.uint8)

        if not landmarks.is_valid:
            return hands_mask

        # Draw left and right hand/wrist circles if visible
        for wrist_name in ["left_wrist", "right_wrist", "left_elbow", "right_elbow"]:
            pt = getattr(landmarks, wrist_name, (0, 0))
            vis = landmarks.visibility.get(wrist_name, 0.0)
            if vis > 0.4 and pt != (0, 0):
                # Radius scaled to image height
                radius = int(target_h * 0.04)
                cv2.circle(hands_mask, pt, radius, 255, thickness=-1)

        # Smooth edges
        hands_mask = cv2.GaussianBlur(hands_mask, (9, 9), 0)
        return hands_mask

occlusion_mask = OcclusionMask()
