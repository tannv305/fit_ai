import cv2
import numpy as np
from PIL import Image
from typing import Tuple, List

class PerspectiveWarp:
    @staticmethod
    def warp_quad(
        source_rgba_pil: Image.Image,
        src_quad: List[Tuple[float, float]],
        dst_quad: List[Tuple[float, float]],
        target_size: Tuple[int, int]
    ) -> Tuple[Image.Image, np.ndarray]:
        """
        Warps source RGBA clothing image from src_quad -> dst_quad onto an image of target_size.
        src_quad: [top_left, top_right, bottom_right, bottom_left]
        dst_quad: [top_left, top_right, bottom_right, bottom_left]
        Returns (warped_rgba_pil, warped_alpha_mask_np)
        """
        src_pts = np.float32(src_quad)
        dst_pts = np.float32(dst_quad)

        # Calculate perspective transformation matrix
        M = cv2.getPerspectiveTransform(src_pts, dst_pts)

        target_w, target_h = target_size
        img_np = np.array(source_rgba_pil)

        # Warp RGBA channels using bilinear interpolation
        warped_rgba = cv2.warpPerspective(
            img_np,
            M,
            (target_w, target_h),
            flags=cv2.INTER_LINEAR,
            borderMode=cv2.BORDER_CONSTANT,
            borderValue=(0, 0, 0, 0)
        )

        warped_alpha = warped_rgba[:, :, 3]
        warped_pil = Image.fromarray(warped_rgba, mode="RGBA")

        return warped_pil, warped_alpha

perspective_warp = PerspectiveWarp()
