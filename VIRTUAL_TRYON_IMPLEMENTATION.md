# FitAI Virtual Try-On Implementation Specification

## 1. Mục tiêu

Xây dựng lại chức năng Virtual Try-On của FitAI.

### Input

1. Ảnh người dùng full-body.
2. Ảnh quần áo, ví dụ:

   * T-shirt
   * Shirt
   * Jacket
   * Pants
   * Shorts
   * Skirt
   * Dress

### Output

Một ảnh người dùng đang mặc sản phẩm được chọn.

Ví dụ:

```text
Person Image
      +
Clothing Image
      ↓
Virtual Try-On Pipeline
      ↓
Generated Try-On Result
```

---

# 2. Vấn đề của implementation hiện tại

Implementation hiện tại có xu hướng:

```text
Person Image
      +
Clothing Image
      ↓
Resize Clothing
      ↓
Paste Clothing
```

Ví dụ:

```python
clothing = resize(clothing, width, height)
person.paste(clothing, position)
```

Cách này KHÔNG được sử dụng cho implementation mới.

### Không được:

* Resize toàn bộ clothing thành một rectangle.
* Paste clothing vào giữa cơ thể.
* Hard-code `x`, `y`, `width`, `height`.
* Giả định mọi người đều có cùng body ratio.
* Giả định người luôn đứng chính giữa.
* Dùng một bounding box duy nhất cho toàn bộ quần.
* Đè clothing lên toàn bộ body mà không có mask.

---

# 3. Kiến trúc mục tiêu

Implementation phải được thiết kế theo pipeline:

```text
                    PERSON IMAGE
                         │
                         ▼
                  Person Detection
                         │
                         ▼
                   Pose Detection
                         │
                         ▼
                   Body Landmarks
                         │
                         ▼
                  Body Segmentation
                         │
                         │
                         │
CLOTHING IMAGE ──────────┤
       │                 │
       ▼                 │
Clothing Segmentation    │
       │                 │
       ▼                 │
Transparent Clothing     │
       │                 │
       └────────┬────────┘
                ▼
          Body Alignment
                │
                ▼
        Clothing Warping
                │
                ▼
        Occlusion Handling
                │
                ▼
          Alpha Blending
                │
                ▼
          Try-On Result
```

---

# 4. Kiến trúc 3 tầng

Implementation phải được chia thành 3 mức.

## Level 1 — Geometry Try-On

Sử dụng:

* MediaPipe Pose
* OpenCV
* NumPy
* Pillow
* Clothing segmentation
* Perspective transform / mesh warping

Mục tiêu:

```text
Correct position
Correct scale
Correct body alignment
```

---

## Level 2 — Advanced Try-On

Bổ sung:

* Human segmentation
* Clothing segmentation
* Body parsing
* Mesh / Thin Plate Spline warping
* Occlusion masks
* Better blending

Mục tiêu:

```text
More realistic fitting
```

---

## Level 3 — AI Virtual Try-On

Thiết kế abstraction để có thể tích hợp VTON model như:

* CatVTON
* IDM-VTON
* OOTDiffusion
* StableVITON
* hoặc model VTON tương thích khác

Không hard-code toàn bộ hệ thống vào một model cụ thể.

Architecture phải cho phép:

```text
GeometryTryOnProvider
          │
          ├── BasicTryOnProvider
          │
          └── AIVirtualTryOnProvider
```

---

# 5. Nguyên tắc quan trọng

## 5.1. Không dùng Gemini để warp clothing

Gemini có thể được sử dụng cho:

```text
- Clothing classification
- Clothing category
- Color detection
- Style analysis
- Outfit recommendation
- Fashion description
```

Gemini KHÔNG phải component chính cho:

```text
- Pixel-level clothing alignment
- Clothing deformation
- Human segmentation
- Image warping
- Occlusion
```

Virtual Try-On phải chạy trong AI/CV pipeline.

---

# 6. Project Structure

AI Agent phải kiểm tra structure hiện tại trước khi tạo file.

Không được tự ý rewrite toàn bộ project.

Expected structure:

```text
fitai-ai-service/
│
├── app/
│   │
│   ├── main.py
│   │
│   ├── api/
│   │   └── tryon_routes.py
│   │
│   ├── pose/
│   │   ├── __init__.py
│   │   ├── pose_detector.py
│   │   └── landmark_extractor.py
│   │
│   ├── segmentation/
│   │   ├── __init__.py
│   │   ├── person_segmenter.py
│   │   └── clothing_segmenter.py
│   │
│   ├── clothing/
│   │   ├── __init__.py
│   │   ├── clothing_detector.py
│   │   ├── clothing_mask.py
│   │   └── clothing_processor.py
│   │
│   ├── warping/
│   │   ├── __init__.py
│   │   ├── perspective_warp.py
│   │   ├── mesh_warp.py
│   │   └── tps_warp.py
│   │
│   ├── occlusion/
│   │   ├── __init__.py
│   │   └── occlusion_mask.py
│   │
│   ├── blending/
│   │   ├── __init__.py
│   │   └── image_blender.py
│   │
│   ├── tryon/
│   │   ├── __init__.py
│   │   ├── tryon_service.py
│   │   ├── tryon_provider.py
│   │   ├── geometry_tryon_provider.py
│   │   └── ai_tryon_provider.py
│   │
│   ├── models/
│   │   └── model_manager.py
│   │
│   ├── config/
│   │   └── settings.py
│   │
│   └── utils/
│       ├── image_utils.py
│       └── validation.py
│
├── tests/
│   ├── test_pose.py
│   ├── test_segmentation.py
│   ├── test_warping.py
│   ├── test_blending.py
│   └── test_tryon.py
│
├── models/
│
├── requirements.txt
├── Dockerfile
└── .env.example
```

Nếu project hiện tại đã có structure tương đương, reuse code thay vì duplicate.

---

# 7. Data Flow

## Step 1 — Validate input

Validate:

```text
person_image
clothing_image
clothing_category
```

Allowed clothing categories:

```text
TOP
BOTTOM
DRESS
OUTERWEAR
```

Example:

```json
{
  "clothingCategory": "BOTTOM"
}
```

---

# 8. Person Processing

## 8.1. Pose Detection

Sử dụng MediaPipe Pose hoặc pose detector tương đương.

Required landmarks:

### Upper body

```text
LEFT_SHOULDER
RIGHT_SHOULDER
LEFT_HIP
RIGHT_HIP
```

### Lower body

```text
LEFT_HIP
RIGHT_HIP

LEFT_KNEE
RIGHT_KNEE

LEFT_ANKLE
RIGHT_ANKLE
```

### Optional

```text
LEFT_ELBOW
RIGHT_ELBOW
LEFT_WRIST
RIGHT_WRIST
```

---

# 9. Normalize Coordinates

MediaPipe landmarks thường sử dụng normalized coordinates:

```text
x ∈ [0, 1]
y ∈ [0, 1]
```

Convert:

```python
pixel_x = landmark.x * image_width
pixel_y = landmark.y * image_height
```

Không hard-code pixel coordinates.

---

# 10. Body Region

## 10.1. Bottom Clothing

Đối với pants/shorts/skirt:

Required points:

```text
left_hip
right_hip
left_knee
right_knee
left_ankle
right_ankle
```

Body region:

```text
        LEFT HIP ───────── RIGHT HIP
             \               /
              \             /
               \           /
              LEFT KNEE  RIGHT KNEE
                   │       │
                   │       │
              LEFT ANKLE RIGHT ANKLE
```

---

# 11. Do not use one rectangle

Không được:

```python
target_width = 300
target_height = 500
```

và paste clothing.

Phải tính target geometry từ body landmarks.

---

# 12. Clothing Processing

Clothing image phải được xử lý trước khi warp.

Pipeline:

```text
Original Clothing
       ↓
Background Removal
       ↓
Clothing Mask
       ↓
Transparent RGBA
       ↓
Crop to Clothing Bounding Box
       ↓
Normalize
```

Output:

```text
clothing_rgba
clothing_mask
```

---

# 13. Clothing Mask

Mask:

```text
0 = background
255 = clothing
```

Example:

```text
Background:
████████████████

Clothing:
██████      ██████
██████      ██████
██████      ██████
```

Background phải có alpha = 0.

---

# 14. Clothing Bounding Box

Sau segmentation:

```text
mask
 ↓
find contours
 ↓
bounding box
 ↓
crop clothing
```

Không sử dụng toàn bộ ảnh gốc nếu clothing chỉ chiếm một phần ảnh.

---

# 15. Bottom Clothing Warping

Đối với pants:

Không warp toàn bộ pants bằng một rectangle.

Phải xác định:

```text
Waist
Left Leg
Right Leg
```

Concept:

```text
                 WAIST
        ┌──────────────────┐
        │                  │
        └────────┬─────────┘
                 │
          ┌──────┴──────┐
          │             │
       LEFT LEG      RIGHT LEG
          │             │
          │             │
        KNEE          KNEE
          │             │
        ANKLE         ANKLE
```

---

# 16. Warping Strategy

Ưu tiên:

```text
1. Mesh Warp
2. Thin Plate Spline
3. Perspective Transform
```

Perspective transform chỉ được sử dụng cho trường hợp đơn giản.

Không sử dụng affine transform cho toàn bộ clothing nếu nó gây biến dạng không tự nhiên.

---

# 17. Mesh Warping

Clothing được chia thành mesh:

```text
●────●────●────●
│    │    │    │
●────●────●────●
│    │    │    │
●────●────●────●
│    │    │    │
●────●────●────●
```

Source mesh:

```text
Clothing Image
```

Target mesh:

```text
Body Shape
```

Sau đó deform từng cell.

Mục tiêu:

```text
source clothing mesh
        ↓
body-shaped mesh
```

---

# 18. Top Clothing

Đối với shirt/T-shirt:

Required landmarks:

```text
LEFT_SHOULDER
RIGHT_SHOULDER
LEFT_HIP
RIGHT_HIP
```

Optional:

```text
LEFT_ELBOW
RIGHT_ELBOW
LEFT_WRIST
RIGHT_WRIST
```

Target:

```text
        SHOULDER ───────── SHOULDER
          /                   \
         /                     \
        /                       \
       HIP ─────────────────── HIP
```

Sleeves có thể sử dụng elbow/wrist landmarks khi cần.

---

# 19. Dress

Dress phải được xử lý riêng.

Không dùng logic pants hoặc shirt.

Required:

```text
shoulders
hips
knees
```

Dress cần body silhouette rộng hơn vùng torso.

---

# 20. Occlusion

Đây là phần bắt buộc.

Clothing không được che mọi thứ.

Ví dụ pants:

```text
Pants
  ↓
Body Region
  ↓
Occlusion Mask
  ↓
Final Result
```

Hands/arms có thể cần nằm phía trên clothing.

Ví dụ:

```text
Background
    ↓
Person Body
    ↓
Clothing
    ↓
Foreground Body Parts
```

---

# 21. Alpha Blending

Không paste trực tiếp.

Sử dụng alpha compositing:

```text
result =
    clothing * alpha
    +
    person * (1 - alpha)
```

Có thể sử dụng:

```text
cv2.addWeighted
```

hoặc alpha compositing phù hợp.

---

# 22. Seam Handling

Sau khi warp:

```text
Clothing
    ↓
Warp
    ↓
Edge smoothing
    ↓
Alpha feathering
    ↓
Color adjustment
    ↓
Blend
```

Mục tiêu tránh:

```text
❌ hard rectangular edges
❌ visible background
❌ white box around pants
❌ sharp clothing boundary
```

---

# 23. Color and Lighting

MVP:

Không cần quá phức tạp.

Nhưng phải đảm bảo clothing không giữ background.

Optional:

```text
brightness matching
contrast matching
color correction
```

AI Agent không được ưu tiên color correction trước khi geometry đúng.

---

# 24. Image Quality

Output phải giữ:

```text
Original person resolution
```

Không resize output xuống kích thước nhỏ không cần thiết.

Internal processing có thể resize:

```text
input
 ↓
processing resolution
 ↓
try-on
 ↓
restore / upscale
```

nhưng phải tránh mất chất lượng.

---

# 25. Confidence

Pose landmarks phải có confidence threshold.

Ví dụ:

```python
MIN_VISIBILITY = 0.5
```

Không hard-code nếu project đã có configuration.

Nếu landmark quan trọng không đủ confidence:

```text
Do not generate incorrect try-on.
```

Return:

```json
{
  "success": false,
  "error": {
    "code": "BODY_LANDMARKS_UNRELIABLE",
    "message": "Unable to detect body position clearly."
  }
}
```

---

# 26. Clothing Validation

Nếu clothing segmentation thất bại:

```text
Do not paste original image.
```

Return controlled error:

```json
{
  "success": false,
  "error": {
    "code": "CLOTHING_SEGMENTATION_FAILED"
  }
}
```

---

# 27. Provider Architecture

Create interface:

```python
class TryOnProvider:

    def generate(
        self,
        person_image,
        clothing_image,
        clothing_category
    ):
        raise NotImplementedError
```

---

# 28. Geometry Provider

```python
class GeometryTryOnProvider(TryOnProvider):

    def generate(...):

        pose = pose_detector.detect(person)

        person_mask = person_segmenter.segment(person)

        clothing_mask = clothing_segmenter.segment(clothing)

        clothing = clothing_processor.process(
            clothing,
            clothing_mask
        )

        target = body_geometry.calculate(
            pose,
            clothing_category
        )

        warped = warper.transform(
            clothing,
            target
        )

        result = blender.compose(
            person,
            warped,
            person_mask
        )

        return result
```

---

# 29. AI VTON Provider

Prepare abstraction:

```python
class AIVirtualTryOnProvider(TryOnProvider):

    def generate(...):
        # VTON model implementation
        pass
```

Do not implement a fake AI result.

If model is unavailable:

```text
fallback to GeometryTryOnProvider
```

provided this is configured.

---

# 30. Provider Selection

Configuration:

```env
TRYON_PROVIDER=geometry
```

Possible:

```text
geometry
ai
auto
```

### geometry

Always use CV pipeline.

### ai

Always use VTON model.

### auto

Try AI VTON first.

If unavailable:

```text
AI VTON
   ↓
failed
   ↓
Geometry Try-On
```

---

# 31. API

Create or update:

```text
POST /api/v1/tryon
```

Request:

```text
multipart/form-data
```

Fields:

```text
person_image
clothing_image
clothing_category
```

Example:

```text
person_image: person.jpg
clothing_image: pants.jpg
clothing_category: BOTTOM
```

---

# 32. API Response

Success:

```json
{
  "success": true,
  "data": {
    "imageUrl": "...",
    "provider": "geometry"
  }
}
```

Failure:

```json
{
  "success": false,
  "error": {
    "code": "TRYON_FAILED",
    "message": "Unable to generate virtual try-on result."
  }
}
```

Do not expose Python stack traces to frontend.

---

# 33. Frontend Flow

Current UI:

```text
1. Person Photo
2. Clothing Item
3. Fitted Result
```

Keep this UI concept.

Flow:

```text
Upload Person
      ↓
Upload Clothing
      ↓
Select Clothing Category
      ↓
Generate Virtual Try-On
      ↓
Loading
      ↓
AI Service
      ↓
Result
```

Button:

```text
Generate Virtual Try-On
```

must be disabled while processing.

---

# 34. Loading State

Frontend must show:

```text
Analyzing body...
Removing clothing background...
Aligning clothing...
Generating try-on...
```

Do not make the user think the application is frozen.

---

# 35. Error Handling

Frontend must handle:

```text
BODY_LANDMARKS_UNRELIABLE
CLOTHING_SEGMENTATION_FAILED
TRYON_FAILED
MODEL_UNAVAILABLE
TIMEOUT
```

Example:

```text
Unable to detect your full body clearly.
Please upload a full-body photo with good lighting.
```

---

# 36. Input Guidelines

Frontend should show:

```text
For best results:

✓ Full-body photo
✓ Person facing camera
✓ Good lighting
✓ Entire body visible
✓ Minimal obstruction
✓ Clothing image with simple background
```

This is important because the algorithm cannot compensate for every bad input.

---

# 37. MVP Scope

First implementation MUST support:

```text
✓ Full-body standing person
✓ Front-facing pose
✓ Pants
✓ Shorts
✓ T-shirt
```

Do NOT initially attempt:

```text
❌ Sitting pose
❌ Extreme body rotation
❌ Multiple people
❌ Complex occlusion
❌ Heavy coats
❌ Very loose clothing
❌ Accessories
```

---

# 38. Development Phase

## Phase 1 — Refactor

Inspect current code.

Identify:

```text
current try-on endpoint
current image processing
current MediaPipe code
current frontend upload
current result rendering
```

Do not rewrite unrelated components.

---

# 39. Phase 2 — Pose

Implement:

```text
PoseDetector
LandmarkExtractor
BodyGeometry
```

Test:

```text
person image
 ↓
landmarks visualization
```

Create debug image showing:

```text
LEFT_HIP
RIGHT_HIP
LEFT_KNEE
RIGHT_KNEE
LEFT_ANKLE
RIGHT_ANKLE
```

---

# 40. Phase 3 — Clothing Segmentation

Implement:

```text
ClothingSegmenter
ClothingMask
ClothingProcessor
```

Output debug:

```text
original clothing
+
mask
+
transparent clothing
```

Do not continue until mask is correct.

---

# 41. Phase 4 — Body Alignment

Implement:

```text
BodyGeometry
```

For pants:

```text
hip
knee
ankle
```

For shirt:

```text
shoulder
hip
```

---

# 42. Phase 5 — Warping

Implement:

```text
PerspectiveWarp
MeshWarp
```

Start with perspective for basic validation.

Then implement mesh/TPS.

---

# 43. Phase 6 — Blending

Implement:

```text
OcclusionMask
AlphaBlender
EdgeFeathering
```

Test result.

---

# 44. Phase 7 — API

Connect:

```text
Frontend
    ↓
Backend
    ↓
AI Service
    ↓
TryOnProvider
```

---

# 45. Phase 8 — VTON

Only after geometry pipeline works.

Research and integrate a compatible VTON model.

Candidate architecture:

```text
AI VTON Provider
       │
       ├── Model Loader
       ├── Preprocessor
       ├── Inference
       └── Postprocessor
```

Model must be loaded once.

Do NOT load the model for every request.

---

# 46. Model Lifecycle

Bad:

```python
def generate():
    model = load_model()
    result = model(...)
```

This is unacceptable for production.

Correct:

```text
Application startup
       ↓
Load model
       ↓
Keep model in memory
       ↓
Requests reuse model
```

---

# 47. GPU / CPU

AI Agent must detect available hardware.

If GPU exists:

```text
CUDA → GPU
```

Otherwise:

```text
CPU
```

Do not crash because CUDA is unavailable.

Configuration:

```env
TRYON_DEVICE=auto
```

Possible:

```text
auto
cpu
cuda
```

---

# 48. Memory Management

Large images and AI models consume significant RAM/VRAM.

Must:

```text
validate input size
resize excessively large input
release temporary image objects
avoid duplicate copies
reuse loaded model
```

Recommended maximum input dimension should be configurable.

Example:

```env
MAX_IMAGE_SIZE=2048
```

---

# 49. Concurrency

Do not allow unlimited simultaneous VTON inference.

If using GPU:

```text
Request 1 → inference
Request 2 → queue
Request 3 → queue
```

rather than:

```text
Request 1 ─┐
Request 2 ─┼→ GPU simultaneously
Request 3 ─┘
```

This can cause:

```text
CUDA out of memory
```

---

# 50. Caching

Optional.

If the same:

```text
person image
+
clothing image
+
configuration
```

is requested repeatedly, cache can be considered.

Do not implement caching before the core pipeline works.

---

# 51. Temporary Files

Generated images must not accumulate indefinitely.

Use:

```text
/tmp/fitai/tryon/
```

or configured storage.

Delete temporary files after processing unless needed for response/storage.

---

# 52. Security

Validate uploaded files.

Allowed:

```text
jpg
jpeg
png
webp
```

Reject:

```text
.exe
.sh
.bat
.jsp
.php
```

Validate:

```text
MIME type
file extension
file size
image decoding
```

Do not trust the filename.

---

# 53. Tests

## Test 1 — Pose Detection

Input:

```text
full-body person
```

Expected:

```text
hip detected
knee detected
ankle detected
```

---

## Test 2 — Clothing Segmentation

Input:

```text
pants on background
```

Expected:

```text
pants mask correctly isolates pants
```

---

## Test 3 — Clothing Transparency

Expected:

```text
background alpha = 0
pants alpha > 0
```

---

## Test 4 — Body Geometry

Expected:

```text
target region follows person
```

---

## Test 5 — Warping

Expected:

```text
pants deform according to body geometry
```

---

## Test 6 — No Rectangle Artifact

Must verify:

```text
NO rectangular background
```

---

## Test 7 — Different Body Positions

Test:

```text
straight legs
legs slightly apart
one leg slightly forward
```

---

## Test 8 — Invalid Input

Expected controlled error.

---

# 54. Visual Regression Tests

Create test fixtures:

```text
tests/fixtures/
├── person_front.jpg
├── person_legs_apart.jpg
├── person_slight_angle.jpg
├── pants.jpg
├── shirt.jpg
```

Store expected outputs where appropriate.

Compare:

```text
output dimensions
mask quality
body alignment
major artifacts
```

Do not require pixel-perfect equality for AI-generated outputs.

---

# 55. Debug Mode

Add:

```env
TRYON_DEBUG=false
```

When:

```env
TRYON_DEBUG=true
```

save:

```text
01_person.jpg
02_pose.jpg
03_person_mask.png
04_clothing_mask.png
05_clothing_rgba.png
06_body_geometry.jpg
07_warped_clothing.png
08_occlusion_mask.png
09_final_result.jpg
```

This is extremely important for debugging.

---

# 56. Debug Visualization

Pose debug image:

```text
        ●
        │
   ●────●────●
        │
     ●────●
      │    │
      ●    ●
```

Draw landmark names.

For clothing:

```text
Original
Mask
Transparent
Warped
Final
```

must be inspectable independently.

---

# 57. Logging

Use structured logs.

Example:

```text
[TRYON] request started
[TRYON] category=BOTTOM
[TRYON] provider=geometry
[TRYON] pose detection completed
[TRYON] clothing segmentation completed
[TRYON] warping completed
[TRYON] blending completed
[TRYON] request completed
```

Log duration:

```text
pose_ms
segmentation_ms
warping_ms
blending_ms
total_ms
```

Do not log:

```text
API keys
tokens
user secrets
```

---

# 58. Performance Targets

For Geometry MVP:

Target:

```text
< 5 seconds
```

depending on hardware and image resolution.

For AI VTON:

Do not hard-code a strict target before benchmarking the selected model.

Measure:

```text
cold start
model loading
preprocessing
inference
postprocessing
total latency
```

---

# 59. Model Download

AI Agent must NOT silently download several GB of models during every Docker build.

Use a model directory:

```text
/models
```

and configuration:

```env
MODEL_PATH=/models
```

If model is external:

```text
download once
cache
reuse
```

Document model license and usage requirements before integrating it.

---

# 60. Docker

AI Service must support:

```text
CPU mode
```

first.

GPU support can be added separately.

Do not make the entire application dependent on CUDA unless the deployment environment requires it.

---

# 61. Environment Variables

Add to `.env.example`:

```env
TRYON_PROVIDER=geometry

TRYON_DEVICE=auto

TRYON_DEBUG=false

MAX_IMAGE_SIZE=2048

TRYON_MAX_CONCURRENT=1

MODEL_PATH=/models
```

Do not commit real secrets.

---

# 62. Backend Integration

Backend should not contain image-processing logic.

Correct:

```text
Backend
   ↓
AI Service API
   ↓
Virtual Try-On
```

Incorrect:

```text
Backend
   ↓
OpenCV
   ↓
MediaPipe
   ↓
VTON
```

Keep AI/CV processing inside `fitai-ai-service`.

---

# 63. Frontend Integration

Frontend only handles:

```text
upload
preview
loading
API request
result
error
```

Frontend must NOT implement:

```text
pose detection
segmentation
warping
VTON inference
```

---

# 64. Gemini Integration

Gemini remains a separate AI capability.

Example:

```text
                    AI Service
                       │
             ┌─────────┴─────────┐
             │                   │
             ▼                   ▼
       Gemini Service       Try-On Service
             │                   │
             ▼                   ▼
       Recommendation       Computer Vision
       Style Analysis       VTON
```

Do not mix these responsibilities.

---

# 65. Failure Handling

If AI VTON fails:

```text
AI VTON
   ↓
failure
   ↓
Geometry Provider
```

if configured:

```env
TRYON_FALLBACK_ENABLED=true
```

If both fail:

```json
{
  "success": false,
  "error": {
    "code": "TRYON_UNAVAILABLE",
    "message": "Virtual try-on is temporarily unavailable."
  }
}
```

---

# 66. Important: Do Not Fake Results

AI Agent MUST NOT create a fake response such as:

```text
return original_image
```

and claim try-on succeeded.

If generation fails:

```text
success = false
```

---

# 67. Definition of Done — MVP

MVP is complete only when:

```text
[ ] Person upload works
[ ] Clothing upload works
[ ] Clothing category works
[ ] MediaPipe pose works
[ ] Body landmarks are detected
[ ] Clothing background is removed
[ ] Clothing mask works
[ ] Clothing is transparent
[ ] Body geometry is calculated dynamically
[ ] Clothing is warped
[ ] No rectangular clothing background
[ ] Clothing follows body position
[ ] Occlusion is handled
[ ] Alpha blending works
[ ] Try-on API works
[ ] Frontend displays result
[ ] Errors are handled
[ ] Debug mode works
[ ] Tests pass
[ ] Docker build works
```

---

# 68. Definition of Done — AI VTON

After MVP:

```text
[ ] VTON provider abstraction exists
[ ] Model selected based on compatibility
[ ] License checked
[ ] Model downloaded/cached correctly
[ ] Model loaded once
[ ] GPU support tested
[ ] CPU fallback tested
[ ] Memory usage measured
[ ] Inference latency measured
[ ] AI VTON quality compared against geometry pipeline
[ ] Fallback behavior works
```

---

# 69. AI Agent Execution Rules

Before modifying code:

### Step 1

Inspect:

```text
fitai-ai-service
fitai-backend
fitai-frontend
```

### Step 2

Find existing:

```text
MediaPipe
PoseDetector
LandmarkExtractor
TryOn
Cloudinary
Image upload
Gemini
```

### Step 3

Understand existing API contracts.

### Step 4

Do not break existing APIs unless necessary.

### Step 5

Implement geometry pipeline incrementally.

### Step 6

After every major phase, run tests.

### Step 7

Generate debug images.

### Step 8

Only after geometry pipeline works, implement VTON provider.

---

# 70. AI Agent Must Not Do These Things

Do NOT:

```text
❌ Rewrite entire project
❌ Replace Spring Boot
❌ Replace React
❌ Replace existing MediaPipe implementation unnecessarily
❌ Move AI logic into frontend
❌ Put VTON inference into Spring Boot
❌ Hard-code body coordinates
❌ Hard-code clothing coordinates
❌ Use one rectangle for clothing
❌ Use Gemini for pixel-level image warping
❌ Download huge models unnecessarily
❌ Load AI model on every request
❌ Ignore GPU memory
❌ Ignore file validation
❌ Return fake successful images
```

---

# 71. Priority Order

Implementation priority MUST be:

```text
P0
Correctness

P1
Segmentation

P2
Body alignment

P3
Warping

P4
Occlusion

P5
Blending

P6
API integration

P7
Performance

P8
AI VTON

P9
Advanced features
```

Do not optimize performance before correctness.

Do not integrate a huge VTON model before the input/output pipeline is stable.

---

# 72. Final Architecture

The final system should look like:

```text
                         FITAI
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
        ▼                                     ▼
  Outfit Recommendation                 Virtual Try-On
        │                                     │
        ▼                                     ▼
     Gemini                              TryOnService
                                              │
                                    ┌─────────┴─────────┐
                                    │                   │
                                    ▼                   ▼
                           Geometry Provider       AI VTON Provider
                                    │                   │
                    ┌───────────────┼───────────────┐   │
                    │               │               │   │
                    ▼               ▼               ▼   ▼
                  Pose       Segmentation       Warping VTON Model
                    │               │               │   │
                    └───────────────┴───────────────┴───┘
                                    │
                                    ▼
                              Occlusion
                                    │
                                    ▼
                                Blending
                                    │
                                    ▼
                              Final Image
```

---

# 73. Recommended Development Strategy

The AI Agent MUST follow this order:

```text
PHASE 1
Existing code analysis
        ↓
PHASE 2
Pose detection verification
        ↓
PHASE 3
Clothing segmentation
        ↓
PHASE 4
Body geometry
        ↓
PHASE 5
Mesh/TPS warping
        ↓
PHASE 6
Occlusion + blending
        ↓
PHASE 7
API integration
        ↓
PHASE 8
Frontend integration
        ↓
PHASE 9
Performance optimization
        ↓
PHASE 10
AI VTON integration
```

---

# 74. Final Agent Prompt

Use the following instructions when executing this specification:

```text
You are implementing the Virtual Try-On system for FitAI.

Read VIRTUAL_TRYON_IMPLEMENTATION.md completely before modifying the project.

First inspect the existing repository and identify the current:
- AI Service
- MediaPipe implementation
- PoseDetector
- LandmarkExtractor
- Image upload flow
- Try-On endpoint
- Frontend try-on page
- Backend-to-AI-Service communication

Do not rewrite the project.

Do not replace existing working components without a technical reason.

The current problem is that clothing is being resized and pasted as a rectangular image instead of being aligned to the user's body.

Fix this by implementing:

1. Body pose detection
2. Body landmark extraction
3. Person segmentation
4. Clothing segmentation
5. Transparent clothing extraction
6. Body geometry calculation
7. Clothing warping
8. Mesh/TPS warping where appropriate
9. Occlusion handling
10. Alpha blending
11. Structured error handling
12. Debug visualization
13. Automated tests

For pants, use:
- left hip
- right hip
- left knee
- right knee
- left ankle
- right ankle

For shirts, use:
- left shoulder
- right shoulder
- left hip
- right hip

Do NOT use a single rectangle to position clothing.

Do NOT hard-code x/y/width/height.

Do NOT use Gemini for pixel-level clothing placement.

Keep Gemini responsible for fashion analysis and recommendation.

Keep Virtual Try-On inside the AI Service.

Create a provider abstraction so the system supports:

GeometryTryOnProvider
AIVirtualTryOnProvider

The Geometry provider must work before the AI VTON provider is introduced.

Do not fake a successful result.

If processing fails, return a structured error.

Implement debug mode that can save:
- pose visualization
- person mask
- clothing mask
- transparent clothing
- target body geometry
- warped clothing
- occlusion mask
- final result

After implementation:

1. Run unit tests.
2. Run integration tests.
3. Build the AI service.
4. Build Docker image if Docker is used.
5. Verify frontend integration.
6. Test at least:
   - normal standing person
   - legs slightly apart
   - pants
   - shirt
   - invalid image
   - failed landmark detection

Finally report:

- Files changed
- Architecture changes
- Algorithms used
- Dependencies added
- Model requirements
- Tests added
- Test results
- Build result
- Docker result
- Known limitations
- Next recommended step
```

---

# 75. Success Criteria

The implementation is considered successful only when the following problem is eliminated:

```text
BEFORE

Person
  +
┌───────────────┐
│               │
│     PANTS     │
│               │
└───────────────┘

❌ rectangular clothing
❌ wrong position
❌ wrong scale
❌ background visible


AFTER

Person
      │
   ┌──┴──┐
   │PANTS│
   │     │
  /       \
 /         \
LEG       LEG

✓ follows hips
✓ follows legs
✓ correct scale
✓ transparent background
✓ correct body alignment
✓ natural blending
```

The primary objective is **correct body-relative clothing placement**, not merely making the clothing image appear on top of the person.
