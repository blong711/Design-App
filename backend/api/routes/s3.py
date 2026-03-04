import boto3
import os
from botocore.exceptions import ClientError
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from core.config import settings
from api.deps import get_current_user
from models.user import UserResponse
import uuid

router = APIRouter()

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}

def is_s3_configured() -> bool:
    return bool(settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY)

def get_s3_client():
    if not is_s3_configured():
        return None

    return boto3.client(
        's3',
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION,
    )

def s3_public_url(object_key: str) -> str:
    return f"https://{settings.S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{object_key}"

def upload_to_s3(file_bytes: bytes, object_key: str, content_type: str) -> str:
    """Upload bytes to S3 or local storage and return the public URL."""
    # Normalize object_key: remove leading/trailing slashes and double slashes
    object_key = object_key.strip("/").replace("//", "/")
    
    if not is_s3_configured():
        # Fallback to local storage
        # Use absolute path from current file location to find uploads directory
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        uploads_dir = os.path.join(base_dir, "uploads")
        full_path = os.path.join(uploads_dir, object_key)
        
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        
        with open(full_path, "wb") as f:
            f.write(file_bytes)
        
        # Ensure BACKEND_URL doesn't end with slash when joining
        base_url = settings.BACKEND_URL.rstrip("/")
        return f"{base_url}/static/{object_key}"

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


# ─── Presigned URL / Local Upload Endpoint ───────────────────────────────────

@router.get("/presigned-url")
def generate_presigned_url(
    filename: str,
    content_type: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Generates a pre-signed PUT URL or a local upload URL."""
    ext = filename.rsplit(".", 1)[-1] if "." in filename else ""
    unique_filename = f"{uuid.uuid4()}.{ext}" if ext else str(uuid.uuid4())
    object_key = f"results/{current_user.id}/{unique_filename}"

    if not is_s3_configured():
        # Return a path to our local upload endpoint
        return {
            "upload_url": f"{settings.BACKEND_URL}{settings.API_V1_STR}/s3/local-upload?object_key={object_key}",
            "object_key": object_key,
            "public_url": f"{settings.BACKEND_URL}/static/{object_key}",
        }

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

@router.put("/local-upload")
async def local_upload(
    request: Request,
    object_key: str,
    current_user: UserResponse = Depends(get_current_user),
):
    """Fallback endpoint for local file uploads (accepts raw body like S3)."""
    file_bytes = await request.body()
    content_type = request.headers.get("Content-Type", "application/octet-stream")
    
    # Security: validate object_key starts with allowed prefixes
    if not (object_key.startswith("results/") or object_key.startswith("avatars/") or object_key.startswith("designs/")):
        raise HTTPException(status_code=400, detail="Invalid object key prefix")
        
    public_url = upload_to_s3(file_bytes, object_key, content_type)
    return {"public_url": public_url}


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


# ─── Design reference image upload ───────────────────────────────────────────

@router.post("/upload/design-image")
async def upload_design_image(
    file: UploadFile = File(...),
    current_user: UserResponse = Depends(get_current_user),
):
    """Upload design reference image to S3."""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Only image files are allowed (JPEG, PNG, GIF, WebP).")

    ext = file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "jpg"
    object_key = f"designs/{current_user.id}/{uuid.uuid4()}.{ext}"

    file_bytes = await file.read()
    public_url = upload_to_s3(file_bytes, object_key, file.content_type)

    return {"public_url": public_url}
