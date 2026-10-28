import pytest
from unittest.mock import patch, MagicMock
from app.services.gemini_service import GeminiService

@pytest.fixture
def gemini_svc():
    svc = GeminiService()
    with patch.object(svc, "_get_api_key", return_value="dummy_test_api_key_123"):
        yield svc


def test_gemini_primary_success(gemini_svc):
    with patch("requests.post") as mock_post:
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "candidates": [
                {"content": {"parts": [{"text": "Bạn nên chọn áo sơ mi trắng phối với quần tây."}]}}
            ]
        }
        mock_post.return_value = mock_resp

        result = gemini_svc.generate_fashion_advice("Tư vấn áo sơ mi", [])

        assert result["status"] == "SUCCESS"
        assert "áo sơ mi trắng" in result["reply"]
        assert result["metadata"]["fallbackUsed"] is False
        assert mock_post.call_count == 1

def test_gemini_retry_503_then_success(gemini_svc):
    with patch("requests.post") as mock_post, patch("time.sleep") as mock_sleep:
        resp_503 = MagicMock()
        resp_503.status_code = 503
        resp_503.text = "Service Unavailable - High Demand"

        resp_200 = MagicMock()
        resp_200.status_code = 200
        resp_200.json.return_value = {
            "candidates": [
                {"content": {"parts": [{"text": "Gợi ý trang phục sau khi retry thành công."}]}}
            ]
        }

        # First call: 503, Second call: 200
        mock_post.side_effect = [resp_503, resp_200]

        result = gemini_svc.generate_fashion_advice("Tư vấn outfit", [])

        assert result["status"] == "SUCCESS"
        assert result["reply"] == "Gợi ý trang phục sau khi retry thành công."
        assert result["metadata"]["fallbackUsed"] is False
        assert mock_post.call_count == 2
        assert mock_sleep.call_count == 1

def test_gemini_primary_fails_then_fallback_succeeds(gemini_svc):
    with patch("requests.post") as mock_post, patch("time.sleep") as mock_sleep:
        resp_503 = MagicMock()
        resp_503.status_code = 503
        resp_503.text = "Service Unavailable"

        resp_200 = MagicMock()
        resp_200.status_code = 200
        resp_200.json.return_value = {
            "candidates": [
                {"content": {"parts": [{"text": "Phản hồi từ Fallback Model"}]}}
            ]
        }

        # Primary model retries 4 times (1 attempt + 3 retries), then fallback succeeds on 1st call
        mock_post.side_effect = [resp_503, resp_503, resp_503, resp_503, resp_200]

        result = gemini_svc.generate_fashion_advice("Phối đồ đi tiệc", [])

        assert result["status"] == "SUCCESS"
        assert result["reply"] == "Phản hồi từ Fallback Model"
        assert result["metadata"]["fallbackUsed"] is True

def test_gemini_non_retryable_401(gemini_svc):
    with patch("requests.post") as mock_post, patch("time.sleep") as mock_sleep:
        resp_401 = MagicMock()
        resp_401.status_code = 401
        resp_401.text = "API key not valid"

        mock_post.return_value = resp_401

        result = gemini_svc.generate_fashion_advice("Tư vấn áo thun", [])

        assert result["status"] == "ERROR"
        assert result["error"]["code"] == "AI_SERVICE_UNAVAILABLE"
        # Non-retryable HTTP 401 should immediately fail without retry sleeps
        assert mock_sleep.call_count == 0

def test_gemini_all_attempts_failed(gemini_svc):
    with patch("requests.post") as mock_post, patch("time.sleep") as mock_sleep:
        resp_503 = MagicMock()
        resp_503.status_code = 503
        resp_503.text = "503 Unavailable"

        mock_post.return_value = resp_503

        result = gemini_svc.generate_fashion_advice("Tư vấn quần jean", [])

        assert result["status"] == "ERROR"
        assert result["error"]["code"] == "AI_SERVICE_UNAVAILABLE"
        assert result["error"]["retryable"] is True
