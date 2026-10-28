import io
from PIL import Image
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def create_test_image():
    file = io.BytesIO()
    image = Image.new('RGB', (100, 100), color='red')
    image.save(file, 'jpeg')
    file.seek(0)
    return file

def test_detect_pose():
    img = create_test_image()
    response = client.post(
        "/api/v1/pose/detect",
        files={"image": ("test.jpg", img, "image/jpeg")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert data["detected"] is True
    assert len(data["landmarks"]) > 0

def test_virtual_tryon():
    person_img = create_test_image()
    clothing_img = create_test_image()

    response = client.post(
        "/api/v1/try-on",
        files={
            "personImage": ("person.jpg", person_img, "image/jpeg"),
            "clothingImage": ("clothing.jpg", clothing_img, "image/jpeg")
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "COMPLETED"
    assert "resultImageUrl" in data
    assert data["resultImageUrl"].startswith("data:image/jpeg;base64,")
