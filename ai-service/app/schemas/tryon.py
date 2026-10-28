from pydantic import BaseModel
from typing import Optional, Dict, Any

class TryOnResponse(BaseModel):
    status: str
    resultImageUrl: Optional[str] = None
    provider: Optional[str] = "geometry"
    errorMessage: Optional[str] = None
    error: Optional[Dict[str, Any]] = None
