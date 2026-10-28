import cv2
import numpy as np
from PIL import Image
import io
from app.schemas.pose import Landmark, PoseDetectionResponse
from app.pose.pose_detector import pose_detector

class PoseService:
    @staticmethod
    def detect_pose(image_bytes: bytes) -> PoseDetectionResponse:
        try:
            pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            img_np = np.array(pil_img)

            body_lm = pose_detector.detect(img_np)
            if not body_lm.is_valid:
                return PoseDetectionResponse(
                    status="ERROR",
                    detected=False,
                    landmarks=[]
                )

            landmarks = []
            for name in [
                "left_shoulder", "right_shoulder", "left_elbow", "right_elbow",
                "left_wrist", "right_wrist", "left_hip", "right_hip",
                "left_knee", "right_knee", "left_ankle", "right_ankle"
            ]:
                pt = getattr(body_lm, name, (0, 0))
                vis = body_lm.visibility.get(name, 0.0)
                h, w = img_np.shape[:2]
                norm_x = pt[0] / max(w, 1)
                norm_y = pt[1] / max(h, 1)
                landmarks.append(Landmark(name=name, x=norm_x, y=norm_y, z=0.0))

            return PoseDetectionResponse(
                status="SUCCESS",
                detected=True,
                landmarks=landmarks
            )
        except Exception as e:
            return PoseDetectionResponse(
                status="ERROR",
                detected=False,
                landmarks=[]
            )

pose_service = PoseService()
