# FitAI Try-On Repository Analysis Report

## 1. Existing Try-On Entry Point & Architecture
- **Entry Point**: `ai-service/app/routes/tryon.py` (`POST /api/v1/try-on`)
- **Service Layer**: `ai-service/app/services/tryon_service.py`
- **Provider Layer**: `ai-service/app/tryon/` (`TryOnProvider`, `GeometryTryOnProvider`, `AIVirtualTryOnProvider`)

## 2. Pose Detector & Landmark Extractor
- **Pose Detector**: `ai-service/app/pose/pose_detector.py` (MediaPipe 3D Pose Solution with 33 landmarks)
- **Landmark Extractor**: `ai-service/app/pose/landmark_extractor.py` (`BodyLandmarks` dataclass, visibility validation with `MIN_VISIBILITY = 0.4`)

## 3. Person & Clothing Segmentation
- **Person Segmentation**: `ai-service/app/segmentation/person_segmenter.py` (Binary person body mask)
- **Clothing Segmentation**: `ai-service/app/segmentation/clothing_segmenter.py` (Background removal, RGBA transparency extraction, bounding box calculation)
- **Clothing Processor**: `ai-service/app/clothing/clothing_processor.py` (Cropping & mask formatting)

## 4. Warping & Body Alignment Implementation
- **Perspective Warp**: `ai-service/app/warping/perspective_warp.py` (`cv2.getPerspectiveTransform` quad warping for Tops, Shirts, Outerwear, Dresses)
- **Mesh Warp**: `ai-service/app/warping/mesh_warp.py` (Dual-mesh piecewise warping for Bottoms/Pants: Waist->Knee and Knee->Ankle)

## 5. Occlusion & Blending Implementation
- **Occlusion Mask**: `ai-service/app/occlusion/occlusion_mask.py` (Hands & arms foreground protection mask)
- **Image Blender**: `ai-service/app/blending/image_blender.py` (Alpha compositing with Gaussian edge feathering)

## 6. API & Frontend Integration
- **Backend Service Call**: `backend/src/main/java/com/shop/service/AiService.java`
- **Frontend Try-On UI**: `frontend/src/pages/TryOn.jsx`

## 7. Existing Test Suite
- `ai-service/tests/test_vton_pipeline.py` (Pipeline unit tests)
- `ai-service/tests/test_tryon.py` (API route tests)
