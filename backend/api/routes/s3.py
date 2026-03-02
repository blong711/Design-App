import boto3
import os
from botocore.exceptions import ClientError
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from core.config import settings
from api.deps import get_current_user
from models.user import UserResponse
import uuid

router = APIRouter()

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}

def get_s3_client():
    if not settings.AWS_ACCESS_KEY_ID or not settings.AWS_SECRET_ACCESS_KEY:
        raise HTTPException(status_code=500, detail="S3 credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.")

    return boto3.client(
        's3',
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION,
    )

def s3_public_url(object_key: str) -> str:
    return f"https://{settings.S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{object_key}"

def upload_to_s3(file_bytes: bytes, object_key: str, content_type: str) -> str:
    """Upload bytes directly to S3 and return the public URL."""
    s3 = get_s3_client()
    try:
        s3.put_object(
            Bucket=settings.S3_BUCKET_NAME,
            Key=object_key,
            Body=file_bytes,
            ContentType=content_type,
        )
    except ClientError as e:
        raise HTTPException(status_code=500, detail=f"S3 upload failed: {e}")
    return s3_public_url(object_key)


# ─── Presigned URL (for designer result upload from browser) ─────────────────

@router.get("/presigned-url")
def generate_presigned_url(
    filename: str,
    content_type: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Generates a pre-signed PUT URL for direct browser → S3 upload."""
    ext = filename.rsplit(".", 1)[-1] if "." in filename else ""
    unique_filename = f"{uuid.uuid4()}.{ext}" if ext else str(uuid.uuid4())
    object_key = f"results/{current_user.id}/{unique_filename}"

    s3_client = get_s3_client()
    try:
        upload_url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': settings.S3_BUCKET_NAME,
                'Key': object_key,
                'ContentType': content_type,
            },
            ExpiresIn=300,  # 5 minutes
        )
    except ClientError as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "upload_url": upload_url,
        "object_key": object_key,
        "public_url": s3_public_url(object_key),
    }


# ─── Avatar upload ────────────────────────────────────────────────────────────

@router.post("/upload/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: UserResponse = Depends(get_current_user),
):
    """Upload user avatar to S3."""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Only image files are allowed (JPEG, PNG, GIF, WebP).")

    ext = file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "jpg"
    object_key = f"avatars/{current_user.id}/{uuid.uuid4()}.{ext}"

    file_bytes = await file.read()
    public_url = upload_to_s3(file_bytes, object_key, file.content_type)

    return {"public_url": public_url}


# ─── Ticket reference image upload ───────────────────────────────────────────

@router.post("/upload/ticket-image")
async def upload_ticket_image(
    file: UploadFile = File(...),
    current_user: UserResponse = Depends(get_current_user),
):
    """Upload ticket reference image to S3."""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Only image files are allowed (JPEG, PNG, GIF, WebP).")

    ext = file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "jpg"
    object_key = f"tickets/{current_user.id}/{uuid.uuid4()}.{ext}"

    file_bytes = await file.read()
    public_url = upload_to_s3(file_bytes, object_key, file.content_type)

    return {"public_url": public_url}
