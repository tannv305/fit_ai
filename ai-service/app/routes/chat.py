from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.services.gemini_service import gemini_service

router = APIRouter()

class ChatGenerationRequest(BaseModel):
    prompt: str
    products: List[Dict[str, Any]] = []
    chat_history: List[Dict[str, str]] = []
    user_preference: Optional[Dict[str, Any]] = None
    weather_info: Optional[Dict[str, Any]] = None
    outfit: Optional[Dict[str, Any]] = None

class ChatGenerationResponse(BaseModel):
    status: str
    reply: str
    metadata: Optional[Dict[str, Any]] = None
    error: Optional[Dict[str, Any]] = None

@router.post("/ai/generate", response_model=ChatGenerationResponse)
def generate_chat_reply(request: ChatGenerationRequest):
    if not request.prompt:
        raise HTTPException(status_code=400, detail="Prompt is required")

    result = gemini_service.generate_fashion_advice(
        prompt=request.prompt,
        products_context=request.products,
        chat_history=request.chat_history,
        user_preference=request.user_preference,
        weather_info=request.weather_info,
        outfit=request.outfit
    )
    if isinstance(result, dict):
        return ChatGenerationResponse(
            status=result.get("status", "SUCCESS"),
            reply=result.get("reply", ""),
            metadata=result.get("metadata"),
            error=result.get("error")
        )
    return ChatGenerationResponse(status="SUCCESS", reply=str(result))

