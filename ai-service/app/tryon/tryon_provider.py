from abc import ABC, abstractmethod
from PIL import Image
from typing import Dict, Any, Tuple, Optional

class TryOnProvider(ABC):
    @abstractmethod
    def generate(
        self,
        person_pil: Image.Image,
        clothing_pil: Image.Image,
        clothing_category: str = "TOP"
    ) -> Tuple[bool, Optional[Image.Image], Optional[Dict[str, Any]]]:
        """
        Generates virtual try-on image.
        Returns (success: bool, result_pil: Optional[Image.Image], error_dict: Optional[Dict])
        """
        pass
