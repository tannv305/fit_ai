from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
from app.services.tryon_service import tryon_service
from app.schemas.tryon import TryOnResponse

router = APIRouter()

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}

def validate_image_file(file: UploadFile):
    filename = file.filename or ""
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    if ext and ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File extension .{ext} is not allowed.")
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be a valid image.")

@router.post("/try-on", response_model=TryOnResponse)
async def process_tryon(
    personImage: UploadFile = File(...),
    clothingImage: UploadFile = File(...),
    clothingCategory: Optional[str] = Form("TOP")
):
    validate_image_file(personImage)
    validate_image_file(clothingImage)

    person_bytes = await personImage.read()
    clothing_bytes = await clothingImage.read()

    return tryon_service.process_tryon(person_bytes, clothing_bytes, clothingCategory)
