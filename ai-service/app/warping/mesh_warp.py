import cv2
import numpy as np
from PIL import Image
from typing import Tuple, List

class MeshWarp:
    @staticmethod
    def warp_dual_leg(
        clothing_pil: Image.Image,
        target_size: Tuple[int, int],
        waist_left: Tuple[int, int],
        waist_right: Tuple[int, int],
        knee_left: Tuple[int, int],
        knee_right: Tuple[int, int],
        ankle_left: Tuple[int, int],
        ankle_right: Tuple[int, int]
    ) -> Tuple[Image.Image, np.ndarray]:
        """
        Dual-mesh leg warping for pants/shorts:
        Splits clothing into upper waist-knee mesh and lower knee-ankle mesh.
        """
        img_np = np.array(clothing_pil.convert("RGBA"))
        h_c, w_c = img_np.shape[:2]
        target_w, target_h = target_size

        # Create output canvas
        output_rgba = np.zeros((target_h, target_w, 4), dtype=np.uint8)

        # Upper leg mesh: (0, 0) -> (w_c, h_c/2) mapped to (waist_left, waist_right, knee_right, knee_left)
        src_upper = np.float32([[0, 0], [w_c, 0], [w_c, h_c / 2], [0, h_c / 2]])
        dst_upper = np.float32([waist_left, waist_right, knee_right, knee_left])

        M_upper = cv2.getPerspectiveTransform(src_upper, dst_upper)
        warped_upper = cv2.warpPerspective(
            img_np, M_upper, (target_w, target_h),
            flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0)
        )

        # Lower leg mesh: (0, h_c/2) -> (w_c, h_c) mapped to (knee_left, knee_right, ankle_right, ankle_left)
        src_lower = np.float32([[0, h_c / 2], [w_c, h_c / 2], [w_c, h_c], [0, h_c]])
        dst_lower = np.float32([knee_left, knee_right, ankle_right, ankle_left])

        M_lower = cv2.getPerspectiveTransform(src_lower, dst_lower)
        warped_lower = cv2.warpPerspective(
            img_np, M_lower, (target_w, target_h),
            flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0)
        )

        # Combine meshes (alpha compositing)
        alpha_u = warped_upper[:, :, 3].astype(float) / 255.0
        alpha_l = warped_lower[:, :, 3].astype(float) / 255.0

        for c in range(3):
            output_rgba[:, :, c] = (
                warped_upper[:, :, c] * alpha_u + warped_lower[:, :, c] * (1.0 - alpha_u) * alpha_l
            ).astype(np.uint8)

        output_rgba[:, :, 3] = np.maximum(warped_upper[:, :, 3], warped_lower[:, :, 3])

        alpha_mask = output_rgba[:, :, 3]
        result_pil = Image.fromarray(output_rgba, mode="RGBA")

        return result_pil, alpha_mask

mesh_warp = MeshWarp()
