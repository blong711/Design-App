import boto3
import os
import shutil
from botocore.exceptions import ClientError
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from core.config import settings
from api.deps import get_current_user
from models.user import UserResponse
import uuid

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "avatars")
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter()

def get_s3_client():
    if not settings.AWS_ACCESS_KEY_ID or not settings.AWS_SECRET_ACCESS_KEY:
        raise HTTPException(status_code=500, detail="S3 credentials not configured")
    
    return boto3.client(
        's3',
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION
    )

@router.get("/presigned-url")
def generate_presigned_url(
    filename: str, 
    content_type: str, 
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Generates a pre-signed URL to upload a file directly to S3.
    Requires authentication.
    """
    # Generate a unique object key to avoid overwriting
    ext = filename.split(".")[-1] if "." in filename else ""
    unique_filename = f"{uuid.uuid4()}.{ext}" if ext else str(uuid.uuid4())
    object_name = f"uploads/{current_user.id}/{unique_filename}"
    
    s3_client = get_s3_client()
    
    try:
        response = s3_client.generate_presigned_url('put_object',
            Params={
                'Bucket': settings.S3_BUCKET_NAME,
                'Key': object_name,
                'ContentType': content_type
            },
            ExpiresIn=300) # Valid for 5 minutes
    except ClientError as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "upload_url": response,
        "object_key": object_name,
        "public_url": f"https://{settings.S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{object_name}"
    }


@router.post("/upload/avatar")
async def upload_avatar_local(
    file: UploadFile = File(...),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Upload avatar directly to local storage.
    Used as fallback when S3 is not configured.
    """
    allowed = {"image/jpeg", "image/png", "image/gif", "image/webp"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    ext = file.filename.split(".")[-1] if file.filename and "." in file.filename else "jpg"
    unique_name = f"{uuid.uuid4()}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    public_url = f"http://localhost:8000/static/avatars/{unique_name}"
    return {"public_url": public_url}


TICKET_IMG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "tickets")
os.makedirs(TICKET_IMG_DIR, exist_ok=True)

@router.post("/upload/ticket-image")
async def upload_ticket_image(
    file: UploadFile = File(...),
    current_user: UserResponse = Depends(get_current_user)
):
    allowed = {"image/jpeg", "image/png", "image/gif", "image/webp"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    ext = file.filename.split(".")[-1] if file.filename and "." in file.filename else "jpg"
    unique_name = f"{uuid.uuid4()}.{ext}"
    file_path = os.path.join(TICKET_IMG_DIR, unique_name)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    public_url = f"http://localhost:8000/static/tickets/{unique_name}"
    return {"public_url": public_url}
