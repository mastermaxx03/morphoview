from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import uuid
import json
from pathlib import Path
import time
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
METADATA_FILE = "slides_metadata.json"
def load_metadata():
    if not os.path.exists(METADATA_FILE):
        return {}
    with open(METADATA_FILE, "r") as f:
        return json.load(f)
def save_metadata(metadata):
    with open(METADATA_FILE, "w") as f:
        json.dump(metadata, f, indent=2)    

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
# Additional endpoints for managing metadata
@app.post("/slides/{file_id}/metadata")
async def update_metadata(file_id: str, priority: str="normal" ,status: str="queued"):
    """update slide metadata (priority,status)"""
    try :
        metadata=load_metadata()
        if file_id not in metadata:
            metadata[file_id]={}
        metadata[file_id]['priority']=priority
        metadata[file_id]['status']=status
        metadata[file_id]['uploadTime']=int(time.time()*1000)
        save_metadata(metadata)
        return {"success": True, "metadata": metadata[file_id]}
    except Exception as e:
        return {"success": False, "message": str(e)}
    
@app.get("/slides/{file_id}/metadata")
async def get_metadata(file_id: str):
    """Get slide metadata by file_id"""
    try:
        metadata=load_metadata()
        if file_id in metadata:
            return metadata[file_id]
        else:
            return {"priority":"normal","status":"queued","uploadTime":int(time.time()*1000)}
    except Exception as e:
        return {"error": str(e)}
        
@app.get("/slides/metadata/all")
async def get_all_metadata():
    """Get metadata for all slides"""
    try:
        metadata=load_metadata()
        return metadata
    except Exception as e:
        return {"error": str(e)}        