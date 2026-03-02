import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime, timezone
import os

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

async def seed():
    mongo_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    mongo_db  = os.getenv("MONGODB_DB",  "design_manager")
    print(f"Connecting to {mongo_url} / {mongo_db}")
    client = AsyncIOMotorClient(mongo_url)
    db = client[mongo_db]

    # Insert Admin
    admin_exists = await db.users.find_one({"username": "admin"})
    if not admin_exists:
        admin_data = {
            "username": "admin",
            "email": "admin@example.com",
            "full_name": "System Administrator",
            "role": "admin",
            "is_active": True,
            "hashed_password": get_password_hash("password123"),
            "created_at": datetime.now(timezone.utc)
        }
        await db.users.insert_one(admin_data)
        print("Created admin user (admin / password123)")
    else:
        print("Admin user already exists")

    # Insert Designer
    designer_exists = await db.users.find_one({"username": "designer"})
    designer_id = None
    if not designer_exists:
        designer_data = {
            "username": "designer",
            "email": "designer@example.com",
            "full_name": "Pro Designer",
            "role": "designer",
            "is_active": True,
            "hashed_password": get_password_hash("designer123"),
            "created_at": datetime.now(timezone.utc)
        }
        res = await db.users.insert_one(designer_data)
        designer_id = res.inserted_id
        print("Created designer user (designer / designer123)")
    else:
        designer_id = designer_exists["_id"]
        print("Designer user already exists")
        
    # Seed 1 dummy ticket
    ticket_exists = await db.design_tickets.find_one({"title": "Design new Logo"})
    if not ticket_exists and designer_id:
        ti = {
            "title": "Design new Logo",
            "description": "Create a new cyber logo for the frontpage.",
            "status": "in_progress",
            "price": 150.0,
            "result_link": None,
            "assigned_to": str(designer_id),
            "external_source": None,
            "external_ref_id": None,
            "payment_status": "unpaid",
            "rejection_reason": None,
            "due_date": None,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
            "completed_at": None,
            "is_deleted": False
        }
        await db.design_tickets.insert_one(ti)
        print("Created dummy ticket")

    client.close()

if __name__ == "__main__":
    asyncio.run(seed())
