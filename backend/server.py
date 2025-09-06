from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path
import os
import logging
from datetime import datetime, timedelta
from typing import Optional, List

# Import our modules
from models import *
from auth import create_access_token, verify_token
from database import database

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create the main app
app = FastAPI(title="CreatorBoosta API", version="1.0.0")

# Security
security = HTTPBearer()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create API router
api_router = APIRouter(prefix="/api")

# Dependency to get current user
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    username = verify_token(credentials.credentials)
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = await database.get_user_by_username(username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    return user

# Optional auth dependency
async def get_current_user_optional(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[User]:
    if not credentials:
        return None
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None

# Startup and shutdown events
@app.on_event("startup")
async def startup_db_client():
    await database.connect_to_mongo()
    # Initialize default data
    await initialize_default_data()

@app.on_event("shutdown")
async def shutdown_db_client():
    await database.close_mongo_connection()

async def initialize_default_data():
    """Initialize default forum categories and VIP packages"""
    try:
        # Check if forum categories exist
        categories = await database.get_forum_categories()
        if not categories:
            default_categories = [
                ForumCategory(
                    name="Instagram Pazarlama",
                    name_en="Instagram Marketing", 
                    description="Instagram büyüme stratejileri ve ipuçları",
                    description_en="Instagram growth strategies and tips",
                    icon="instagram"
                ),
                ForumCategory(
                    name="TikTok Büyüme",
                    name_en="TikTok Growth",
                    description="TikTok viral olma teknikleri",
                    description_en="TikTok viral techniques",
                    icon="tiktok"
                ),
                ForumCategory(
                    name="YouTube Creator",
                    name_en="YouTube Creator",
                    description="YouTube kanal büyütme rehberi",
                    description_en="YouTube channel growth guide",
                    icon="youtube"
                ),
                ForumCategory(
                    name="Genel Sosyal Medya",
                    name_en="General Social Media",
                    description="Tüm platformlar için genel ipuçları",
                    description_en="General tips for all platforms",
                    icon="share"
                )
            ]
            
            for category in default_categories:
                await database.db.forum_categories.insert_one(category.dict())
        
        # Check if VIP packages exist
        packages = await database.get_vip_packages()
        if not packages:
            default_packages = [
                VipPackageInfo(
                    name="Starter VIP",
                    name_en="Starter VIP",
                    price=29.99,
                    duration_days=30,
                    features=[
                        "AI destekli içerik önerileri",
                        "Boost'ta %20 öncelik",
                        "Günlük 10 bonus kredi",
                        "Özel VIP rozeti",
                        "Mesajlaşma özelliği"
                    ],
                    features_en=[
                        "AI-powered content suggestions",
                        "20% boost priority",
                        "10 daily bonus credits",
                        "Exclusive VIP badge",
                        "Messaging feature"
                    ]
                ),
                VipPackageInfo(
                    name="Pro VIP",
                    name_en="Pro VIP",
                    price=49.99,
                    duration_days=30,
                    features=[
                        "Gelişmiş AI analitikleri",
                        "Boost'ta %50 öncelik",
                        "Günlük 25 bonus kredi",
                        "Altın VIP rozeti",
                        "Öncelikli destek",
                        "Özel kategori erişimi"
                    ],
                    features_en=[
                        "Advanced AI analytics",
                        "50% boost priority", 
                        "25 daily bonus credits",
                        "Gold VIP badge",
                        "Priority support",
                        "Exclusive category access"
                    ]
                ),
                VipPackageInfo(
                    name="Premium VIP",
                    name_en="Premium VIP",
                    price=99.99,
                    duration_days=30,
                    features=[
                        "Tam AI destekli otomatik içerik",
                        "Boost'ta %100 öncelik",
                        "Günlük 50 bonus kredi",
                        "Elmas VIP rozeti",
                        "Kişisel hesap yöneticisi",
                        "Özel etkinlik erişimi",
                        "Gelişmiş hesap analitikleri"
                    ],
                    features_en=[
                        "Full AI-powered auto content",
                        "100% boost priority",
                        "50 daily bonus credits", 
                        "Diamond VIP badge",
                        "Personal account manager",
                        "Exclusive event access",
                        "Advanced account analytics"
                    ]
                )
            ]
            
            for package in default_packages:
                await database.db.vip_packages.insert_one(package.dict())
        
        logger.info("Default data initialized")
    except Exception as e:
        logger.error(f"Error initializing default data: {e}")

# Routes
@api_router.get("/")
async def root():
    return {"message": "CreatorBoosta API v1.0.0", "status": "active"}

# Health check
@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Auth Routes
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    """Register a new user"""
    user = await database.create_user(user_data)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already exists"
        )
    
    # Create welcome notification
    welcome_notification = Notification(
        user_id=user.id,
        type=NotificationType.CREDITS_EARNED,
        title="Hoş Geldiniz!",
        title_en="Welcome!",
        message="CreatorBoosta'ya hoş geldiniz! 10 bonus kredi kazandınız.",
        message_en="Welcome to CreatorBoosta! You earned 10 bonus credits."
    )
    await database.create_notification(welcome_notification)
    
    # Give welcome credits
    await database.update_user_credits(user.id, 10)
    
    # Create access token
    access_token = create_access_token(data={"sub": user.username})
    
    user_response = UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        role=user.role,
        vip_package=user.vip_package,
        vip_expires_at=user.vip_expires_at,
        credits=10,  # Updated credits
        language=user.language,
        is_following_creator=user.is_following_creator,
        created_at=user.created_at
    )
    
    return TokenResponse(access_token=access_token, user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse) 
async def login(login_data: UserLogin):
    """Login user"""
    user = await database.authenticate_user(login_data.username, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    access_token = create_access_token(data={"sub": user.username})
    
    user_response = UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        role=user.role,
        vip_package=user.vip_package,
        vip_expires_at=user.vip_expires_at,
        credits=user.credits,
        language=user.language,
        is_following_creator=user.is_following_creator,
        created_at=user.created_at
    )
    
    return TokenResponse(access_token=access_token, user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        role=current_user.role,
        vip_package=current_user.vip_package,
        vip_expires_at=current_user.vip_expires_at,
        credits=current_user.credits,
        language=current_user.language,
        is_following_creator=current_user.is_following_creator,
        created_at=current_user.created_at
    )

# Social Media Routes
@api_router.post("/social/accounts", response_model=SocialAccount)
async def create_social_account(
    account_data: SocialAccountCreate,
    current_user: User = Depends(get_current_user)
):
    """Create social media account"""
    account = await database.create_social_account(current_user.id, account_data)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error creating social account"
        )
    return account

@api_router.get("/social/discover", response_model=List[SocialAccount])
async def discover_accounts(skip: int = 0, limit: int = 20):
    """Discover social media accounts"""
    return await database.get_social_accounts(limit=limit, skip=skip)

# Boost Routes
@api_router.post("/boost/create", response_model=Boost)
async def create_boost(
    boost_data: BoostCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a boost"""
    boost = await database.create_boost(current_user.id, boost_data)
    if not boost:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient credits or error creating boost"
        )
    
    # Create notification
    notification = Notification(
        user_id=current_user.id,
        type=NotificationType.BOOST_ACTIVATED,
        title="Boost Aktifleşti!",
        title_en="Boost Activated!",
        message=f"Hesabınız {boost_data.duration_hours} saat boyunca boost alacak.",
        message_en=f"Your account will be boosted for {boost_data.duration_hours} hours."
    )
    await database.create_notification(notification)
    
    return boost

# VIP Routes
@api_router.get("/vip/packages", response_model=List[VipPackageInfo])
async def get_vip_packages():
    """Get VIP packages"""
    return await database.get_vip_packages()

# Forum Routes
@api_router.get("/forum/categories", response_model=List[ForumCategory])
async def get_forum_categories():
    """Get forum categories"""
    return await database.get_forum_categories()

@api_router.get("/forum/topics", response_model=List[ForumTopic])
async def get_forum_topics(category_id: Optional[str] = None, skip: int = 0, limit: int = 20):
    """Get forum topics"""
    return await database.get_forum_topics(category_id=category_id, skip=skip, limit=limit)

@api_router.post("/forum/topics", response_model=ForumTopic)
async def create_forum_topic(
    topic_data: ForumTopicCreate,
    current_user: User = Depends(get_current_user)
):
    """Create forum topic"""
    topic = await database.create_forum_topic(current_user.id, topic_data)
    if not topic:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error creating forum topic"
        )
    return topic

# Notification Routes
@api_router.get("/notifications", response_model=List[Notification])
async def get_notifications(current_user: User = Depends(get_current_user)):
    """Get user notifications"""
    return await database.get_user_notifications(current_user.id)

@api_router.post("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user)
):
    """Mark notification as read"""
    result = await database.db.notifications.update_one(
        {"id": notification_id, "user_id": current_user.id},
        {"$set": {"is_read": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    return {"message": "Notification marked as read"}

# Credits and Rewards Routes
@api_router.post("/rewards/ad-watched")
async def reward_ad_watched(current_user: User = Depends(get_current_user)):
    """Reward user for watching ad"""
    # Check daily limit
    today = datetime.utcnow().date()
    if current_user.last_ad_reset.date() != today:
        # Reset daily counter
        await database.db.users.update_one(
            {"id": current_user.id},
            {"$set": {"daily_ads_watched": 0, "last_ad_reset": datetime.utcnow()}}
        )
        current_user.daily_ads_watched = 0
    
    if current_user.daily_ads_watched >= 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Daily ad limit reached"
        )
    
    # Give credits and update counter
    await database.update_user_credits(current_user.id, 5)
    await database.db.users.update_one(
        {"id": current_user.id},
        {"$inc": {"daily_ads_watched": 1}}
    )
    
    # Create ad reward record
    ad_reward = AdReward(user_id=current_user.id)
    await database.db.ad_rewards.insert_one(ad_reward.dict())
    
    # Create notification
    notification = Notification(
        user_id=current_user.id,
        type=NotificationType.CREDITS_EARNED,
        title="Kredi Kazandınız!",
        title_en="Credits Earned!",
        message="Reklam izlediğiniz için 5 kredi kazandınız.",
        message_en="You earned 5 credits for watching an ad."
    )
    await database.create_notification(notification)
    
    return {"message": "5 credits awarded", "total_credits": current_user.credits + 5}

# Follow Creator Route
@api_router.post("/follow-creator")
async def follow_creator(current_user: User = Depends(get_current_user)):
    """Mark user as following creator and give reward"""
    if current_user.is_following_creator:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already following creator"
        )
    
    # Update user
    await database.db.users.update_one(
        {"id": current_user.id},
        {"$set": {"is_following_creator": True}, "$inc": {"credits": 10}}
    )
    
    # Create notification  
    notification = Notification(
        user_id=current_user.id,
        type=NotificationType.CREDITS_EARNED,
        title="Takip Ödülü!",
        title_en="Follow Reward!",
        message="@mhmmtcvlk'ı takip ettiğiniz için 10 kredi kazandınız!",
        message_en="You earned 10 credits for following @mhmmtcvlk!"
    )
    await database.create_notification(notification)
    
    return {"message": "Creator followed, 10 credits awarded"}

# Include router
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)