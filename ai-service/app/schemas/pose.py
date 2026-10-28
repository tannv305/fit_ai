from pydantic import BaseModel
from typing import List, Optional

class Landmark(BaseModel):
    name: str
    x: float
    y: float
    z: float
    visibility: Optional[float] = 1.0

class PoseDetectionResponse(BaseModel):
    status: str
    detected: bool
    landmarks: List[Landmark]
