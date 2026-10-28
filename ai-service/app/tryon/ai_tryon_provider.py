from PIL import Image
import logging
from typing import Tuple, Dict, Any, Optional
from app.tryon.tryon_provider import TryOnProvider
from app.tryon.geometry_tryon_provider import geometry_tryon_provider

logger = logging.getLogger("ai_tryon_provider")

class AIVirtualTryOnProvider(TryOnProvider):
    def generate(
        self,
        person_pil: Image.Image,
        clothing_pil: Image.Image,
        clothing_category: str = "TOP"
    ) -> Tuple[bool, Optional[Image.Image], Optional[Dict[str, Any]]]:

        logger.info("[AIVirtualTryOnProvider] Attempting AI VTON model inference...")
        
        # If AI VTON model is not loaded or configured, fallback gracefully to GeometryTryOnProvider
        logger.warning("[AIVirtualTryOnProvider] AI VTON model unconfigured. Falling back to GeometryTryOnProvider.")
        return geometry_tryon_provider.generate(person_pil, clothing_pil, clothing_category)

ai_tryon_provider = AIVirtualTryOnProvider()
