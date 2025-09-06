from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid

class UserRole(str, Enum):
    USER = "user"
    VIP = "vip" 
    ADMIN = "admin"

class VipPackage(str, Enum):
    STARTER = "starter"
    PRO = "pro"
    PREMIUM = "premium"

class Language(str, Enum):
    TR = "tr"
    EN = "en"

# User Models
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    security_question: str
    security_answer: str
    language: Language = Language.TR

class UserLogin(BaseModel):
    username: str
    password: str

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: EmailStr
    password_hash: str
    security_question: str
    security_answer_hash: str
    role: UserRole = UserRole.USER
    vip_package: Optional[VipPackage] = None
    vip_expires_at: Optional[datetime] = None
    credits: int = 0
    daily_ads_watched: int = 0
    last_ad_reset: datetime = Field(default_factory=datetime.utcnow)
    language: Language = Language.TR
    is_following_creator: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Social Media Models  
class SocialPlatform(str, Enum):
    INSTAGRAM = "instagram"
    TWITTER = "twitter"
    TIKTOK = "tiktok"
    YOUTUBE = "youtube"

class SocialAccountCreate(BaseModel):
    platform: SocialPlatform
    username: str
    display_name: str
    description: Optional[str] = None
    profile_image: Optional[str] = None  # base64 encoded
    followers_count: Optional[int] = 0
    category: Optional[str] = None

class SocialAccount(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    platform: SocialPlatform
    username: str
    display_name: str
    description: Optional[str] = None
    profile_image: Optional[str] = None
    followers_count: int = 0
    category: Optional[str] = None
    boost_count: int = 0
    boost_expires_at: Optional[datetime] = None
    is_featured: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Boost Models
class BoostCreate(BaseModel):
    social_account_id: str
    duration_hours: int = 24

class Boost(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    social_account_id: str
    credits_spent: int
    duration_hours: int
    started_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime
    is_active: bool = True

# VIP Package Models
class VipPackageInfo(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    name_en: str
    price: float
    duration_days: int
    features: List[str]
    features_en: List[str]
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class VipPurchase(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    package_id: str
    amount: float
    payment_method: str = "bank_transfer"
    payment_status: str = "pending"  # pending, approved, rejected
    telegram_payment_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Forum Models
class ForumCategory(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    name_en: str
    description: str
    description_en: str
    icon: Optional[str] = None
    is_active: bool = True

class ForumTopicCreate(BaseModel):
    category_id: str
    title: str
    content: str

class ForumTopic(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    category_id: str
    user_id: str
    title: str
    content: str
    replies_count: int = 0
    views_count: int = 0
    is_pinned: bool = False
    is_locked: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ForumReplyCreate(BaseModel):
    topic_id: str
    content: str

class ForumReply(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    topic_id: str
    user_id: str
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Message Models
class MessageCreate(BaseModel):
    receiver_id: str
    content: str

class Message(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sender_id: str
    receiver_id: str
    content: str
    is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Notification Models
class NotificationType(str, Enum):
    VIP_APPROVED = "vip_approved"
    BOOST_ACTIVATED = "boost_activated"
    BOOST_EXPIRING = "boost_expiring"
    NEW_MESSAGE = "new_message"
    FORUM_REPLY = "forum_reply"
    CREDITS_EARNED = "credits_earned"

class Notification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    type: NotificationType
    title: str
    title_en: str
    message: str  
    message_en: str
    is_read: bool = False
    data: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

# VIP Package Update Model
class VipPackageUpdate(BaseModel):
    price: Optional[float] = None
    is_active: Optional[bool] = None

# Admin Models
class AdminSettings(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    key: str
    value: str
    description: str
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Ad Reward Models
class AdReward(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    credits_earned: int = 5
    ad_provider: str = "admob"
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Response Models
class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    role: UserRole
    vip_package: Optional[VipPackage]
    vip_expires_at: Optional[datetime]
    credits: int
    language: Language
    is_following_creator: bool
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse