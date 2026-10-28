from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.pose_service import pose_service
from app.schemas.pose import PoseDetectionResponse

router = APIRouter()

@router.post("/pose/detect", response_model=PoseDetectionResponse)
async def detect_pose(image: UploadFile = File(...)):
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image")
    
    contents = await image.read()
    return pose_service.detect_pose(contents)
