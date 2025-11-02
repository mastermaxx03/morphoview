from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import uuid
import json
from pathlib import Path
import time
import torch
import torchvision.transforms as transforms
from torchcam.methods import GradCAM
from PIL import Image
import numpy as np
import matplotlib.pyplot as plt
from pydantic import BaseModel
import pyvips

class MetadataUpdate(BaseModel):
    priority: str = "normal"
    status: str = "queued"


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_FOLDER = "uploads"
HEATMAP_FOLDER = "heatmaps"
TILES_FOLDER = "tiles"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(HEATMAP_FOLDER, exist_ok=True)
os.makedirs(TILES_FOLDER, exist_ok=True)
METADATA_FILE = "slides_metadata.json"
# model
print("Loading ResNet50 model...")
MODEL = torch.hub.load('pytorch/vision:v0.10.0', 'resnet50', pretrained=True)
MODEL.eval()
print("Model loaded!")

DEVICE = "mps"
def load_metadata():
    if not os.path.exists(METADATA_FILE):
        return {}
    with open(METADATA_FILE, "r") as f:
        return json.load(f)
def save_metadata(metadata):
    with open(METADATA_FILE, "w") as f:
        json.dump(metadata, f, indent=2)    
def generate_tiles(input_path:str,output_id:str):
    """Convert Flat image to deep zoom tiles using pyvips."""
    output_path=os.path.join(TILES_FOLDER,output_id)
    try:
        image=pyvips.Image.new_from_file(input_path)
        image.dzsave(output_path,tile_size=256,layout="dz")
        print(f"Tiling successful for {output_id}")
        return True
        
    except Exception as e:
        print(f"Error generating tiles for {input_path}: {e}")
        return None
# Serve uploaded files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/heatmaps", StaticFiles(directory="heatmaps"), name="heatmaps")
app.mount("/tiles", StaticFiles(directory="tiles"), name="tiles")

@app.post("/upload")
async def upload_slide(file: UploadFile = File(...)):
    # Generate unique ID
    file_id = str(uuid.uuid4())
    file_extension = os.path.splitext(file.filename)[1]
    saved_filename = f"{file_id}{file_extension}"
    
    file_path = os.path.join(UPLOAD_FOLDER, saved_filename)
    with open(file_path, "wb") as f:
        f.write(await file.read())
    tile_success=generate_tiles(file_path,file_id)
    
    return {
        "file_id": file_id,
        "filename": file.filename,
        "saved_as": saved_filename,  
        "tiled": tile_success
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
                heatmap_file = os.path.join(HEATMAP_FOLDER, f"{file_id}_heatmap.png")
                if os.path.exists(heatmap_file):
                    os.remove(heatmap_file)

                # 3. Delete its tile folder and .dzi file
                tile_dir = os.path.join(TILES_FOLDER, f"{file_id}_files")
                dzi_file = os.path.join(TILES_FOLDER, f"{file_id}.dzi")
                if os.path.exists(tile_dir):
                    import shutil
                    shutil.rmtree(tile_dir)
                if os.path.exists(dzi_file):
                    os.remove(dzi_file)
                return {"success": True, "message": f"Deleted {file}"}
            
        
        return {"success": False, "message": "File not found"}
    except Exception as e:
        return {"success": False, "message": str(e)}
# Additional endpoints for managing metadata
@app.post("/slides/{file_id}/metadata")
async def update_metadata(file_id: str, data: MetadataUpdate):
    """Update slide metadata"""
    try:
        metadata = load_metadata()
        
        if file_id not in metadata:
            metadata[file_id] = {}
        
        # Use data.priority and data.status
        metadata[file_id]['priority'] = data.priority
        metadata[file_id]['status'] = data.status
        if 'uploadTime' not in metadata[file_id]:
            metadata[file_id]['uploadTime'] = int(time.time() * 1000)
        
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
        metadata = load_metadata()
        return metadata
    except Exception as e:
        print(f"Error loading all metadata: {e}")
        return {"error": str(e)}        
@app.post("/predict")
async def predict(file_id: str):
    """
    Run ResNet50 inference and REAL Grad-CAM heatmap.
    """
    try:
        # 1. Find image file
        image_filename = None
        for file in os.listdir(UPLOAD_FOLDER):
            if file.startswith(file_id):
                image_filename = file
                break
        
        if not image_filename:
            return {"error": f"File {file_id} not found"}
        
        image_path = os.path.join(UPLOAD_FOLDER, image_filename)
        
        # 2. Load image
        image = Image.open(image_path).convert('RGB')
        image_width, image_height = image.size
        transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])
        
        # --- Send tensor to M1 GPU ---
        image_tensor = transform(image).unsqueeze(0).to(DEVICE)
        
        # 4. Run inference
        # --- Send model to M1 GPU ---
        MODEL.to(DEVICE) 
        cam_extractor = GradCAM(MODEL, target_layer='layer4')
        
        # 5. Generate Grad-CAM heatmap
        # This will run on the GPU
        output = MODEL(image_tensor)

        # Get probabilities and confidence
        probabilities = torch.nn.functional.softmax(output, dim=1)
        
        # Get the top predicted class index
        class_index = output.squeeze(0).argmax().item()
        confidence = probabilities[0, class_index].item()
        
        # This also runs on the GPU
        activation_map_list = cam_extractor(class_idx=class_index, scores=output)

        # Manually release the hooks
        cam_extractor.remove_hooks()

        # 6. Extract and process heatmap
        with torch.no_grad():
            # --- Pull activation map back from GPU to CPU ---
            activation_map = activation_map_list[0].cpu()
            
            # Resize heatmap to original image size
            heatmap_resized = torch.nn.functional.interpolate(
                activation_map.unsqueeze(0), # The fix we made earlier
                size=(image_height, image_width),
                mode='bilinear',
                align_corners=False
            )
            
            heatmap_np = heatmap_resized.squeeze().numpy()
            heatmap_normalized = (heatmap_np - heatmap_np.min()) / (heatmap_np.max() - heatmap_np.min() + 1e-8)
                    
            #convert to colored heatmap
            heatmap_colored = plt.cm.hot(heatmap_normalized)
            heatmap_rgb = (heatmap_colored[:, :, :3] * 255).astype(np.uint8)
            heatmap_pil = Image.fromarray(heatmap_rgb)
        
        # 7. Save heatmap
       
        heatmap_filename = f"{file_id}_heatmap.png"
        heatmap_path = os.path.join(HEATMAP_FOLDER, heatmap_filename)
        heatmap_pil.save(heatmap_path)
        
        # 8. Mock boxes
        boxes = [
            {"x": int(image_width * 0.1), "y": int(image_height * 0.1), "width": int(image_width * 0.2), "height": int(image_height * 0.15), "confidence": 0.87},
            {"x": int(image_width * 0.6), "y": int(image_height * 0.5), "width": int(image_width * 0.25), "height": int(image_height * 0.3), "confidence": 0.75}
        ]
        
        # 9. Mock QC metrics
        qc_metrics = {"tissue_quality": 0.85, "blur_score": 0.15, "contrast": 0.82, "tumors_detected": len(boxes), "avg_confidence": 0.81}
        
        model_info = {
            "model": "ResNet50",
            "confidence": round(confidence, 2), # This is the REAL confidence
            "processing_time": "2.3s" # This is mocked
        }
        
        # --- THIS IS THE METADATA SAVE FIX ---
        try:
            metadata = load_metadata()
            if file_id not in metadata:
                metadata[file_id] = {}
            
            # Add the new info
            metadata[file_id]['heatmapUrl'] = f"/heatmaps/{heatmap_filename}"
            metadata[file_id]['model_info'] = model_info
            metadata[file_id]['qc_metrics'] = qc_metrics
            metadata[file_id]['status'] = "completed" 
            
            save_metadata(metadata)
        
        except Exception as e:
            print(f"CRITICAL: Failed to save metadata after prediction: {e}")
        # --- END OF METADATA SAVE FIX ---

        # 10. Return response
        return {
            "success": True,
            "boxes": boxes,
            "heatmap": f"/heatmaps/{heatmap_filename}",
            "model_info": model_info,
            "qc_metrics": qc_metrics,
            "image_size": {"width": image_width, "height": image_height}
        }
    
    except Exception as e:
        print(f"Error in /predict: {e}") 
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}