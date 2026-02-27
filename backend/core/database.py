from motor.motor_asyncio import AsyncIOMotorClient
from core.config import settings

class Database:
    client: AsyncIOMotorClient = None
    db = None

db_obj = Database()

async def connect_to_mongo():
    db_obj.client = AsyncIOMotorClient(settings.MONGODB_URL)
    db_obj.db = db_obj.client[settings.MONGODB_DB]
    print("Connected to MongoDB")

async def close_mongo_connection():
    if db_obj.client:
        db_obj.client.close()
        print("Closed MongoDB connection")
