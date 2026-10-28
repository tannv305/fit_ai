from dataclasses import dataclass, field
from typing import Tuple, Dict, Optional

MIN_VISIBILITY = 0.4

@dataclass
class BodyLandmarks:
    left_shoulder: Tuple[int, int] = (0, 0)
    right_shoulder: Tuple[int, int] = (0, 0)
    left_hip: Tuple[int, int] = (0, 0)
    right_hip: Tuple[int, int] = (0, 0)
    left_knee: Tuple[int, int] = (0, 0)
    right_knee: Tuple[int, int] = (0, 0)
    left_ankle: Tuple[int, int] = (0, 0)
    right_ankle: Tuple[int, int] = (0, 0)
    left_elbow: Tuple[int, int] = (0, 0)
    right_elbow: Tuple[int, int] = (0, 0)
    left_wrist: Tuple[int, int] = (0, 0)
    right_wrist: Tuple[int, int] = (0, 0)
    
    visibility: Dict[str, float] = field(default_factory=dict)
    is_valid: bool = False
    error_message: Optional[str] = None

    def validate_for_category(self, category: str) -> Tuple[bool, Optional[str]]:
        category_upper = category.upper()
        
        # Mandatory landmarks check based on clothing category
        if category_upper in ["TOP", "SHIRT", "OUTERWEAR", "JACKET"]:
            required = ["left_shoulder", "right_shoulder", "left_hip", "right_hip"]
        elif category_upper in ["BOTTOM", "PANTS", "SHORTS", "SKIRT"]:
            required = ["left_hip", "right_hip", "left_knee", "right_knee"]
        elif category_upper in ["DRESS", "FULL"]:
            required = ["left_shoulder", "right_shoulder", "left_hip", "right_hip", "left_knee", "right_knee"]
        else:
            required = ["left_shoulder", "right_shoulder", "left_hip", "right_hip"]

        for name in required:
            vis = self.visibility.get(name, 0.0)
            if vis < MIN_VISIBILITY:
                return False, f"Body landmark '{name}' has low visibility ({vis:.2f} < {MIN_VISIBILITY}). Please upload a clear full-body photo."

        return True, None
