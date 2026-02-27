import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check():
    try:
        client = AsyncIOMotorClient("mongodb://localhost:27017/", serverSelectionTimeoutMS=2000)
        info = await client.server_info()
        print("Connected to MongoDB successfully!")
    except Exception as e:
        print("Failed:", e)

if __name__ == "__main__":
    asyncio.run(check())
