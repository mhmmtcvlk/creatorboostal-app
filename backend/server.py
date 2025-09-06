from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError
from datetime import datetime, timedelta
import logging
import jwt
import os
from pathlib import Path
from dotenv import load_dotenv

# Import our modules
from models import *
from auth import get_password_hash, verify_password, create_access_token, decode_token
from database import database

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="CreatorBoostal API", version="1.0.0")

# Initialize API router
api_router = APIRouter(prefix="/api")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Dependency to get current user
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    try:
        payload = decode_token(credentials.credentials)
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_data = await database.db.users.find_one({"id": user_id})
        if user_data is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        return User(**user_data)
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Dependency to get admin user
async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != Role.admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# Health check
@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# Authentication routes
@api_router.post("/auth/register", response_model=AuthResponse)
async def register(user_data: UserRegister):
    # Check if user already exists
    existing_user = await database.db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    existing_username = await database.db.users.find_one({"username": user_data.username})
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Create new user
    user = User(
        id=str(ObjectId()),
        email=user_data.email,
        username=user_data.username,
        password_hash=get_password_hash(user_data.password),
        role=Role.user,
        credits=0,
        vip_package=VIPPackageStatus.none,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    # Save to database
    await database.db.users.insert_one(user.dict())
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            role=user.role,
            credits=user.credits,
            vip_package=user.vip_package,
            created_at=user.created_at
        )
    )

@api_router.post("/auth/login", response_model=AuthResponse)
async def login(credentials: UserLogin):
    # Find user
    user_data = await database.db.users.find_one({"email": credentials.email})
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = User(**user_data)
    
    # Verify password
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            role=user.role,
            credits=user.credits,
            vip_package=user.vip_package,
            created_at=user.created_at
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        role=current_user.role,
        credits=current_user.credits,
        vip_package=current_user.vip_package,
        created_at=current_user.created_at
    )

# VIP endpoints
@api_router.get("/vip/packages")
async def get_vip_packages():
    packages = await database.db.vip_packages.find({"is_active": True}).to_list(length=None)
    return packages

@api_router.post("/vip/purchase")
async def purchase_vip_package(
    purchase_data: VIPPurchaseRequest,
    current_user: User = Depends(get_current_user)
):
    # Find the VIP package
    package = await database.db.vip_packages.find_one({"id": purchase_data.package_id})
    if not package:
        raise HTTPException(status_code=404, detail="VIP package not found")
    
    # Create payment record
    payment_record = {
        "id": str(ObjectId()),
        "user_id": current_user.id,
        "username": current_user.username,
        "package_id": purchase_data.package_id,
        "package_name": package["name"],
        "amount": package["price"],
        "payment_method": purchase_data.payment_method,
        "status": "pending",
        "created_at": datetime.utcnow(),
        "notes": f"{purchase_data.payment_method} payment initiated"
    }
    
    await database.db.payment_records.insert_one(payment_record)
    
    return {
        "message": "Payment request created successfully",
        "payment_id": payment_record["id"],
        "status": "pending"
    }

# Payment management endpoints (Admin only)
@api_router.get("/admin/payments")
async def get_payment_records(admin_user: User = Depends(get_admin_user)):
    payments = await database.db.payment_records.find().sort("created_at", -1).to_list(length=50)
    
    # Calculate stats
    approved_payments = [p for p in payments if p["status"] == "approved"]
    today = datetime.utcnow().date()
    approved_today = [p for p in approved_payments if p["created_at"].date() == today]
    
    stats = {
        "pending_payments": len([p for p in payments if p["status"] == "pending"]),
        "approved_today": len(approved_today),
        "mobile_payments": len([p for p in payments if p["payment_method"] == "mobile_payment"]),
        "bank_transfers": len([p for p in payments if p["payment_method"] == "bank_transfer"]),
        "crypto_payments": len([p for p in payments if p["payment_method"] == "crypto"]),
        "total_revenue": sum(p["amount"] for p in approved_payments)
    }
    
    return {"payments": payments, "stats": stats}

@api_router.post("/admin/payments/{payment_id}/process")
async def process_payment(
    payment_id: str,
    action: str,  # 'approve' or 'reject'
    admin_user: User = Depends(get_admin_user)
):
    if action not in ['approve', 'reject']:
        raise HTTPException(status_code=400, detail="Invalid action")
    
    # Find payment record
    payment = await database.db.payment_records.find_one({"id": payment_id})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    if payment["status"] != "pending":
        raise HTTPException(status_code=400, detail="Payment already processed")
    
    # Update payment status
    await database.db.payment_records.update_one(
        {"id": payment_id},
        {"$set": {"status": action, "processed_at": datetime.utcnow(), "processed_by": admin_user.id}}
    )
    
    # If approved, grant VIP to user
    if action == "approve":
        package = await database.db.vip_packages.find_one({"id": payment["package_id"]})
        if package:
            vip_status = VIPPackageStatus.starter
            if "pro" in package["name"].lower():
                vip_status = VIPPackageStatus.pro
            elif "premium" in package["name"].lower():
                vip_status = VIPPackageStatus.premium
                
            # Update user VIP status
            await database.db.users.update_one(
                {"id": payment["user_id"]},
                {"$set": {
                    "vip_package": vip_status,
                    "vip_expires_at": datetime.utcnow() + timedelta(days=package["duration_days"]),
                    "updated_at": datetime.utcnow()
                }}
            )
            
            # Create notification for user
            notification = {
                "id": str(ObjectId()),
                "user_id": payment["user_id"],
                "title": "VIP Paket Aktif!",
                "message": f"{package['name']} paketiniz onaylandı ve aktif edildi!",
                "type": "vip_approved",
                "is_read": False,
                "created_at": datetime.utcnow()
            }
            await database.db.notifications.insert_one(notification)
    
    return {"message": f"Payment {action}d successfully"}

# System reset endpoint (Admin only)
@api_router.post("/admin/reset-system")
async def reset_system(admin_user: User = Depends(get_admin_user)):
    """Reset all data except admin accounts"""
    try:
        # Delete all non-admin users
        await database.db.users.delete_many({"role": {"$ne": "admin"}})
        
        # Delete all payment records
        await database.db.payment_records.delete_many({})
        
        # Delete all boosts
        await database.db.boosts.delete_many({})
        
        # Delete all social accounts
        await database.db.social_accounts.delete_many({})
        
        # Delete all forum topics (keep categories)
        await database.db.forum_topics.delete_many({})
        
        # Delete all notifications
        await database.db.notifications.delete_many({})
        
        # Reset admin users to remove VIP status (except admin role)
        await database.db.users.update_many(
            {"role": "admin"},
            {"$set": {
                "vip_package": VIPPackageStatus.none,
                "credits": 0,
                "vip_expires_at": None,
                "updated_at": datetime.utcnow()
            }}
        )
        
        logger.info(f"System reset performed by admin: {admin_user.email}")
        return {"message": "System reset completed successfully"}
        
    except Exception as e:
        logger.error(f"System reset failed: {str(e)}")
        raise HTTPException(status_code=500, detail="System reset failed")

# Social media endpoints
@api_router.get("/social/discover")
async def discover_accounts(skip: int = 0, limit: int = 20):
    # Mock data for now - in real app would get boosted accounts
    mock_accounts = [
        {
            "id": str(ObjectId()),
            "platform": "instagram",
            "username": "mhmmtcvlk",
            "display_name": "Muhammet Civelek",
            "followers_count": 15420,
            "user_id": "mock_user_1",
            "boost_active": True,
            "boost_expires_at": datetime.utcnow() + timedelta(hours=6)
        }
    ]
    return mock_accounts

@api_router.post("/social/create")
async def create_social_account(
    account_data: SocialAccountCreate,
    current_user: User = Depends(get_current_user)
):
    social_account = SocialAccount(
        id=str(ObjectId()),
        user_id=current_user.id,
        platform=account_data.platform,
        username=account_data.username,
        display_name=account_data.display_name,
        description=account_data.description,
        followers_count=account_data.followers_count,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    await database.db.social_accounts.insert_one(social_account.dict())
    return {"message": "Social account created successfully"}

# Boost endpoints
@api_router.post("/boost/create")
async def create_boost(
    boost_data: BoostCreate,
    current_user: User = Depends(get_current_user)
):
    # Check if user has enough credits
    if current_user.credits < boost_data.credits_spent:
        raise HTTPException(status_code=400, detail="Insufficient credits")
    
    # Create boost record
    boost = Boost(
        id=str(ObjectId()),
        user_id=current_user.id,
        social_account_id=boost_data.social_account_id,
        duration_hours=boost_data.duration_hours,
        credits_spent=boost_data.credits_spent,
        status=BoostStatus.active,
        expires_at=datetime.utcnow() + timedelta(hours=boost_data.duration_hours),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    await database.db.boosts.insert_one(boost.dict())
    
    # Deduct credits from user
    await database.db.users.update_one(
        {"id": current_user.id},
        {"$inc": {"credits": -boost_data.credits_spent}, "$set": {"updated_at": datetime.utcnow()}}
    )
    
    return {"message": "Boost created successfully", "boost_id": boost.id}

# Credits endpoints
@api_router.post("/credits/watch-ad")
async def watch_ad(current_user: User = Depends(get_current_user)):
    # Award credits for watching ad
    credits_earned = 5
    await database.db.users.update_one(
        {"id": current_user.id},
        {"$inc": {"credits": credits_earned}, "$set": {"updated_at": datetime.utcnow()}}
    )
    
    return {"credits_earned": credits_earned}

@api_router.post("/credits/follow-creator")
async def follow_creator(current_user: User = Depends(get_current_user)):
    # Award credits for following creator
    credits_earned = 10
    await database.db.users.update_one(
        {"id": current_user.id},
        {"$inc": {"credits": credits_earned}, "$set": {"updated_at": datetime.utcnow()}}
    )
    
    return {"credits_earned": credits_earned}

# Forum endpoints
@api_router.get("/forum/categories")
async def get_forum_categories():
    categories = await database.db.forum_categories.find().to_list(length=None)
    return categories

@api_router.get("/forum/topics")
async def get_forum_topics(category_id: Optional[str] = None, skip: int = 0, limit: int = 20):
    query = {}
    if category_id:
        query["category_id"] = category_id
    
    topics = await database.db.forum_topics.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(length=None)
    return topics

# Notifications endpoints
@api_router.get("/notifications")
async def get_notifications(current_user: User = Depends(get_current_user)):
    notifications = await database.db.notifications.find({"user_id": current_user.id}).sort("created_at", -1).limit(20).to_list(length=None)
    return notifications

@api_router.post("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user)
):
    await database.db.notifications.update_one(
        {"id": notification_id, "user_id": current_user.id},
        {"$set": {"is_read": True}}
    )
    return {"message": "Notification marked as read"}

# Admin endpoints
@api_router.get("/admin/stats")
async def get_admin_stats(admin_user: User = Depends(get_admin_user)):
    total_users = await database.db.users.count_documents({})
    vip_users = await database.db.users.count_documents({"vip_package": {"$ne": VIPPackageStatus.none}})
    total_boosts = await database.db.boosts.count_documents({})
    active_boosts = await database.db.boosts.count_documents({"status": BoostStatus.active})
    total_topics = await database.db.forum_topics.count_documents({})
    total_social_accounts = await database.db.social_accounts.count_documents({})
    
    # Payment stats
    payments = await database.db.payment_records.find({"status": "approved"}).to_list(length=None)
    total_vip_purchases = len(payments)
    revenue = sum(p["amount"] for p in payments)
    
    return {
        "total_users": total_users,
        "vip_users": vip_users,
        "total_boosts": total_boosts,
        "active_boosts": active_boosts,
        "total_topics": total_topics,
        "total_social_accounts": total_social_accounts,
        "total_vip_purchases": total_vip_purchases,
        "revenue": revenue
    }

@api_router.get("/admin/users")
async def get_admin_users(admin_user: User = Depends(get_admin_user)):
    users = await database.db.users.find({}).to_list(length=None)
    return [UserResponse(
        id=user["id"],
        email=user["email"],
        username=user["username"],
        role=user["role"],
        credits=user["credits"],
        vip_package=user.get("vip_package", VIPPackageStatus.none),
        created_at=user["created_at"]
    ) for user in users]

@api_router.put("/admin/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    new_role: Role,
    admin_user: User = Depends(get_admin_user)
):
    result = await database.db.users.update_one(
        {"id": user_id},
        {"$set": {"role": new_role, "updated_at": datetime.utcnow()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User role updated successfully"}

@api_router.put("/admin/users/{user_id}/credits")
async def update_user_credits(
    user_id: str,
    credits: int,
    admin_user: User = Depends(get_admin_user)
):
    result = await database.db.users.update_one(
        {"id": user_id},
        {"$set": {"credits": credits, "updated_at": datetime.utcnow()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User credits updated successfully"}

@api_router.post("/admin/broadcast")
async def broadcast_message(
    message_data: BroadcastMessage,
    admin_user: User = Depends(get_admin_user)
):
    # Get all users
    users = await database.db.users.find({}).to_list(length=None)
    
    # Create notifications for all users
    notifications = []
    for user in users:
        notification = {
            "id": str(ObjectId()),
            "user_id": user["id"],
            "title": message_data.title,
            "message": message_data.message,
            "type": "broadcast",
            "is_read": False,
            "created_at": datetime.utcnow()
        }
        notifications.append(notification)
    
    if notifications:
        await database.db.notifications.insert_many(notifications)
    
    return {"message": f"Broadcast sent to {len(users)} users"}

@api_router.get("/admin/settings")
async def get_admin_settings(admin_user: User = Depends(get_admin_user)):
    settings = await database.db.admin_settings.find().to_list(length=None)
    return settings

@api_router.put("/admin/settings")
async def update_admin_settings(
    settings_data: dict,
    admin_user: User = Depends(get_admin_user)
):
    # Update each setting
    for key, value in settings_data.items():
        await database.db.admin_settings.update_one(
            {"key": key},
            {"$set": {"value": value, "updated_at": datetime.utcnow()}},
            upsert=True
        )
    
    return {"message": "Admin settings updated successfully"}

@api_router.put("/admin/vip/packages/{package_id}")
async def update_vip_package(
    package_id: str,
    update_data: VipPackageUpdate,
    admin_user: User = Depends(get_admin_user)
):
    """Update VIP package price or status (admin only)"""
    update_fields = {}
    
    if update_data.price is not None:
        update_fields["price"] = update_data.price
    if update_data.is_active is not None:
        update_fields["is_active"] = update_data.is_active
    
    if not update_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No update data provided"
        )
    
    update_fields["updated_at"] = datetime.utcnow()
    
    result = await database.db.vip_packages.update_one(
        {"id": package_id},
        {"$set": update_fields}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="VIP package not found"
        )
    
    return {"message": "VIP package updated successfully"}

# Add the API router to the main app
app.include_router(api_router)

# Database initialization
@app.on_event("startup")
async def startup_event():
    await database.connect()
    
    # Create indexes
    await database.create_indexes()
    
    # Initialize default data
    await initialize_default_data()

@app.on_event("shutdown")
async def shutdown_event():
    await database.disconnect()

async def initialize_default_data():
    """Initialize default data for the application"""
    
    # Check if admin user exists, if not create one
    admin_user = await database.db.users.find_one({"email": "mhmmdc83@gmail.com"})
    if not admin_user:
        admin_user_data = User(
            id=str(ObjectId()),
            email="mhmmdc83@gmail.com",
            username="admin",
            password_hash=get_password_hash("admin123"),
            role=Role.admin,
            credits=0,
            vip_package=VIPPackageStatus.none,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        await database.db.users.insert_one(admin_user_data.dict())
        logger.info("Admin user created")
    else:
        # Update existing admin user to ensure admin role
        await database.db.users.update_one(
            {"email": "mhmmdc83@gmail.com"},
            {"$set": {"role": Role.admin, "updated_at": datetime.utcnow()}}
        )
        logger.info("User updated to admin: mhmmdc83@gmail.com")
    
    # Initialize VIP packages if they don't exist
    vip_packages_count = await database.db.vip_packages.count_documents({})
    if vip_packages_count == 0:
        default_packages = [
            {
                "id": str(ObjectId()),
                "name": "VIP Starter",
                "price": 19.99,
                "duration_days": 30,
                "features": [
                    "Boost önceliği",
                    "Temel AI yardımcısı",
                    "Email destek",
                    "5x hızlı boost"
                ],
                "description": "Sosyal medya yolculuğunuza başlamak için ideal paket",
                "is_popular": False,
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            },
            {
                "id": str(ObjectId()),
                "name": "VIP Pro",
                "price": 49.99,
                "duration_days": 30,
                "features": [
                    "Yüksek boost önceliği",
                    "Gelişmiş AI yardımcısı",
                    "Öncelikli destek",
                    "10x hızlı boost",
                    "Detaylı analitikler",
                    "Özel rozet"
                ],
                "description": "Profesyonel büyüme için en popüler seçim",
                "is_popular": True,
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            },
            {
                "id": str(ObjectId()),
                "name": "VIP Premium",
                "price": 99.99,
                "duration_days": 30,
                "features": [
                    "Maximum boost önceliği",
                    "Premium AI yardımcısı",
                    "7/24 özel destek",
                    "20x hızlı boost",
                    "Gelişmiş analitikler",
                    "Altın rozet",
                    "Özel özellikler",
                    "API erişimi"
                ],
                "description": "Sınırsız büyüme ve tüm premium özellikler",
                "is_popular": False,
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        ]
        await database.db.vip_packages.insert_many(default_packages)
        logger.info("Default VIP packages created")
    
    # Initialize forum categories if they don't exist
    categories_count = await database.db.forum_categories.count_documents({})
    if categories_count == 0:
        default_categories = [
            {
                "id": str(ObjectId()),
                "name": "Instagram",
                "description": "Instagram hesap büyütme stratejileri",
                "color": "#E4405F",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            },
            {
                "id": str(ObjectId()),
                "name": "TikTok",
                "description": "TikTok viral olma ipuçları",
                "color": "#000000",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            },
            {
                "id": str(ObjectId()),
                "name": "Twitter",
                "description": "Twitter engagement artırma",
                "color": "#1DA1F2",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            },
            {
                "id": str(ObjectId()),
                "name": "YouTube",
                "description": "YouTube kanal büyütme rehberleri",
                "color": "#FF0000",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            },
            {
                "id": str(ObjectId()),
                "name": "Genel",
                "description": "Genel sosyal medya konuları",
                "color": "#6C5CE7",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        ]
        await database.db.forum_categories.insert_many(default_categories)
        logger.info("Default forum categories created")
    
    # Initialize admin settings if they don't exist
    settings_count = await database.db.admin_settings.count_documents({})
    if settings_count == 0:
        default_settings = [
            {"key": "telegram_bot_token", "value": "", "description": "Telegram bot token for notifications"},
            {"key": "telegram_channel_id", "value": "", "description": "Telegram channel ID for notifications"},
            {"key": "instagram_api_key", "value": "", "description": "Instagram API key for integration"},
            {"key": "company_name", "value": "CreatorBoostal Ltd.", "description": "Company name for legal documents"},
            {"key": "company_address", "value": "İstanbul, Türkiye", "description": "Company address"},
            {"key": "company_email", "value": "info@creatorboostal.com", "description": "Contact email address"},
            {"key": "company_phone", "value": "+90 555 123 4567", "description": "Contact phone number"},
            {"key": "ai_model_provider", "value": "openai", "description": "AI model provider (openai, anthropic, google)"},
            {"key": "ai_api_key", "value": "", "description": "AI service API key"}
        ]
        
        for setting in default_settings:
            setting["created_at"] = datetime.utcnow()
            setting["updated_at"] = datetime.utcnow()
        
        await database.db.admin_settings.insert_many(default_settings)
        logger.info("Default admin settings created")
    
    logger.info("Default data initialized")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)