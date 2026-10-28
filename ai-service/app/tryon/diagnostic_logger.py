import os
import json
import cv2
import numpy as np
from PIL import Image
import logging
from typing import Dict, Any, List, Tuple
from app.pose.landmark_extractor import BodyLandmarks

logger = logging.getLogger("diagnostic_logger")

class DiagnosticLogger:
    def __init__(self, base_dir: str = "diagnostics"):
        self.base_dir = base_dir
        self.images_dir = os.path.join(base_dir, "images")
        self.metrics_dir = os.path.join(base_dir, "metrics")
        self._ensure_dirs()

    def _ensure_dirs(self):
        subdirs = [
            "01_input", "02_pose", "03_person_mask", "04_clothing",
            "05_clothing_mask", "06_correspondence", "07_geometry",
            "08_warp", "09_occlusion", "10_blending", "11_final"
        ]
        for sub in subdirs:
            os.makedirs(os.path.join(self.images_dir, sub), exist_ok=True)
        os.makedirs(self.metrics_dir, exist_ok=True)

    def log_input(self, person_pil: Image.Image, clothing_pil: Image.Image):
        p_w, p_h = person_pil.size
        c_w, c_h = clothing_pil.size
        
        person_pil.convert("RGB").save(os.path.join(self.images_dir, "01_input", "01_person.jpg"))
        clothing_pil.convert("RGB").save(os.path.join(self.images_dir, "01_input", "02_clothing.jpg"))

        metrics = {
            "person": {"width": p_w, "height": p_h, "aspect_ratio": round(p_w / max(p_h, 1), 4)},
            "clothing": {"width": c_w, "height": c_h, "aspect_ratio": round(c_w / max(c_h, 1), 4)}
        }
        with open(os.path.join(self.metrics_dir, "input.json"), "w", encoding="utf-8") as f:
            json.dump(metrics, f, indent=2)


    def log_pose(self, person_np: np.ndarray, landmarks: BodyLandmarks):
        img_out = person_np.copy()
        lm_data = {}
        
        for name in [
            "left_shoulder", "right_shoulder", "left_elbow", "right_elbow",
            "left_wrist", "right_wrist", "left_hip", "right_hip",
            "left_knee", "right_knee", "left_ankle", "right_ankle"
        ]:
            pt = getattr(landmarks, name, (0, 0))
            vis = landmarks.visibility.get(name, 0.0)
            lm_data[name] = {"x": pt[0], "y": pt[1], "visibility": round(vis, 4)}
            
            if pt != (0, 0):
                color = (0, 255, 0) if vis >= 0.4 else (0, 0, 255)
                cv2.circle(img_out, pt, 6, color, -1)
                cv2.putText(img_out, name[:6], (pt[0] + 5, pt[1] - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)

        cv2.imwrite(os.path.join(self.images_dir, "02_pose", "pose_landmarks.jpg"), cv2.cvtColor(img_out, cv2.COLOR_RGB2BGR))
        with open(os.path.join(self.metrics_dir, "pose.json"), "w", encoding="utf-8") as f:
            json.dump(lm_data, f, indent=2)

    def log_person_mask(self, person_np: np.ndarray, person_mask: np.ndarray):
        cv2.imwrite(os.path.join(self.images_dir, "03_person_mask", "person_mask.png"), person_mask)
        
        # Mask overlay
        overlay = person_np.copy()
        overlay[person_mask > 0] = (overlay[person_mask > 0] * 0.7 + np.array([0, 255, 0]) * 0.3).astype(np.uint8)
        cv2.imwrite(os.path.join(self.images_dir, "03_person_mask", "person_mask_overlay.jpg"), cv2.cvtColor(overlay, cv2.COLOR_RGB2BGR))

        area = int(np.sum(person_mask > 0))
        total = person_mask.shape[0] * person_mask.shape[1]
        with open(os.path.join(self.metrics_dir, "person_mask.json"), "w", encoding="utf-8") as f:
            json.dump({"mask_area_pixels": area, "total_pixels": total, "coverage_ratio": round(area / max(total, 1), 4)}, f, indent=2)

    def log_clothing_mask(self, clothing_rgba: Image.Image, mask: np.ndarray, bbox: Tuple[int, int, int, int]):
        clothing_rgba.save(os.path.join(self.images_dir, "04_clothing", "clothing_rgba.png"))
        cv2.imwrite(os.path.join(self.images_dir, "05_clothing_mask", "clothing_mask.png"), mask)
        
        c_np = np.array(clothing_rgba.convert("RGB"))
        cv2.rectangle(c_np, (bbox[0], bbox[1]), (bbox[2], bbox[3]), (255, 0, 0), 2)
        cv2.imwrite(os.path.join(self.images_dir, "05_clothing_mask", "clothing_bbox.jpg"), cv2.cvtColor(c_np, cv2.COLOR_RGB2BGR))

        with open(os.path.join(self.metrics_dir, "clothing_mask.json"), "w", encoding="utf-8") as f:
            json.dump({"bbox": bbox, "bbox_width": bbox[2] - bbox[0], "bbox_height": bbox[3] - bbox[1]}, f, indent=2)

    def log_correspondence(
        self,
        clothing_pil: Image.Image,
        person_np: np.ndarray,
        src_quad: List[Tuple[float, float]],
        dst_quad: List[Tuple[float, float]]
    ):
        mapping = {
            "source_quad": src_quad,
            "target_quad": dst_quad
        }
        with open(os.path.join(self.metrics_dir, "mapping.json"), "w", encoding="utf-8") as f:
            json.dump(mapping, f, indent=2)

        # Draw target quad on person
        target_img = cv2.cvtColor(person_np.copy(), cv2.COLOR_RGB2BGR)
        pts = np.int32(dst_quad).reshape((-1, 1, 2))
        cv2.polylines(target_img, [pts], isClosed=True, color=(0, 255, 255), thickness=2)
        for idx, (x, y) in enumerate(dst_quad):
            cv2.circle(target_img, (int(x), int(y)), 6, (0, 0, 255), -1)
            cv2.putText(target_img, f"P{idx}", (int(x) + 5, int(y) - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

        cv2.imwrite(os.path.join(self.images_dir, "06_correspondence", "source_target.jpg"), target_img)

    def log_warp(self, warped_rgba_pil: Image.Image, person_np: np.ndarray):
        warped_rgba_pil.save(os.path.join(self.images_dir, "08_warp", "01_warped_rgba.png"))
        
        # Warp vs Body overlay
        w_np = np.array(warped_rgba_pil)
        overlay = person_np.copy()
        alpha = (w_np[:, :, 3].astype(float) / 255.0)[:, :, np.newaxis]
        overlay = (w_np[:, :, :3] * alpha + overlay * (1.0 - alpha)).astype(np.uint8)
        
        cv2.imwrite(os.path.join(self.images_dir, "08_warp", "02_warp_vs_body.jpg"), cv2.cvtColor(overlay, cv2.COLOR_RGB2BGR))

    def log_occlusion(self, occlusion_mask_np: np.ndarray):
        cv2.imwrite(os.path.join(self.images_dir, "09_occlusion", "occlusion_mask.png"), occlusion_mask_np)

    def log_final(self, person_pil: Image.Image, final_pil: Image.Image):
        final_pil.save(os.path.join(self.images_dir, "10_blending", "after_blend.png"))
        
        # Create Side-by-Side comparison
        p_np = np.array(person_pil.convert("RGB"))
        f_np = np.array(final_pil.convert("RGB"))
        side_by_side = np.hstack([p_np, f_np])
        
        cv2.imwrite(os.path.join(self.images_dir, "11_final", "final_side_by_side.jpg"), cv2.cvtColor(side_by_side, cv2.COLOR_RGB2BGR))

    def log_alignment_metrics(self, hip_error: float, left_leg_error: float, right_leg_error: float):
        metrics = {
            "hip_alignment_error": round(hip_error, 4),
            "left_leg_alignment_error": round(left_leg_error, 4),
            "right_leg_alignment_error": round(right_leg_error, 4)
        }
        with open(os.path.join(self.metrics_dir, "alignment.json"), "w", encoding="utf-8") as f:
            json.dump(metrics, f, indent=2)

diagnostic_logger = DiagnosticLogger()
