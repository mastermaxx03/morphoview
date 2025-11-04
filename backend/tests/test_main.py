import requests
import uvicorn
from multiprocessing import Process
import time
import os
from backend.main import app

def run_server():
    uvicorn.run(app, host="0.0.0.0", port=8000)

def setup_module(module):
    proc = Process(target=run_server, daemon=True)
    proc.start()
    time.sleep(5)

def teardown_module(module):
    os.system("kill $(lsof -t -i:8000)")

def create_test_slide():
    with open("backend/tests/test_image.png", "wb") as f:
        f.write(os.urandom(1024))
    with open("backend/tests/test_image.png", "rb") as f:
        response = requests.post("http://localhost:8000/upload", files={"file": f})
    os.remove("backend/tests/test_image.png")
    return response.json()

def delete_test_slide(file_id):
    requests.delete(f"http://localhost:8000/upload/{file_id}")

def test_root():
    response = requests.get("http://localhost:8000/")
    assert response.status_code == 200
    assert response.json() == {"message": "MorphoView backend is running!"}

def test_upload_slide():
    data = create_test_slide()
    assert "file_id" in data
    assert "filename" in data
    assert "saved_as" in data
    delete_test_slide(data["file_id"])

def test_list_slides():
    data = create_test_slide()
    response = requests.get("http://localhost:8000/slides")
    assert response.status_code == 200
    assert data["saved_as"] in response.json()["slides"]
    delete_test_slide(data["file_id"])

def test_metadata_endpoints():
    data = create_test_slide()
    file_id = data["file_id"]

    # Update metadata
    metadata = {"priority": "high", "status": "processing"}
    response = requests.post(f"http://localhost:8000/slides/{file_id}/metadata", json=metadata)
    assert response.status_code == 200
    assert response.json()["success"] == True

    # Get metadata
    response = requests.get(f"http://localhost:8000/slides/{file_id}/metadata")
    assert response.status_code == 200
    retrieved_metadata = response.json()
    assert retrieved_metadata["priority"] == "high"
    assert retrieved_metadata["status"] == "processing"

    # Get all metadata
    response = requests.get("http://localhost:8000/slides/metadata/all")
    assert response.status_code == 200
    all_metadata = response.json()
    assert file_id in all_metadata

    delete_test_slide(file_id)

def test_delete_slide():
    data = create_test_slide()
    file_id = data["file_id"]

    response = requests.delete(f"http://localhost:8000/upload/{file_id}")
    assert response.status_code == 200
    assert response.json()["success"] == True

    response = requests.get("http://localhost:8000/slides")
    assert data["saved_as"] not in response.json()["slides"]
