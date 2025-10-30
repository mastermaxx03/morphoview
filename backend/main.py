from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import uuid

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Serve uploaded files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.post("/upload")
async def upload_slide(file: UploadFile = File(...)):
    # Generate unique ID
    file_id = str(uuid.uuid4())
    file_extension = os.path.splitext(file.filename)[1]
    saved_filename = f"{file_id}{file_extension}"
    
    file_path = os.path.join(UPLOAD_FOLDER, saved_filename)
    with open(file_path, "wb") as f:
        f.write(await file.read())
    
    return {
        "file_id": file_id,
        "filename": file.filename,
        "saved_as": saved_filename,  # Frontend needs this
    }

@app.get("/slides")
async def list_slides():
    slides = os.listdir(UPLOAD_FOLDER)
    return {"slides": slides}

@app.get("/")
async def root():
    return {"message": "MorphoView backend is running!"}
@app.delete("/upload/{file_id}")
async def delete_slide(file_id: str):
    try:
        # Find file with this ID
        for file in os.listdir(UPLOAD_FOLDER):
            if file.startswith(file_id):
                file_path = os.path.join(UPLOAD_FOLDER, file)
                os.remove(file_path)
                return {"success": True, "message": f"Deleted {file}"}
        
        return {"success": False, "message": "File not found"}
    except Exception as e:
        return {"success": False, "message": str(e)}
