import io
import mimetypes
import sqlite3
from bson import ObjectId
from fastapi import FastAPI, HTTPException, Form, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from typing import Optional

import uvicorn
from model import food_scan,rag,perform_ocr  # Import the function from model.py
import shutil
import os
from requests import Response
from pydantic import BaseModel
from uuid import uuid4
from pydantic import BaseModel
from fastapi import Body
from pymongo import MongoClient
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status
import gridfs
from datetime import datetime, timedelta
from chat import chat_bot
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Initialize FastAPI app
app = FastAPI(
    title="Food Scan API",
    description="API for food scanning and classification",
    version="1.0"
)

SECRET_KEY = "d13c0064d0a541b671954ce6131ce72493d1afa563a849be890979558d14a901"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# MongoDB connection
MONGO_URI = "mongodb+srv://nutriscan:nutriscan@cluster0.fuano.mongodb.net/nutriscan?retryWrites=true&w=majority"
client = MongoClient(MONGO_URI)
db = client["nutriscan"]
fs = gridfs.GridFS(db) 
users_collection = db.users
files_collection = db.files


# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/", StaticFiles(directory="dist" , html=True), name="static")

@app.get("/")
async def serve_index():
    return FileResponse("dist/index.html")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# Pydantic models
class UserCreate(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str


@app.post("/signup")
async def signup(user: UserCreate):
    existing_user = users_collection.find_one({"username": user.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")

    hashed_password = hash_password(user.password)
    user_data = {"username": user.username, "password": hashed_password}
    users_collection.insert_one(user_data)
    return {"message": "User created successfully"}

@app.post("/login", response_model=TokenResponse)
async def login(user: UserLogin):
    db_user = users_collection.find_one({"username": user.username})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    access_token = create_access_token({"sub": user.username})
    print(access_token)
    
    return {"access_token": access_token, "token_type": "bearer", "username": user.username}



# @app.post("/upload-health-report")
# async def upload_health_report(
#     question1: str = Form(...),
#     question2: str = Form(...),
#     question3: str = Form(...),
#     file: UploadFile = File(...),
# ):
#     # Placeholder logic for file processing and saving
#     if not file.filename.endswith(('.pdf', '.jpg', '.jpeg', '.png')):
#         raise HTTPException(status_code=400, detail="Invalid file type")
    
#     # Save the file to the server (or any other processing)
#     file_location = f"uploads/{file.filename}"
#     with open(file_location, "wb") as f:
#         f.write(await file.read())

#     return JSONResponse(content={"msg": "Health report uploaded successfully!"})

@app.post("/food-scan")
async def food_scan_api(image: UploadFile = File(...), medical: Optional[UploadFile] = File(None)):
    """
    Scan an image and classify its content.
    
    Args:
        image (UploadFile): The uploaded image file.
        medical (Upload, optional): Medical data related to the scan.
        
    Returns:
        JSON response with classification results.
    """
    try:
        # Save the uploaded image file temporarily
        temp_image_path = f"temp_{image.filename}"
        with open(temp_image_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

        temp_medical_path = None
        if medical :  # Check if medical file is provided
            temp_medical_path = f"temp_{medical.filename}"
            with open(temp_medical_path, "wb") as buffer:
                shutil.copyfileobj(medical.file, buffer)

        # Call the food_scan function with file paths
        result = food_scan(temp_image_path, medical=temp_medical_path)

        # Cleanup temporary files
        os.remove(temp_image_path)
        if temp_medical_path:
            os.remove(temp_medical_path)

        # Return the result as JSON
        return JSONResponse(content={"result": result})
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.post('/label-scan')
async def label_scan(image: UploadFile = File(...)):
    try:
        # Save the uploaded image file temporarily
        label_image_path = f"temp_{image.filename}"
        with open(label_image_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
            
        # Call the food_scan function with file paths
        ocr = perform_ocr(label_image_path)
        result = rag(ocr)
        # Cleanup temporary files
        os.remove(label_image_path)
        print(JSONResponse(content={"result": result}))

        return JSONResponse(content={"result": result})
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
    

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


def get_current_user(token: str = Depends(oauth2_scheme)):
    """Extracts the username from the JWT token."""
    print(f"Received token: {token}")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload.get("sub")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


@app.post("/upload-medical-report")
async def upload_medical_report(file: UploadFile = File(...), username: str= Depends(get_current_user)):
    try:
        
        file_id = fs.put(
            file.file,
            filename=file.filename,
            content_type=file.content_type,
            username = username  
        )
        files_collection.insert_one({"_id": file_id, "filename": file.filename, "username": username,"contentType": file.content_type ,})
        return {"message": "File uploaded successfully", "file_id": str(file_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/download-medical-report/{file_id}")
async def download_medical_report(file_id: str, username: str = Depends(get_current_user)):
    try:
        """Allows a user to download their file."""
        file_obj = files_collection.find_one({"_id": ObjectId(file_id), "username": username})
    
        if not file_obj:
            raise HTTPException(status_code=404, detail="File not found or unauthorized")
    
        file_data = fs.get(ObjectId(file_id))
        return StreamingResponse(io.BytesIO(file_data.read()), media_type="application/octet-stream",
                             headers={"Content-Disposition": f"attachment; filename={file_obj['filename']}"})
    except gridfs.errors.NoFile:
        raise HTTPException(status_code=404, detail="File not found")
    
@app.delete("/delete-medical-report/{file_id}")
async def delete_medical_report(file_id: str, username: str = Depends(get_current_user)):
    try:    
        """Deletes a file if the user is the owner."""
        file_obj = files_collection.find_one({"_id": ObjectId(file_id), "username": username})
    
        if not file_obj:
            raise HTTPException(status_code=404, detail="File not found or unauthorized")
    
        fs.delete(ObjectId(file_id))  
        files_collection.delete_one({"_id": ObjectId(file_id)}) 
    
        return {"message": "File deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 

@app.get("/get-user-files")
async def get_user_files(username: str = Depends(get_current_user)):
    try:
        """Fetches all files uploaded by the user."""
        files = files_collection.find({"username": username})
        file_list = [{"file_id": str(file["_id"]), "filename": file["filename"]} for file in files]
    
        return {"files": file_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/medical-report")
async def get_medical_report(username: str = Depends(get_current_user)):
    try:
        """Fetches the user's medical report."""
       
        file_obj = files_collection.find_one({"username": username})
        print(file_obj)
    
        if not file_obj:
            raise HTTPException(status_code=404, detail="No medical report found for the user.")
        
        content_type = file_obj.get("contentType", "application/octet-stream")
    
        
        file_data = fs.get(file_obj["_id"])
        print(file_data)
        print(file_obj["contentType"])
        
        
        return StreamingResponse(file_data, media_type=file_obj["contentType"], headers={"Content-Disposition": f"attachment; filename={file_obj['filename']}"})
        
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class ChatRequest(BaseModel):
    prompt: str
    
@app.post("/chat")
async def get_chat(request : ChatRequest):
    try:
        """ Takes the prompt from user and gives the response just as a normal gemini model"""
        response = chat_bot(request.prompt) 
        return {"response": response} 
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)

    

