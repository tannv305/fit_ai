import os
import io
import base64
import logging
from PIL import Image
from typing import Optional

from app.schemas.tryon import TryOnResponse
from app.tryon.geometry_tryon_provider import geometry_tryon_provider
from app.tryon.ai_tryon_provider import ai_tryon_provider

logger = logging.getLogger("tryon_service")

class TryOnService:
    def process_tryon(
        self,
        person_bytes: bytes,
        clothing_bytes: bytes,
        clothing_category: str = "TOP"
    ) -> TryOnResponse:

        try:
            person_img = Image.open(io.BytesIO(person_bytes)).convert("RGB")
            clothing_img = Image.open(io.BytesIO(clothing_bytes)).convert("RGBA")
        except Exception as e:
            logger.error(f"[TryOnService] Failed to decode image bytes: {e}")
            return TryOnResponse(
                status="FAILED",
                errorMessage="Invalid image format.",
                error={
                    "code": "INVALID_IMAGE_FORMAT",
                    "message": "Unable to decode uploaded person or clothing image."
                }
            )

        provider_mode = os.getenv("TRYON_PROVIDER", "geometry").lower()

        if provider_mode == "ai":
            provider = ai_tryon_provider
            provider_name = "ai"
        elif provider_mode == "auto":
            # Try AI first, fallback to Geometry if it fails
            provider = ai_tryon_provider
            provider_name = "auto"
        else:
            provider = geometry_tryon_provider
            provider_name = "geometry"

        logger.info(f"[TryOnService] Invoking TryOnProvider ({provider_name}) for category '{clothing_category}'")

        success, result_pil, error_info = provider.generate(person_img, clothing_img, clothing_category)

        if not success or result_pil is None:
            err_code = error_info.get("code", "TRYON_FAILED") if error_info else "TRYON_FAILED"
            err_msg = error_info.get("message", "Unable to generate virtual try-on result.") if error_info else "Unable to generate virtual try-on result."

            return TryOnResponse(
                status="FAILED",
                errorMessage=err_msg,
                error={
                    "code": err_code,
                    "message": err_msg
                }
            )

        # Convert result image to JPEG base64 Data URL
        buffered = io.BytesIO()
        result_pil.convert("RGB").save(buffered, format="JPEG", quality=92)
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        data_url = f"data:image/jpeg;base64,{img_str}"

        return TryOnResponse(
            status="COMPLETED",
            resultImageUrl=data_url,
            provider=provider_name
        )

tryon_service = TryOnService()
