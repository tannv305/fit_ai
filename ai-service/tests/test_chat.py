from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

from unittest.mock import patch

def test_chat_generation_endpoint():
    mock_return = {
        "status": "SUCCESS",
        "reply": "Bạn có thể tham khảo Áo Sơ Mi Trắng Premium giá 350,000 VNĐ.",
        "metadata": {"provider": "gemini", "fallbackUsed": False}
    }
    with patch("app.routes.chat.gemini_service.generate_fashion_advice", return_value=mock_return):
        response = client.post(
            "/api/v1/ai/generate",
            json={
                "prompt": "Tôi cần áo sơ mi nam trắng dưới 500k",
                "products": [
                    {"id": 1, "name": "Áo Sơ Mi Trắng Premium", "price": 350000, "categoryName": "Áo", "style": "FORMAL"}
                ]
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "SUCCESS"
        assert "reply" in data

