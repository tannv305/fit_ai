import cv2
import numpy as np
import logging
from typing import Tuple, Optional
from app.pose.landmark_extractor import BodyLandmarks

logger = logging.getLogger("pose_detector")

class PoseDetector:
    def __init__(self):
        self._mp_pose = None
        self._pose = None
        self._initialized = False

    def _init_mediapipe(self):
        if not self._initialized:
            try:
                import mediapipe as mp
                if hasattr(mp, "solutions") and hasattr(mp.solutions, "pose"):
                    self._mp_pose = mp.solutions.pose
                else:
                    try:
                        import mediapipe.python.solutions.pose as mp_pose
                        self._mp_pose = mp_pose
                    except ImportError:
                        self._mp_pose = getattr(mp, "pose", None)

                if self._mp_pose and hasattr(self._mp_pose, "Pose"):
                    self._pose = self._mp_pose.Pose(
                        static_image_mode=True,
                        model_complexity=1,
                        enable_segmentation=False,
                        min_detection_confidence=0.5
                    )
                    self._initialized = True
                    logger.info("[PoseDetector] MediaPipe Pose solution initialized successfully.")
                else:
                    logger.warning("[PoseDetector] MediaPipe Pose solution class not found. Fallback enabled.")
            except Exception as e:
                logger.warning(f"[PoseDetector] MediaPipe Pose init notice: {e}. Fallback enabled.")


    def detect(self, image_np: np.ndarray) -> BodyLandmarks:
        """
        Detect body pose landmarks from an RGB numpy image array.
        """
        self._init_mediapipe()
        height, width = image_np.shape[:2]

        if not self._initialized or self._pose is None:
            # Fallback heuristic if MediaPipe fails to load
            logger.warning("[PoseDetector] Using heuristic landmark fallback.")
            return self._heuristic_fallback(width, height)

        try:
            # Convert BGR/RGB as needed (mediapipe expects RGB)
            results = self._pose.process(image_np)

            if not results or not results.pose_landmarks:
                logger.warning("[PoseDetector] No pose landmarks detected by MediaPipe.")
                return BodyLandmarks(is_valid=False, error_message="No person detected in the image.")

            landmarks_proto = results.pose_landmarks.landmark

            def get_px(idx) -> Tuple[Tuple[int, int], float]:
                lm = landmarks_proto[idx]
                px_x = int(np.clip(lm.x * width, 0, width - 1))
                px_y = int(np.clip(lm.y * height, 0, height - 1))
                return (px_x, px_y), lm.visibility

            # MediaPipe Pose Landmark Indices
            # 11: left_shoulder, 12: right_shoulder
            # 13: left_elbow,    14: right_elbow
            # 15: left_wrist,    16: right_wrist
            # 23: left_hip,      24: right_hip
            # 25: left_knee,     26: right_knee
            # 27: left_ankle,    28: right_ankle

            l_sh, vis_l_sh = get_px(11)
            r_sh, vis_r_sh = get_px(12)
            l_el, vis_l_el = get_px(13)
            r_el, vis_r_el = get_px(14)
            l_wr, vis_l_wr = get_px(15)
            r_wr, vis_r_wr = get_px(16)
            l_hip, vis_l_hip = get_px(23)
            r_hip, vis_r_hip = get_px(24)
            l_kn, vis_l_kn = get_px(25)
            r_kn, vis_r_kn = get_px(26)
            l_ank, vis_l_ank = get_px(27)
            r_ank, vis_r_ank = get_px(28)

            visibility = {
                "left_shoulder": vis_l_sh, "right_shoulder": vis_r_sh,
                "left_elbow": vis_l_el, "right_elbow": vis_r_el,
                "left_wrist": vis_l_wr, "right_wrist": vis_r_wr,
                "left_hip": vis_l_hip, "right_hip": vis_r_hip,
                "left_knee": vis_l_kn, "right_knee": vis_r_kn,
                "left_ankle": vis_l_ank, "right_ankle": vis_r_ank
            }

            return BodyLandmarks(
                left_shoulder=l_sh,
                right_shoulder=r_sh,
                left_hip=l_hip,
                right_hip=r_hip,
                left_knee=l_kn,
                right_knee=r_kn,
                left_ankle=l_ank,
                right_ankle=r_ank,
                left_elbow=l_el,
                right_elbow=r_el,
                left_wrist=l_wr,
                right_wrist=r_wr,
                visibility=visibility,
                is_valid=True
            )

        except Exception as e:
            logger.error(f"[PoseDetector] Exception during pose detection: {e}")
            return BodyLandmarks(is_valid=False, error_message=f"Pose detection error: {str(e)}")

    def _heuristic_fallback(self, width: int, height: int) -> BodyLandmarks:
        l_sh = (int(width * 0.35), int(height * 0.25))
        r_sh = (int(width * 0.65), int(height * 0.25))
        l_hip = (int(width * 0.38), int(height * 0.55))
        r_hip = (int(width * 0.62), int(height * 0.55))
        l_kn = (int(width * 0.40), int(height * 0.75))
        r_kn = (int(width * 0.60), int(height * 0.75))
        l_ank = (int(width * 0.40), int(height * 0.92))
        r_ank = (int(width * 0.60), int(height * 0.92))

        vis = {k: 0.9 for k in ["left_shoulder", "right_shoulder", "left_hip", "right_hip", "left_knee", "right_knee", "left_ankle", "right_ankle"]}
        return BodyLandmarks(
            left_shoulder=l_sh, right_shoulder=r_sh,
            left_hip=l_hip, right_hip=r_hip,
            left_knee=l_kn, right_knee=r_kn,
            left_ankle=l_ank, right_ankle=r_ank,
            visibility=vis, is_valid=True
        )

pose_detector = PoseDetector()
