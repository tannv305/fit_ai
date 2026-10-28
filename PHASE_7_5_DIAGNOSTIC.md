# FitAI — Phase 7.5 Diagnostic & Geometry Validation

> **Purpose:** Diagnose why the current Geometry Virtual Try-On does not correctly align clothing with the person's body.
>
> **IMPORTANT:** This phase is a **diagnostic and validation phase**. Do NOT immediately replace the current system with an AI VTON model. First determine exactly which component is causing the misalignment.

---

# 1. Objective

The current FitAI Virtual Try-On pipeline has completed Phase 7:

```text
Person Image
      ↓
Pose Detection
      ↓
Body Landmarks
      ↓
Person Segmentation
      ↓
Clothing Segmentation
      ↓
Body Geometry
      ↓
Clothing Warping
      ↓
Occlusion
      ↓
Blending
      ↓
Try-On Result
```

However, clothing still does not correctly match the person's body.

The goal of Phase 7.5 is to identify the exact failure point.

Possible failure categories:

```text
A. Input image problem
B. Pose detection problem
C. Landmark coordinate problem
D. Person segmentation problem
E. Clothing segmentation problem
F. Clothing keypoint problem
G. Source → target correspondence problem
H. Body geometry calculation problem
I. Warping problem
J. Occlusion problem
K. Alpha blending problem
L. Image coordinate / resize problem
M. Aspect-ratio problem
N. Frontend/backend image transformation problem
```

Do not assume the cause.

Measure and visualize each stage.

---

# 2. Golden Rule

The AI Agent MUST NOT immediately modify the algorithm.

First:

```text
Inspect
   ↓
Run
   ↓
Capture diagnostics
   ↓
Visualize
   ↓
Identify failure
   ↓
Prove failure
   ↓
Fix only the failed component
   ↓
Run regression tests
```

Do NOT:

```text
❌ randomly change x/y offsets
❌ randomly change scale
❌ add arbitrary +10/-10 corrections
❌ hard-code body coordinates
❌ change multiple algorithms simultaneously
❌ replace the entire try-on pipeline
❌ integrate VTON before diagnosing geometry
```

---

# 3. Current Architecture Must Be Preserved

Before modifying anything, inspect the repository.

Expected services:

```text
fitai-ai-service
fitai-backend
fitai-frontend
```

The AI/CV processing must remain inside:

```text
fitai-ai-service
```

Do not move OpenCV/MediaPipe/VTON logic into:

```text
fitai-frontend
```

or:

```text
fitai-backend
```

---

# 4. Step 0 — Repository Inspection

Before writing code, inspect:

```text
fitai-ai-service/
fitai-backend/
fitai-frontend/
```

Find all files related to:

```text
tryon
virtual try-on
pose
MediaPipe
landmark
segmentation
clothing
warp
TPS
mesh
perspective
alpha
blend
mask
image processing
```

Search for:

```python
cv2.resize
cv2.warpPerspective
cv2.remap
cv2.getPerspectiveTransform
cv2.addWeighted
Image.alpha_composite
paste
resize
warp
transform
mask
landmark
```

Also search for:

```text
hard-coded x
hard-coded y
hard-coded width
hard-coded height
scale factors
offsets
```

Create a report:

```text
diagnostics/repository_analysis.md
```

containing:

```text
1. Existing Try-On entry point
2. Existing Try-On service
3. Existing Pose Detector
4. Existing Landmark Extractor
5. Existing Person Segmentation
6. Existing Clothing Segmentation
7. Existing Clothing Processor
8. Existing Warping implementation
9. Existing Occlusion implementation
10. Existing Blending implementation
11. API endpoint
12. Frontend integration
13. Existing tests
```

---

# 5. Step 1 — Create Diagnostic Directory

Create:

```text
diagnostics/
├── README.md
├── repository_analysis.md
├── diagnostic_report.md
├── metrics/
├── images/
│   ├── 01_input/
│   ├── 02_pose/
│   ├── 03_person_mask/
│   ├── 04_clothing/
│   ├── 05_clothing_mask/
│   ├── 06_correspondence/
│   ├── 07_geometry/
│   ├── 08_warp/
│   ├── 09_occlusion/
│   ├── 10_blending/
│   └── 11_final/
└── fixtures/
```

Do not put debug files randomly throughout the project.

---

# 6. Step 2 — Diagnostic Configuration

Add configuration:

```env
TRYON_DEBUG=true
TRYON_DIAGNOSTIC=true
```

Recommended:

```env
TRYON_DEBUG_OUTPUT_DIR=diagnostics/images
```

Do not hard-code the debug path.

---

# 7. Step 3 — Input Validation

For every diagnostic run record:

```text
PERSON IMAGE

filename
width
height
channels
format
file size
aspect ratio
```

And:

```text
CLOTHING IMAGE

filename
width
height
channels
format
file size
aspect ratio
```

Example:

```text
PERSON
width: 1080
height: 1920
aspect_ratio: 0.5625

CLOTHING
width: 768
height: 1024
aspect_ratio: 0.75
```

Save:

```text
diagnostics/metrics/input.json
```

---

# 8. Step 4 — Verify Coordinate Systems

This is mandatory.

The Agent must determine which coordinate systems are used at every stage.

Possible coordinate systems:

```text
1. Normalized MediaPipe coordinates
2. Original image pixels
3. Resized image pixels
4. Cropped image coordinates
5. Clothing-local coordinates
6. Target-body coordinates
7. Final-output coordinates
```

Document every conversion.

Example:

```text
MediaPipe:
x = 0.42
y = 0.57

Original:
x = 453
y = 1094

Processing:
x = 226
y = 547
```

If an image is resized:

```text
original_width
original_height
processing_width
processing_height
scale_x
scale_y
```

must be recorded.

---

# 9. Critical Coordinate Rule

Never assume:

```python
x * scale
y * scale
```

is correct unless:

```text
scale_x == scale_y
```

For non-uniform resizing:

```python
x_new = x_old * scale_x
y_new = y_old * scale_y
```

If aspect ratio changes accidentally, flag:

```text
ERROR: NON_UNIFORM_IMAGE_RESIZE
```

---

# 10. Step 5 — Pose Diagnostic

Run the existing PoseDetector without modifying the algorithm.

Generate:

```text
diagnostics/images/02_pose/
```

with:

```text
pose_original.jpg
pose_landmarks.jpg
pose_connections.jpg
pose_labels.jpg
```

Required landmarks for BOTTOM:

```text
LEFT_HIP
RIGHT_HIP
LEFT_KNEE
RIGHT_KNEE
LEFT_ANKLE
RIGHT_ANKLE
```

Also record:

```text
visibility
presence
x
y
z
```

if available.

---

# 11. Pose Confidence Test

Define:

```text
MIN_LANDMARK_VISIBILITY
```

using the project's configuration if it already exists.

For each required landmark:

```text
landmark
x
y
visibility
status
```

Example:

```text
LEFT_HIP
x=0.421
y=0.512
visibility=0.98
status=VALID
```

If:

```text
visibility < threshold
```

mark:

```text
INVALID
```

Do not silently continue.

---

# 12. Pose Visualization

Draw labels:

```text
LH = Left Hip
RH = Right Hip
LK = Left Knee
RK = Right Knee
LA = Left Ankle
RA = Right Ankle
```

Example:

```text
             LH ●──────● RH
                 \    /
                  \  /
                 LK  RK
                 ●    ●
                 │    │
                LA    RA
```

Save:

```text
02_pose/pose_labels.jpg
```

---

# 13. Pose Diagnostic Questions

The Agent must answer:

```text
[ ] Are both hips detected?
[ ] Are both knees detected?
[ ] Are both ankles detected?
[ ] Are landmarks on the actual body?
[ ] Are left/right labels correct?
[ ] Are normalized coordinates converted correctly?
[ ] Are landmarks mapped to the same image resolution used by warping?
```

If any answer is NO:

```text
STOP.
Fix pose/coordinate handling first.
Do not continue to warping diagnosis.
```

---

# 14. Step 6 — Person Segmentation Diagnostic

Generate:

```text
03_person_mask/
```

Files:

```text
person_mask.png
person_mask_overlay.jpg
person_bbox.jpg
person_bbox.json
```

Check:

```text
Does the mask contain the person?
Does it exclude background?
Are legs separated correctly?
Are feet included?
Are arms included?
```

---

# 15. Person Mask Metrics

Calculate:

```text
mask_area
image_area
mask_ratio
bbox_width
bbox_height
bbox_aspect_ratio
```

Save:

```text
metrics/person_mask.json
```

Flag suspicious cases.

For example:

```text
mask_ratio < 0.05
```

may indicate segmentation failure.

Do not use an arbitrary threshold if an existing project threshold is already defined.

---

# 16. Step 7 — Clothing Segmentation Diagnostic

Generate:

```text
04_clothing/
05_clothing_mask/
```

Required:

```text
clothing_original.jpg
clothing_mask.png
clothing_mask_overlay.jpg
clothing_bbox.jpg
clothing_rgba.png
```

The Agent must verify:

```text
[ ] Background removed
[ ] Entire pants included
[ ] Waist included
[ ] Left leg included
[ ] Right leg included
[ ] No major background pixels remain
[ ] No significant clothing pixels removed
```

---

# 17. Clothing Mask Quality

Measure:

```text
mask_area
bbox
bbox_width
bbox_height
bbox_aspect_ratio
```

Also calculate:

```text
foreground_ratio =
clothing_mask_area / clothing_image_area
```

If foreground ratio is suspicious:

```text
FLAG CLOTHING_SEGMENTATION
```

---

# 18. Critical Test — Clothing Background

Check for the common error:

```text
white/gray background
```

being included in the clothing mask.

If:

```text
clothing_mask
```

contains the background, then warping can never produce a correct result.

Fix segmentation first.

---

# 19. Step 8 — Clothing Geometry Extraction

This is one of the most important steps.

The Agent must determine whether the current implementation knows:

```text
pants waist
left hip
right hip
left knee
right knee
left ankle
right ankle
```

from the clothing image.

If it only knows:

```text
clothing_bbox
```

then mark:

```text
WARNING:
CLOTHING_HAS_NO_SEMANTIC_KEYPOINTS
```

Do NOT pretend that the bounding box is enough.

---

# 20. Clothing Keypoint Diagnostic

Create:

```text
06_correspondence/clothing_keypoints.jpg
```

Visualize:

```text
CW_L = Clothing Waist Left
CW_R = Clothing Waist Right

CL_K = Clothing Left Knee
CR_K = Clothing Right Knee

CL_A = Clothing Left Ankle
CR_A = Clothing Right Ankle
```

The actual implementation may use different names, but the semantic meaning must be clear.

---

# 21. Clothing Keypoint Validation

The Agent must verify:

```text
waist_left
waist_right
left_leg_axis
right_leg_axis
left_knee
right_knee
left_ankle
right_ankle
```

If these do not exist, the Agent must NOT claim that TPS/mesh warping is body-aware.

---

# 22. Step 9 — Source/Target Correspondence

This is the most important diagnostic.

Create a source/target correspondence report.

Example:

```text
SOURCE CLOTHING              TARGET PERSON

CW_L ●──────────────────────● LH
CW_R ●──────────────────────● RH

CL_K ●──────────────────────● LK
CR_K ●──────────────────────● RK

CL_A ●──────────────────────● LA
CR_A ●──────────────────────● RA
```

Generate:

```text
06_correspondence/source_target.jpg
06_correspondence/source_points.jpg
06_correspondence/target_points.jpg
06_correspondence/mapping.json
```

---

# 23. Mapping JSON

Example:

```json
{
  "LEFT_WAIST": {
    "source": [120, 85],
    "target": [420, 910]
  },
  "RIGHT_WAIST": {
    "source": [420, 85],
    "target": [590, 900]
  },
  "LEFT_KNEE": {
    "source": [145, 430],
    "target": [440, 1210]
  },
  "RIGHT_KNEE": {
    "source": [395, 430],
    "target": [575, 1200]
  },
  "LEFT_ANKLE": {
    "source": [135, 760],
    "target": [430, 1540]
  },
  "RIGHT_ANKLE": {
    "source": [405, 760],
    "target": [580, 1535]
  }
}
```

The actual numbers must come from the images.

Do NOT invent these values.

---

# 24. Correspondence Validation

For every mapping ask:

```text
Does source LEFT correspond to target LEFT?
Does source RIGHT correspond to target RIGHT?
Does waist correspond to hip?
Does knee correspond to knee?
Does ankle correspond to ankle?
```

If:

```text
source LEFT → target RIGHT
```

flag:

```text
ERROR: LEFT_RIGHT_MISMATCH
```

---

# 25. Step 10 — Body Geometry Diagnostic

Generate:

```text
07_geometry/body_geometry.jpg
07_geometry/body_polygon.png
07_geometry/body_centerline.jpg
```

Draw:

```text
hip line
left leg axis
right leg axis
knee line
ankle line
```

The result should represent the actual target geometry.

---

# 26. Body Geometry Must Not Be One Rectangle

If the current implementation produces:

```text
x
y
width
height
```

only, mark:

```text
WARNING:
BODY_GEOMETRY_IS_RECTANGULAR
```

For pants, geometry should represent:

```text
waist
left leg
right leg
```

rather than a single rectangle.

---

# 27. Step 11 — Leg Axis Diagnostic

Calculate:

```text
left_leg_vector =
LEFT_ANKLE - LEFT_HIP

right_leg_vector =
RIGHT_ANKLE - RIGHT_HIP
```

Calculate angles:

```text
left_leg_angle
right_leg_angle
```

Calculate lengths:

```text
left_leg_length
right_leg_length
```

Save:

```text
metrics/body_geometry.json
```

This detects the situation where one leg is angled but the clothing remains vertical.

---

# 28. Step 12 — Body Width Diagnostic

Calculate:

```text
hip_width
knee_width
ankle_width
```

Example:

```text
hip_width = distance(LH, RH)
knee_width = distance(LK, RK)
ankle_width = distance(LA, RA)
```

Compare:

```text
hip_width
knee_width
ankle_width
```

The clothing target must reflect these changes.

---

# 29. Step 13 — Warp Diagnostic

Do NOT inspect only the final image.

Save the warped clothing before blending:

```text
08_warp/
01_warped_rgba.png
02_warped_mask.png
03_warped_overlay.jpg
04_warped_bbox.jpg
```

---

# 30. Warp Overlay

Overlay warped clothing onto a blank canvas.

Then overlay body landmarks.

Generate:

```text
08_warp/warp_vs_body.jpg
```

Expected:

```text
Pants waist
     ↓
Person hips

Pants left leg
     ↓
Person left leg

Pants right leg
     ↓
Person right leg
```

---

# 31. Warp Error Classification

Classify the result as one of:

```text
WARP_OK
WARP_SCALE_WRONG
WARP_POSITION_WRONG
WARP_ROTATION_WRONG
WARP_LEFT_RIGHT_WRONG
WARP_LEG_ALIGNMENT_WRONG
WARP_ASPECT_RATIO_WRONG
WARP_SHAPE_WRONG
WARP_BACKGROUND_INCLUDED
```

Only one primary error should be selected where possible.

---

# 32. Step 14 — Check Perspective Transform

If current code uses:

```python
cv2.getPerspectiveTransform
```

inspect:

```text
source_points
target_points
```

Determine whether four corners are semantically meaningful.

If the four corners are simply:

```text
top-left
top-right
bottom-left
bottom-right
```

of the clothing image, this is NOT sufficient for pants with two separate legs.

Record:

```text
PERSPECTIVE_TRANSFORM_LIMITATION
```

---

# 33. Step 15 — Check TPS

If current code uses Thin Plate Spline:

Inspect:

```text
source control points
target control points
```

Record:

```text
number_of_control_points
source_points
target_points
```

Verify that points represent semantic clothing regions.

If TPS uses only bounding-box corners:

```text
WARNING:
TPS_IS_NOT_BODY_AWARE
```

---

# 34. Step 16 — Check Mesh Warp

If mesh warp is used:

Record:

```text
mesh_rows
mesh_columns
source_mesh_points
target_mesh_points
```

Visualize:

```text
source_mesh.jpg
target_mesh.jpg
warped_mesh.jpg
```

Check whether the mesh follows:

```text
waist
left leg
right leg
```

If mesh spans the empty area between the two legs incorrectly:

```text
WARNING:
MESH_DOES_NOT_MODEL_TWO_LEG_STRUCTURE
```

---

# 35. Step 17 — Check Aspect Ratio

For every transformation:

```text
original width
original height
processed width
processed height
output width
output height
```

Calculate:

```text
original_aspect_ratio
processed_aspect_ratio
output_aspect_ratio
```

If aspect ratio changes unexpectedly:

```text
ERROR:
ASPECT_RATIO_DISTORTION
```

---

# 36. Step 18 — Check Image Cropping

Check whether clothing is cropped before warp.

Potential failure:

```text
pants
 ↓
crop
 ↓
one leg partially removed
```

Generate:

```text
08_warp/crop_before_warp.jpg
```

Verify:

```text
waist present
left leg complete
right leg complete
ankles present
```

---

# 37. Step 19 — Occlusion Diagnostic

Generate:

```text
09_occlusion/
person_mask.png
clothing_mask.png
occlusion_mask.png
final_occlusion_preview.jpg
```

For pants verify:

```text
pants should not cover:
- upper body
- head
- unrelated background
```

If arms cross the pants region:

```text
arm should be considered foreground
```

if supported by the current segmentation pipeline.

---

# 38. Step 20 — Blending Diagnostic

Generate:

```text
10_blending/
before_blend.png
after_blend.png
alpha.png
edge_preview.png
```

Check:

```text
hard rectangle
white background
halo
transparent holes
jagged edges
double edges
```

Classify:

```text
BLEND_OK
BLEND_HALO
BLEND_HARD_EDGE
BLEND_BACKGROUND_LEAK
BLEND_ALPHA_ERROR
```

---

# 39. Step 21 — Final Result Diagnostic

Generate:

```text
11_final/
final.jpg
final_with_landmarks.jpg
final_side_by_side.jpg
```

Side-by-side:

```text
Original Person | Final Try-On
```

Also create:

```text
Original Person
       +
Target Geometry
       +
Warped Clothing
       +
Final
```

---

# 40. Step 22 — Quantitative Alignment Metrics

Do not rely only on visual judgment.

Calculate:

### Hip alignment

```text
distance(
    clothing_waist_center,
    person_hip_center
)
```

### Left leg alignment

Calculate distance between:

```text
clothing_left_leg_axis
person_left_leg_axis
```

### Right leg alignment

Calculate:

```text
clothing_right_leg_axis
person_right_leg_axis
```

### Length ratio

```text
clothing_leg_length / person_leg_length
```

Save:

```text
metrics/alignment.json
```

---

# 41. Suggested Alignment Metrics

Use normalized metrics:

```text
hip_alignment_error
left_leg_alignment_error
right_leg_alignment_error
waist_width_error
left_leg_length_error
right_leg_length_error
```

Normalize distances by:

```text
person_image_height
```

Example:

```text
normalized_error =
pixel_error / person_image_height
```

Do not invent a universal quality threshold.

Use the metrics primarily for comparison before/after changes.

---

# 42. Step 23 — Detect the Exact Failure Stage

The Agent must classify the pipeline.

Use:

```text
INPUT
POSE
PERSON_SEGMENTATION
CLOTHING_SEGMENTATION
CLOTHING_KEYPOINTS
CORRESPONDENCE
BODY_GEOMETRY
WARP
OCCLUSION
BLENDING
FRONTEND
```

Select:

```text
PRIMARY_FAILURE_STAGE
```

and:

```text
SECONDARY_FAILURE_STAGE
```

---

# 43. Diagnostic Decision Tree

Use this decision tree:

```text
START
 │
 ├── Input valid?
 │      │
 │      └── NO → INPUT_FAILURE
 │
 ├── Pose correct?
 │      │
 │      └── NO → POSE_FAILURE
 │
 ├── Person mask correct?
 │      │
 │      └── NO → PERSON_SEGMENTATION_FAILURE
 │
 ├── Clothing mask correct?
 │      │
 │      └── NO → CLOTHING_SEGMENTATION_FAILURE
 │
 ├── Clothing semantic points available?
 │      │
 │      └── NO → CLOTHING_GEOMETRY_FAILURE
 │
 ├── Source/target correspondence correct?
 │      │
 │      └── NO → CORRESPONDENCE_FAILURE
 │
 ├── Body geometry correct?
 │      │
 │      └── NO → BODY_GEOMETRY_FAILURE
 │
 ├── Warped clothing follows target?
 │      │
 │      └── NO → WARP_FAILURE
 │
 ├── Occlusion correct?
 │      │
 │      └── NO → OCCLUSION_FAILURE
 │
 ├── Blending correct?
 │      │
 │      └── NO → BLENDING_FAILURE
 │
 └── All correct
        ↓
   GEOMETRY PIPELINE LIMITATION
        ↓
   Proceed to AI VTON
```

---

# 44. Step 24 — Do Not Fix Multiple Components At Once

If:

```text
CLOTHING_SEGMENTATION_FAILURE
```

is found:

Only fix segmentation.

Then rerun diagnostics.

If:

```text
CORRESPONDENCE_FAILURE
```

is found:

Fix correspondence.

Then rerun.

Do not simultaneously modify:

```text
segmentation
warp
blend
frontend
```

because the root cause becomes impossible to identify.

---

# 45. Step 25 — Before/After Regression

Before making a fix:

Save:

```text
diagnostics/baseline/
```

After fixing:

```text
diagnostics/after_fix/
```

Compare:

```text
pose
mask
correspondence
geometry
warp
final
metrics
```

---

# 46. Step 26 — Frontend Diagnostic

Only after AI Service output is verified.

Check:

```text
AI Service output
       ↓
Backend
       ↓
Frontend
```

Verify that frontend does NOT:

```text
resize result
crop result
change aspect ratio
apply CSS object-fit incorrectly
```

Check:

```css
object-fit
width
height
aspect-ratio
```

A correct backend result can appear wrong if frontend changes its aspect ratio.

---

# 47. Step 27 — API Image Integrity

Compare:

```text
AI Service generated image
```

with:

```text
Frontend displayed image
```

They must have identical:

```text
width
height
aspect ratio
```

If not:

```text
FRONTEND_IMAGE_TRANSFORMATION_FAILURE
```

---

# 48. Step 28 — Create Diagnostic Report

Create:

```text
diagnostics/diagnostic_report.md
```

Required structure:

```markdown
# FitAI Try-On Diagnostic Report

## 1. Environment

## 2. Input Images

## 3. Pose Detection

## 4. Person Segmentation

## 5. Clothing Segmentation

## 6. Clothing Geometry

## 7. Source/Target Correspondence

## 8. Body Geometry

## 9. Warping

## 10. Occlusion

## 11. Blending

## 12. Frontend/API Integrity

## 13. Quantitative Metrics

## 14. Primary Failure

## 15. Secondary Failure

## 16. Root Cause

## 17. Evidence

## 18. Fix Applied

## 19. Before/After Comparison

## 20. Remaining Limitations

## 21. Recommendation
```

---

# 49. Root Cause Rules

The report MUST distinguish:

```text
OBSERVED FACT
```

from:

```text
HYPOTHESIS
```

Example:

```text
Observed:
The clothing waist is 84 pixels below the detected hip line.

Hypothesis:
The target waist mapping is calculated using the full clothing bounding box.
```

Do not report hypotheses as facts.

---

# 50. Root Cause Example

Good:

```text
PRIMARY FAILURE:
SOURCE_TARGET_CORRESPONDENCE

Evidence:
- Clothing waist points are not generated.
- Warp currently maps clothing bounding-box corners.
- Left and right leg geometry is not represented.
- The final warped image remains rectangular.

Conclusion:
The current warping algorithm does not receive sufficient semantic
control points to deform the pants according to the person's two-leg
structure.
```

Bad:

```text
The AI is bad.
```

or:

```text
MediaPipe is inaccurate.
```

without evidence.

---

# 51. Step 29 — Fix Strategy

After identifying the failure, choose the smallest appropriate fix.

### If POSE_FAILURE

Improve:

```text
landmark validation
coordinate conversion
image preprocessing
```

### If SEGMENTATION_FAILURE

Improve:

```text
mask generation
background removal
mask cleanup
```

### If CLOTHING_GEOMETRY_FAILURE

Implement:

```text
clothing semantic keypoints
```

### If CORRESPONDENCE_FAILURE

Implement:

```text
source → target semantic mapping
```

### If WARP_FAILURE

Improve:

```text
TPS
mesh warp
piece-wise transformation
```

### If OCCLUSION_FAILURE

Improve:

```text
person parsing
foreground masks
layer ordering
```

### If BLENDING_FAILURE

Improve:

```text
alpha
feathering
edge cleanup
```

---

# 52. Step 30 — Do Not Over-Engineer

The Agent should NOT implement all possible techniques.

Do not add:

```text
TPS
Mesh
Perspective
Optical Flow
Diffusion
Segmentation model A
Segmentation model B
```

simultaneously.

Choose the simplest technique that fixes the verified failure.

---

# 53. Step 31 — Determine Whether Geometry Has Reached Its Limit

After fixing verified bugs, rerun the pipeline.

If:

```text
pose correct
segmentation correct
clothing geometry correct
correspondence correct
body geometry correct
warp correct
occlusion correct
blending correct
```

but the result still looks unrealistic:

```text
GEOMETRY_PIPELINE_LIMIT_REACHED
```

This is not necessarily a software bug.

It means the system has reached the limitation of geometry-based compositing.

---

# 54. Geometry Pipeline Limitations

The report should explicitly document limitations such as:

```text
- clothing does not naturally deform around body shape
- texture does not follow body folds
- clothing does not synthesize hidden regions
- lighting is not reconstructed
- occlusion reasoning is limited
- clothing silhouette may remain unrealistic
- body/clothing interaction is not learned
```

---

# 55. When to Move to AI VTON

Only recommend Phase 8 when:

```text
[ ] Pose verified
[ ] Segmentation verified
[ ] Correspondence verified
[ ] Geometry verified
[ ] Warp verified
[ ] Occlusion verified
[ ] Blending verified
```

and:

```text
GEOMETRY_PIPELINE_LIMIT_REACHED
```

is demonstrated.

---

# 56. Phase 8 Readiness Report

If geometry is ready for VTON, add:

```text
diagnostics/vton_readiness.md
```

Example:

```markdown
# VTON Readiness

## Geometry Pipeline

Status: VALIDATED

## Remaining Issue

Photorealistic clothing deformation cannot be achieved reliably
through geometric warping alone.

## Evidence

...

## Recommended Next Step

Integrate an AI VTON provider while keeping the current geometry
provider as a fallback/debug implementation.
```

---

# 57. Required Diagnostic Artifacts

At the end of Phase 7.5 the Agent MUST produce:

```text
diagnostics/
├── repository_analysis.md
├── diagnostic_report.md
├── vton_readiness.md              # only if applicable
│
├── metrics/
│   ├── input.json
│   ├── pose.json
│   ├── person_mask.json
│   ├── clothing_mask.json
│   ├── body_geometry.json
│   ├── mapping.json
│   └── alignment.json
│
└── images/
    ├── 01_input/
    ├── 02_pose/
    ├── 03_person_mask/
    ├── 04_clothing/
    ├── 05_clothing_mask/
    ├── 06_correspondence/
    ├── 07_geometry/
    ├── 08_warp/
    ├── 09_occlusion/
    ├── 10_blending/
    └── 11_final/
```

---

# 58. Acceptance Criteria

Phase 7.5 is NOT complete unless:

```text
[ ] Existing code inspected
[ ] Existing architecture documented
[ ] Coordinate systems documented
[ ] Input images measured
[ ] Pose visualized
[ ] Landmark confidence checked
[ ] Person mask visualized
[ ] Clothing mask visualized
[ ] Clothing bbox measured
[ ] Clothing semantic geometry evaluated
[ ] Source/target correspondence visualized
[ ] Body geometry visualized
[ ] Warp result isolated
[ ] Occlusion isolated
[ ] Blending isolated
[ ] Frontend/API image integrity checked
[ ] Quantitative alignment metrics generated
[ ] Primary failure identified
[ ] Secondary failure identified
[ ] Root cause supported by evidence
[ ] Fix applied only to relevant component
[ ] Regression test completed
[ ] Diagnostic report generated
```

---

# 59. AI Agent Final Response Format

After completing Phase 7.5, the Agent MUST respond using:

```markdown
# Phase 7.5 Result

## Primary Failure

<one category>

## Secondary Failure

<one category or NONE>

## Root Cause

<precise explanation>

## Evidence

- <evidence 1>
- <evidence 2>
- <evidence 3>

## Files Inspected

- ...

## Files Changed

- ...

## Fix Applied

- ...

## Metrics

| Metric | Before | After |
|---|---:|---:|
| Hip alignment error | ... | ... |
| Left leg alignment error | ... | ... |
| Right leg alignment error | ... | ... |

## Diagnostic Images

- ...

## Tests

- ...

## Result

<VALIDATED / PARTIALLY VALIDATED / GEOMETRY_PIPELINE_LIMIT_REACHED>

## Remaining Limitations

- ...

## Next Step

<exact next step>
```

---

# 60. FINAL AGENT PROMPT

The following prompt MUST be followed when executing this document:

```text
You are the senior computer-vision engineer responsible for diagnosing
FitAI's current Geometry Virtual Try-On implementation.

Read PHASE_7_5_DIAGNOSTIC.md completely before changing code.

IMPORTANT:

Do NOT immediately rewrite the Try-On system.

Do NOT immediately integrate CatVTON, IDM-VTON, OOTDiffusion,
StableVITON, or another AI VTON model.

First diagnose the existing Phase 7 implementation.

The current symptom is:

"Clothing does not correctly match the person's body."

Your job is to determine the exact reason.

==================================================
RULE 1 — INSPECT FIRST
==================================================

Inspect the complete existing Try-On implementation.

Find:

- API endpoint
- TryOnService
- PoseDetector
- LandmarkExtractor
- PersonSegmenter
- ClothingSegmenter
- ClothingProcessor
- BodyGeometry
- Warp implementation
- TPS implementation
- Mesh implementation
- Perspective transform
- Occlusion
- Blending
- Frontend integration

Do not assume filenames.

Search the repository.

==================================================
RULE 2 — NO RANDOM TUNING
==================================================

Do NOT randomly modify:

x
y
scale
width
height
offset
rotation

Do not use:

x += 10
y -= 20
scale *= 1.1

unless the diagnostic evidence proves the correction is necessary.

==================================================
RULE 3 — CREATE DIAGNOSTIC ARTIFACTS
==================================================

Generate all diagnostic images and metrics specified in:

PHASE_7_5_DIAGNOSTIC.md

At minimum:

01_original_person
02_pose_landmarks
03_person_mask
04_original_clothing
05_clothing_mask
06_clothing_keypoints
07_source_target_correspondence
08_body_geometry
09_warped_clothing
10_warp_vs_body
11_occlusion
12_blending
13_final

==================================================
RULE 4 — VERIFY COORDINATES
==================================================

Trace every coordinate conversion:

MediaPipe normalized
→ original image
→ resized image
→ cropped image
→ clothing-local coordinates
→ target coordinates
→ output image

Document all transformations.

If a coordinate is used in a different coordinate system
without conversion, classify it as a bug.

==================================================
RULE 5 — VERIFY LEFT/RIGHT
==================================================

Explicitly verify:

LEFT_HIP
RIGHT_HIP
LEFT_KNEE
RIGHT_KNEE
LEFT_ANKLE
RIGHT_ANKLE

against the actual image.

Do not assume the ordering is correct.

==================================================
RULE 6 — VERIFY CLOTHING GEOMETRY
==================================================

Determine whether the clothing image has semantic points.

For pants identify:

waist-left
waist-right
left leg
right leg
left knee
right knee
left ankle
right ankle

If the system only uses:

bounding box
top-left
top-right
bottom-left
bottom-right

report:

CLOTHING_GEOMETRY_INSUFFICIENT

Do not hide this limitation.

==================================================
RULE 7 — VERIFY SOURCE/TARGET CORRESPONDENCE
==================================================

Show exactly how clothing points map to body points.

Example:

clothing waist-left → person left hip
clothing waist-right → person right hip
clothing left knee → person left knee
clothing right knee → person right knee
clothing left ankle → person left ankle
clothing right ankle → person right ankle

If this mapping does not exist, report it.

==================================================
RULE 8 — VERIFY WARP
==================================================

Determine whether the current warp is:

- resize
- affine
- perspective
- TPS
- mesh
- piecewise
- other

Inspect actual implementation.

Do not trust comments or function names.

Verify the actual source and target control points.

==================================================
RULE 9 — VERIFY OUTPUT BEFORE BLENDING
==================================================

Save the warped clothing before blending.

If the clothing is already misaligned here:

PRIMARY FAILURE = WARP / GEOMETRY / CORRESPONDENCE

If warped clothing is correct but final output is wrong:

PRIMARY FAILURE = OCCLUSION / BLENDING

==================================================
RULE 10 — VERIFY FRONTEND LAST
==================================================

Only after AI Service output is verified should you inspect:

Backend
Frontend
CSS
object-fit
aspect ratio
image resizing

Do not blame frontend before verifying the AI output.

==================================================
RULE 11 — FIX ONE ROOT CAUSE AT A TIME
==================================================

After identifying the primary failure:

1. Fix only that component.
2. Run diagnostics again.
3. Compare before/after.
4. Confirm improvement.
5. Then move to the next issue.

==================================================
RULE 12 — DO NOT FAKE SUCCESS
==================================================

If the pipeline still produces a poor result:

Do not return:

success=true

with an unchanged or fake image.

Report the actual failure.

==================================================
RULE 13 — KNOW WHEN GEOMETRY HAS REACHED ITS LIMIT
==================================================

If:

pose = correct
segmentation = correct
clothing geometry = correct
correspondence = correct
body geometry = correct
warp = correct
occlusion = correct
blending = correct

but the result is still not realistic,

classify:

GEOMETRY_PIPELINE_LIMIT_REACHED

This means the next step should be an AI VTON model.

==================================================
RULE 14 — DO NOT OVER-ENGINEER
==================================================

Do not add multiple new algorithms at once.

Do not simultaneously implement:

TPS + Mesh + Optical Flow + Diffusion + multiple segmentation models.

Find the smallest change that fixes the verified problem.

==================================================
FINAL REQUIREMENT
==================================================

At the end, generate:

diagnostics/diagnostic_report.md

and provide:

1. Primary failure
2. Secondary failure
3. Root cause
4. Evidence
5. Files inspected
6. Files changed
7. Fix applied
8. Before/after metrics
9. Diagnostic images
10. Test results
11. Remaining limitations
12. Whether the project is ready for Phase 8 AI VTON

Do not say "fixed" unless the diagnostic evidence demonstrates improvement.
```

---

# 61. Important Implementation Principle

The purpose of this phase is **not to make the output perfect**.

The purpose is to answer one question with evidence:

> **Why is the clothing not matching the body?**

There are only two meaningful outcomes:

```text
Outcome A

A real bug exists.
        ↓
Identify it.
        ↓
Fix it.
        ↓
Validate improvement.
```

or:

```text
Outcome B

All geometry components are correct.
        ↓
Result is still visually unrealistic.
        ↓
Geometry approach has reached its limitation.
        ↓
Proceed to AI VTON.
```

Do not spend many iterations tuning arbitrary coordinates if Outcome B has already been demonstrated.

---

# 62. Recommended Next Phase

If Phase 7.5 produces:

```text
POSE = PASS
SEGMENTATION = PASS
CORRESPONDENCE = PASS
GEOMETRY = PASS
WARP = PASS
OCCLUSION = PASS
BLENDING = PASS
```

but:

```text
VISUAL_REALISM = FAIL
```

then proceed to:

```text
PHASE 8 — AI VIRTUAL TRY-ON
```

while keeping:

```text
GeometryTryOnProvider
```

as a fallback and debugging implementation.

The architecture should remain:

```text
TryOnService
      │
      ├── GeometryTryOnProvider
      │
      └── AIVirtualTryOnProvider
```

The diagnostic pipeline must remain available even after AI VTON is integrated.

```

**Cách dùng:** đặt file này ở root repo, ngay cạnh `PROJECT_SPEC.md`/file spec hiện tại, rồi đưa cho Agent câu: **“Read `PHASE_7_5_DIAGNOSTIC.md` and execute it exactly. Do not skip diagnostic stages or jump to Phase 8.”**

Điểm quan trọng nhất của file này là Agent **bắt buộc phải xuất ảnh `source → target correspondence`, `body geometry`, `warped clothing before blending` và metrics**. Chỉ cần xem 3 ảnh đó là chúng ta thường có thể xác định khá nhanh lỗi nằm ở **mapping, geometry hay warp**, thay vì tiếp tục sửa `x/y/scale` một cách thử-sai.
```
