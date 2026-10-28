import pytest
import numpy as np
from PIL import Image

from app.pose.landmark_extractor import BodyLandmarks, MIN_VISIBILITY
from app.pose.pose_detector import pose_detector
from app.segmentation.clothing_segmenter import clothing_segmenter
from app.warping.perspective_warp import perspective_warp
from app.warping.mesh_warp import mesh_warp
from app.occlusion.occlusion_mask import occlusion_mask
from app.blending.image_blender import image_blender
from app.tryon.geometry_tryon_provider import geometry_tryon_provider

def test_landmark_extractor_visibility_validation():
    landmarks = BodyLandmarks(
        left_shoulder=(100, 100), right_shoulder=(200, 100),
        left_hip=(110, 300), right_hip=(190, 300),
        visibility={
            "left_shoulder": 0.9, "right_shoulder": 0.85,
            "left_hip": 0.8, "right_hip": 0.75
        }
    )
    valid, err = landmarks.validate_for_category("TOP")
    assert valid is True
    assert err is None

    unreliable_landmarks = BodyLandmarks(
        left_shoulder=(100, 100), right_shoulder=(200, 100),
        visibility={"left_shoulder": 0.2, "right_shoulder": 0.9}
    )
    valid, err = unreliable_landmarks.validate_for_category("TOP")
    assert valid is False
    assert "low visibility" in err

def test_clothing_segmenter():
    # Create test image with red square center and white background
    img_np = np.full((200, 200, 3), 255, dtype=np.uint8)
    img_np[50:150, 50:150] = [255, 0, 0] # Red clothing
    pil_img = Image.fromarray(img_np)

    transparent_rgba, mask, bbox = clothing_segmenter.extract_transparent_clothing(pil_img)

    assert transparent_rgba.mode == "RGBA"
    assert mask.shape == (200, 200)
    assert bbox[0] <= 55 and bbox[1] <= 55
    assert bbox[2] >= 145 and bbox[3] >= 145

def test_perspective_and_mesh_warping():
    clothing_pil = Image.new("RGBA", (100, 100), color=(0, 255, 0, 255))
    target_size = (300, 400)

    # Perspective warp
    src_quad = [(0, 0), (100, 0), (100, 100), (0, 100)]
    dst_quad = [(50, 50), (250, 50), (220, 250), (80, 250)]
    warped_pil, alpha_mask = perspective_warp.warp_quad(clothing_pil, src_quad, dst_quad, target_size)

    assert warped_pil.size == target_size
    assert alpha_mask.shape == (400, 300)

    # Dual leg mesh warp
    warped_mesh, mesh_alpha = mesh_warp.warp_dual_leg(
        clothing_pil, target_size,
        waist_left=(100, 150), waist_right=(200, 150),
        knee_left=(110, 280), knee_right=(190, 280),
        ankle_left=(115, 380), ankle_right=(185, 380)
    )

    assert warped_mesh.size == target_size
    assert mesh_alpha.shape == (400, 300)

def test_geometry_tryon_pipeline():
    person_img = Image.new("RGB", (300, 500), color=(200, 200, 200))
    clothing_img = Image.new("RGBA", (150, 200), color=(0, 0, 255, 255))

    success, result_pil, err_info = geometry_tryon_provider.generate(
        person_img, clothing_img, clothing_category="TOP"
    )

    assert success is True
    assert result_pil is not None
    assert result_pil.size == (300, 500)
    assert err_info is None
