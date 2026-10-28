import os
import cv2
import numpy as np
from PIL import Image
import logging
from typing import Tuple, Dict, Any, Optional

from app.tryon.tryon_provider import TryOnProvider
from app.pose.pose_detector import pose_detector
from app.clothing.clothing_processor import clothing_processor
from app.warping.perspective_warp import perspective_warp
from app.warping.mesh_warp import mesh_warp
from app.occlusion.occlusion_mask import occlusion_mask
from app.blending.image_blender import image_blender
from app.tryon.diagnostic_logger import diagnostic_logger

logger = logging.getLogger("geometry_tryon_provider")

class GeometryTryOnProvider(TryOnProvider):
    def generate(
        self,
        person_pil: Image.Image,
        clothing_pil: Image.Image,
        clothing_category: str = "TOP"
    ) -> Tuple[bool, Optional[Image.Image], Optional[Dict[str, Any]]]:

        category_upper = (clothing_category or "TOP").upper()
        person_rgb = np.array(person_pil.convert("RGB"))
        target_h, target_w = person_rgb.shape[:2]

        is_diagnostic = os.getenv("TRYON_DIAGNOSTIC", "true").lower() == "true" or os.getenv("TRYON_DEBUG", "true").lower() == "true"
        if is_diagnostic:
            diagnostic_logger.log_input(person_pil, clothing_pil)

        # 1. Pose Detection
        landmarks = pose_detector.detect(person_rgb)

        if is_diagnostic and landmarks.is_valid:
            diagnostic_logger.log_pose(person_rgb, landmarks)

        if not landmarks.is_valid:
            logger.warning("[GeometryTryOnProvider] Pose landmarks invalid.")
            return False, None, {
                "code": "BODY_LANDMARKS_UNRELIABLE",
                "message": landmarks.error_message or "Unable to detect body position clearly."
            }

        # Validate mandatory landmarks for requested category
        is_valid_cat, cat_err = landmarks.validate_for_category(category_upper)
        if not is_valid_cat:
            logger.warning(f"[GeometryTryOnProvider] Category validation failed: {cat_err}")
            return False, None, {
                "code": "BODY_LANDMARKS_UNRELIABLE",
                "message": cat_err or "Low landmark visibility for requested clothing category."
            }

        # 2. Clothing Processing & Background Removal
        clothing_rgba, c_mask, c_bbox = clothing_processor.process(clothing_pil)
        c_w, c_h = clothing_rgba.size

        if is_diagnostic:
            diagnostic_logger.log_clothing_mask(clothing_rgba, c_mask, c_bbox)

        if c_w < 10 or c_h < 10 or np.sum(c_mask) == 0:
            logger.error("[GeometryTryOnProvider] Clothing segmentation failed.")
            return False, None, {
                "code": "CLOTHING_SEGMENTATION_FAILED",
                "message": "Failed to segment clothing from image background."
            }

        # Identify image-left vs image-right landmarks
        # (In front-facing photos, right_shoulder/right_hip is on image LEFT (smaller X),
        #  while left_shoulder/left_hip is on image RIGHT (larger X))
        l_sh = landmarks.left_shoulder
        r_sh = landmarks.right_shoulder
        l_hip = landmarks.left_hip
        r_hip = landmarks.right_hip
        l_kn = landmarks.left_knee
        r_kn = landmarks.right_knee
        l_ank = landmarks.left_ankle
        r_ank = landmarks.right_ankle

        # Image-left = min X, Image-right = max X
        img_left_sh = r_sh if r_sh[0] <= l_sh[0] else l_sh
        img_right_sh = l_sh if l_sh[0] >= r_sh[0] else r_sh

        img_left_hip = r_hip if r_hip[0] <= l_hip[0] else l_hip
        img_right_hip = l_hip if l_hip[0] >= r_hip[0] else r_hip

        img_left_kn = r_kn if r_kn[0] <= l_kn[0] else l_kn
        img_right_kn = l_kn if l_kn[0] >= r_kn[0] else r_kn

        img_left_ank = r_ank if r_ank[0] <= l_ank[0] else l_ank
        img_right_ank = l_ank if l_ank[0] >= r_ank[0] else r_ank

        # 3. Target Geometry Calculation & Warping
        try:
            if category_upper in ["BOTTOM", "PANTS", "SHORTS", "SKIRT"]:
                hip_width = np.linalg.norm(np.array(img_left_hip) - np.array(img_right_hip))
                padding = int(hip_width * 0.12)

                waist_image_left = (img_left_hip[0] - padding, img_left_hip[1] - int(padding * 0.4))
                waist_image_right = (img_right_hip[0] + padding, img_right_hip[1] - int(padding * 0.4))

                knee_image_left = (img_left_kn[0] - padding, img_left_kn[1])
                knee_image_right = (img_right_kn[0] + padding, img_right_kn[1])

                if category_upper == "SHORTS":
                    ankle_image_left = (img_left_kn[0] - padding, int(img_left_kn[1] + (img_left_kn[1] - img_left_hip[1]) * 0.5))
                    ankle_image_right = (img_right_kn[0] + padding, int(img_right_kn[1] + (img_right_kn[1] - img_right_hip[1]) * 0.5))
                else:
                    ankle_image_left = (img_left_ank[0] - padding, img_left_ank[1])
                    ankle_image_right = (img_right_ank[0] + padding, img_right_ank[1])

                # Dual leg mesh warping
                warped_clothing, _ = mesh_warp.warp_dual_leg(
                    clothing_rgba, (target_w, target_h),
                    waist_image_left, waist_image_right,
                    knee_image_left, knee_image_right,
                    ankle_image_left, ankle_image_right
                )

                src_quad = [(0, 0), (c_w, 0), (c_w, c_h), (0, c_h)]
                dst_quad = [waist_image_left, waist_image_right, ankle_image_right, ankle_image_left]

            elif category_upper in ["DRESS", "FULL"]:
                sh_width = np.linalg.norm(np.array(img_left_sh) - np.array(img_right_sh))
                pad_x = int(sh_width * 0.15)
                pad_y = int(sh_width * 0.15)

                dst_quad = [
                    (img_left_sh[0] - pad_x, img_left_sh[1] - pad_y),
                    (img_right_sh[0] + pad_x, img_right_sh[1] - pad_y),
                    (img_right_kn[0] + pad_x, img_right_kn[1]),
                    (img_left_kn[0] - pad_x, img_left_kn[1])
                ]
                src_quad = [(0, 0), (c_w, 0), (c_w, c_h), (0, c_h)]

                warped_clothing, _ = perspective_warp.warp_quad(
                    clothing_rgba, src_quad, dst_quad, (target_w, target_h)
                )

            else:
                # TOP / SHIRT / JACKET
                sh_width = np.linalg.norm(np.array(img_left_sh) - np.array(img_right_sh))
                pad_x = int(sh_width * 0.15)
                pad_y = int(sh_width * 0.15)

                dst_quad = [
                    (img_left_sh[0] - pad_x, img_left_sh[1] - pad_y),
                    (img_right_sh[0] + pad_x, img_right_sh[1] - pad_y),
                    (img_right_hip[0] + pad_x, img_right_hip[1] + int(pad_y * 0.5)),
                    (img_left_hip[0] - pad_x, img_left_hip[1] + int(pad_y * 0.5))
                ]
                src_quad = [(0, 0), (c_w, 0), (c_w, c_h), (0, c_h)]

                warped_clothing, _ = perspective_warp.warp_quad(
                    clothing_rgba, src_quad, dst_quad, (target_w, target_h)
                )

        except Exception as e:
            logger.error(f"[GeometryTryOnProvider] Warping exception: {e}")
            return False, None, {
                "code": "TRYON_FAILED",
                "message": f"Clothing geometry warping failed: {str(e)}"
            }

        if is_diagnostic:
            diagnostic_logger.log_correspondence(clothing_rgba, person_rgb, src_quad, dst_quad)
            diagnostic_logger.log_warp(warped_clothing, person_rgb)

        # 4. Occlusion Masking & Alpha Blending
        hands_occ_mask = occlusion_mask.generate_hands_mask((target_w, target_h), landmarks)
        if is_diagnostic:
            diagnostic_logger.log_occlusion(hands_occ_mask)

        result_pil = image_blender.compose(person_pil, warped_clothing, hands_occ_mask)

        # 5. Diagnostic Final logging & Metrics calculation
        if is_diagnostic:
            diagnostic_logger.log_final(person_pil, result_pil)

            # Alignment metrics
            waist_center_target = np.mean([dst_quad[0], dst_quad[1]], axis=0)
            hip_center_person = np.mean([img_left_hip, img_right_hip], axis=0)
            hip_err = np.linalg.norm(waist_center_target - hip_center_person) / max(target_h, 1)

            l_leg_err = np.linalg.norm(np.array(dst_quad[3]) - np.array(img_left_ank)) / max(target_h, 1)
            r_leg_err = np.linalg.norm(np.array(dst_quad[2]) - np.array(img_right_ank)) / max(target_h, 1)

            diagnostic_logger.log_alignment_metrics(hip_err, l_leg_err, r_leg_err)

        return True, result_pil, None

geometry_tryon_provider = GeometryTryOnProvider()

