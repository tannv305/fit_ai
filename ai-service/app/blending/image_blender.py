import cv2
import numpy as np
from PIL import Image

class ImageBlender:
    @staticmethod
    def compose(
        person_pil: Image.Image,
        warped_clothing_pil: Image.Image,
        occlusion_mask_np: np.ndarray = None
    ) -> Image.Image:
        """
        Alpha composites warped clothing onto person image with edge feathering and occlusion handling.
        """
        person_rgba = np.array(person_pil.convert("RGBA"), dtype=np.uint8)
        clothing_rgba = np.array(warped_clothing_pil.convert("RGBA"), dtype=np.uint8)

        # Get clothing alpha and apply Gaussian feathering to prevent hard rectangular boundaries
        clothing_alpha = clothing_rgba[:, :, 3].copy()
        
        # Feather mask edges
        feathered_alpha = cv2.GaussianBlur(clothing_alpha, (5, 5), 0)

        # Subtract occlusion (hands/arms in front)
        if occlusion_mask_np is not None:
            feathered_alpha = np.clip(feathered_alpha.astype(int) - occlusion_mask_np.astype(int), 0, 255).astype(np.uint8)

        alpha_factor = (feathered_alpha.astype(float) / 255.0)[:, :, np.newaxis]

        output_rgba = person_rgba.copy()
        output_rgba[:, :, :3] = (
            clothing_rgba[:, :, :3] * alpha_factor + person_rgba[:, :, :3] * (1.0 - alpha_factor)
        ).astype(np.uint8)

        return Image.fromarray(output_rgba, mode="RGBA").convert("RGB")

image_blender = ImageBlender()
