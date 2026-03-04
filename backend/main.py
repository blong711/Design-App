from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from core.config import settings
from core.database import connect_to_mongo, close_mongo_connection
from api.routes import auth, users, api_keys, designs, s3, analytics, external, webhooks
import os

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Update for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()

app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/users", tags=["users"])
app.include_router(api_keys.router, prefix=f"{settings.API_V1_STR}/api-keys", tags=["api_keys"])
app.include_router(designs.router, prefix=f"{settings.API_V1_STR}/designs", tags=["designs"])
app.include_router(s3.router, prefix=f"{settings.API_V1_STR}/s3", tags=["s3"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}/analytics", tags=["analytics"])
app.include_router(external.router, prefix=f"{settings.API_V1_STR}/external", tags=["external"])
app.include_router(webhooks.router, prefix=f"{settings.API_V1_STR}/webhooks", tags=["webhooks"])

# Serve uploaded files statically
uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=uploads_dir), name="static")

@app.get("/")
def root():
    return {"message": "Welcome to Design Manager API"}
