import os
import time
import random
import logging
import requests
from typing import List, Dict, Any, Optional, Tuple
from app.config import settings

logger = logging.getLogger("gemini_service")
logger.setLevel(logging.INFO)
if not logger.handlers:
    ch = logging.StreamHandler()
    ch.setFormatter(logging.Formatter("[%(asctime)s] %(message)s"))
    logger.addHandler(ch)

RETRYABLE_STATUS_CODES = {429, 500, 502, 503, 504}

class GeminiService:
    def _get_api_key(self) -> str:
        api_key = getattr(settings, "GEMINI_API_KEY", "") or os.getenv("GEMINI_API_KEY", "")
        return api_key

    def _call_model_single_request(
        self,
        model_name: str,
        system_instruction: str,
        timeout: float
    ) -> Tuple[bool, Optional[str], int, Optional[str]]:
        api_key = self._get_api_key()
        if not api_key or api_key.startswith("http"):
            logger.error("[Gemini] API Key missing or invalid format in config")
            return False, None, 401, "API Key missing or invalid format"

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": system_instruction}
                    ]
                }
            ]
        }

        try:
            response = requests.post(url, json=payload, timeout=timeout)
            status_code = response.status_code

            if status_code == 200:
                data = response.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        text = parts[0].get("text", "")
                        return True, text, 200, None
                return False, None, 200, "Empty response structure from Gemini API"
            else:
                # Do NOT log API key or full sensitive header info
                error_snippet = response.text[:200] if response.text else "No response body"
                return False, None, status_code, f"HTTP {status_code}: {error_snippet}"

        except requests.exceptions.Timeout:
            return False, None, 504, "Request timeout"
        except requests.exceptions.RequestException as e:
            return False, None, 503, f"Network request exception: {type(e).__name__}"

    def _execute_model_with_retry(
        self,
        model_name: str,
        system_instruction: str,
        max_retries: int,
        base_delay_ms: int,
        timeout: float,
        is_fallback: bool = False
    ) -> Tuple[bool, Optional[str], int, Optional[str]]:

        total_attempts = max_retries + 1
        last_status_code = 503
        last_error_msg = "All retry attempts failed"

        for attempt in range(total_attempts):
            attempt_num = attempt + 1
            logger.info(
                f"[Gemini] Request started | Model: {model_name} | "
                f"{'Fallback ' if is_fallback else ''}Attempt: {attempt_num}/{total_attempts}"
            )

            success, text, status_code, err_msg = self._call_model_single_request(
                model_name, system_instruction, timeout
            )

            if success:
                if is_fallback:
                    logger.info(f"[Gemini] Fallback model ({model_name}) succeeded.")
                else:
                    logger.info(f"[Gemini] Model ({model_name}) request succeeded.")
                return True, text, status_code, None

            last_status_code = status_code
            last_error_msg = err_msg

            if status_code in RETRYABLE_STATUS_CODES:
                if attempt < max_retries:
                    # Exponential backoff: base_delay * 2^attempt + jitter
                    exp_delay_sec = (base_delay_ms / 1000.0) * (2 ** attempt)
                    jitter_sec = random.uniform(0.0, 1.0)
                    total_delay = exp_delay_sec + jitter_sec

                    logger.warning(
                        f"[Gemini] HTTP {status_code} - Service Unavailable | "
                        f"Model: {model_name} | Retry attempt: {attempt_num}/{max_retries} | "
                        f"Waiting: {total_delay:.2f} seconds"
                    )
                    time.sleep(total_delay)
                    continue
                else:
                    logger.error(
                        f"[Gemini] Primary model ({model_name}) failed after {max_retries} retries."
                        if not is_fallback else
                        f"[Gemini] Fallback model ({model_name}) failed after {max_retries} retries."
                    )
            else:
                logger.error(
                    f"[Gemini] Non-retryable HTTP {status_code} error on model ({model_name}): {err_msg}"
                )
                break

        return False, None, last_status_code, last_error_msg

    def generate_fashion_advice(
        self,
        prompt: str,
        products_context: List[Dict[str, Any]],
        chat_history: Optional[List[Dict[str, str]]] = None,
        user_preference: Optional[Dict[str, Any]] = None,
        weather_info: Optional[Dict[str, Any]] = None,
        outfit: Optional[Dict[str, Any]] = None,
        product_detail: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        api_key = self._get_api_key()
        if not api_key or api_key.startswith("http"):
            logger.error("[Gemini] GEMINI_API_KEY is not configured properly.")
            return {
                "status": "ERROR",
                "reply": "Chưa cấu hình chính xác GEMINI_API_KEY trong file .env.",
                "error": {
                    "code": "MISSING_API_KEY",
                    "message": "GEMINI_API_KEY is not configured.",
                    "retryable": False
                }
            }

        # Build user preferences text
        pref_text = ""
        if user_preference:
            pref_parts = []
            if user_preference.get("gender"): pref_parts.append(f"Giới tính: {user_preference['gender']}")
            if user_preference.get("preferredStyle"): pref_parts.append(f"Phong cách thích: {user_preference['preferredStyle']}")
            if user_preference.get("preferredColors"): pref_parts.append(f"Màu ưa thích: {user_preference['preferredColors']}")
            if user_preference.get("preferredBudget"): pref_parts.append(f"Ngân sách: {user_preference['preferredBudget']} VNĐ")
            if pref_parts:
                pref_text = "THÔNG TIN GU THỜI TRANG CÁ NHÂN CỦA KHÁCH HÀNG:\n- " + "\n- ".join(pref_parts) + "\n\n"

        # Build weather info text
        weather_text = ""
        if weather_info:
            weather_text = (
                f"THÔNG TIN THỜI TIẾT THỰC TẾ ({weather_info.get('location', 'Địa phương')}):\n"
                f"- Nhiệt độ: {weather_info.get('temperature')}°C | Tình trạng: {weather_info.get('condition')}\n"
                f"- Tỷ lệ mưa: {weather_info.get('rainProbability')}%\n"
                f"- Lời khuyên thời tiết: {weather_info.get('clothingAdvice')}\n\n"
            )

        # Build Product Detail Inquiry Context
        detail_text = ""
        if product_detail:
            detail_text = (
                f"THÔNG TIN CHI TIẾT SẢN PHẨM TRUY VẤN (TỪ CƠ SỞ DỮ LIỆU THỰC TẾ):\n"
                f"- Tên sản phẩm: {product_detail.get('productName')}\n"
                f"- Giá: {product_detail.get('price')} VNĐ | Danh mục: {product_detail.get('categoryName')}\n"
                f"- Chất liệu: {product_detail.get('material')}\n"
                f"- Mô tả: {product_detail.get('description')}\n"
                f"- Thuộc tính hỏi: {product_detail.get('requestedAttribute')}\n"
                f"- Size khả dụng: {product_detail.get('availableSizes')}\n"
                f"- Màu sắc: {product_detail.get('availableColors')}\n"
                f"- Tổng kho: {product_detail.get('totalStock')}\n"
                f"- Tóm tắt câu trả lời: {product_detail.get('answerSummary')}\n\n"
            )

        # Build Outfit Composition Context
        outfit_text = ""
        if outfit:
            outfit_text = (
                f"BỘ OUTFIT ĐÃ ĐƯỢC HỆ THỐNG GHÉP VÀ KIỂM TRA NGÂN SÁCH CHUẨN:\n"
                f"- Tên outfit: {outfit.get('name')}\n"
                f"- Tổng giá trị: {outfit.get('totalPrice')} VNĐ (Đảm bảo nằm trong ngân sách!)\n"
                f"- Lý do ghép: {outfit.get('reason')}\n"
                f"- Danh sách món đồ trong outfit:\n"
            )
            for p in outfit.get("products", []):
                outfit_text += f"  + [{p.get('categoryName', 'Món đồ')}] {p.get('name')} (Giá: {p.get('price')} VNĐ)\n"
            outfit_text += "\n"

        # Build chat history text (last 6 messages)
        history_text = ""
        if chat_history:
            recent_msgs = chat_history[-6:]
            history_lines = [f"{msg.get('role', 'USER')}: {msg.get('content', '')}" for msg in recent_msgs]
            history_text = "LỊCH SỬ HỘI THOẠI GẦN ĐÂY:\n" + "\n".join(history_lines) + "\n\n"

        # Build products context
        products_text = ""
        if products_context:
            products_text = "DANH SÁCH SẢN PHẨM THỰC TẾ TRONG KHO HÀNG:\n"
            for p in products_context:
                products_text += f"- ID {p.get('id')}: {p.get('name')} | Giá: {p.get('price')} VNĐ | Danh mục: {p.get('categoryName')} | Phong cách: {p.get('style', 'N/A')}\n"
        else:
            products_text = "Hiện tại không có sản phẩm nào khớp trong kho."

        system_instruction = (
            "Bạn là MIA, trợ lý thời trang 2D tư vấn thời trang cho cửa hàng AI Fashion Shop.\n"
            "Nhiệm vụ của bạn là phân tích yêu cầu của người dùng và đưa ra câu trả lời tư vấn phù hợp nhất.\n\n"
            "Quy tắc phân loại hành động:\n"
            "1. BUILD_OUTFIT (Phối đồ): Giải thích chi tiết lý do phối 'BỘ OUTFIT ĐÃ GHÉP' (thời tiết, ngân sách, sự kiện).\n"
            "2. SEARCH_PRODUCTS (Tìm kiếm): Giới thiệu ngắn gọn các sản phẩm đơn lẻ từ 'DANH SÁCH SẢN PHẨM THỰC TẾ TRONG KHO HÀNG'.\n"
            "3. GET_PRODUCT_INFO (Hỏi chi tiết): Trả lời chính xác về Size/Chất liệu/Màu sắc/Kho hàng từ 'THÔNG TIN CHI TIẾT SẢN PHẨM TRUY VẤN'.\n"
            "4. TEXT_ONLY (Giao tiếp): Trả lời ngắn gọn, thân thiện bằng tư cách MIA 2D Stylist và sẵn sàng gợi ý tư vấn.\n\n"
            "QUY TẮC TUYỆT ĐỐI:\n"
            "1. CHỈ ĐƯỢC GỢI Ý các sản phẩm có trong dữ liệu kho hàng được cấp.\n"
            "2. KHÔNG ĐƯỢC BỊA ĐẶT hay tự sáng tạo ra sản phẩm không có trong danh sách.\n"
            "3. Trả lời thân thiện, lịch sự và tự nhiên bằng tiếng Việt.\n\n"
            f"{pref_text}"
            f"{weather_text}"
            f"{detail_text}"
            f"{outfit_text}"
            f"{history_text}"
            f"{products_text}\n\n"
            f"Câu hỏi của người dùng: \"{prompt}\""
        )

        primary_model = getattr(settings, "GEMINI_PRIMARY_MODEL", None) or os.getenv("GEMINI_PRIMARY_MODEL", "gemini-1.5-flash")
        fallback_model = getattr(settings, "GEMINI_FALLBACK_MODEL", None) or os.getenv("GEMINI_FALLBACK_MODEL", "gemini-1.5-pro")
        max_retries = getattr(settings, "GEMINI_MAX_RETRIES", 3)
        base_delay_ms = getattr(settings, "GEMINI_BASE_DELAY_MS", 2000)
        timeout = getattr(settings, "GEMINI_TIMEOUT_SECONDS", 30.0)

        # 1. Primary Model Attempt with Retries
        success, text, status_code, err_msg = self._execute_model_with_retry(
            model_name=primary_model,
            system_instruction=system_instruction,
            max_retries=max_retries,
            base_delay_ms=base_delay_ms,
            timeout=timeout,
            is_fallback=False
        )

        if success and text is not None:
            return {
                "status": "SUCCESS",
                "reply": text,
                "metadata": {
                    "provider": "gemini",
                    "fallbackUsed": False
                }
            }

        # 2. Fallback Model Attempt (if configured and different from primary model)
        if fallback_model and fallback_model.strip() and fallback_model != primary_model:
            logger.warning(
                f"[Gemini] Primary model failed after {max_retries} retries. Switching to fallback model: {fallback_model}"
            )
            fb_success, fb_text, fb_status_code, fb_err_msg = self._execute_model_with_retry(
                model_name=fallback_model,
                system_instruction=system_instruction,
                max_retries=1,
                base_delay_ms=base_delay_ms,
                timeout=timeout,
                is_fallback=True
            )

            if fb_success and fb_text is not None:
                return {
                    "status": "SUCCESS",
                    "reply": fb_text,
                    "metadata": {
                        "provider": "gemini",
                        "fallbackUsed": True
                    }
                }

        logger.error("[Gemini] All Gemini attempts failed.")
        return {
            "status": "ERROR",
            "reply": "Hệ thống AI hiện đang bận hoặc tạm thời không khả dụng. Vui lòng thử lại sau.",
            "error": {
                "code": "AI_SERVICE_UNAVAILABLE",
                "message": "AI service is temporarily unavailable. Please try again later.",
                "retryable": status_code in RETRYABLE_STATUS_CODES
            }
        }

gemini_service = GeminiService()