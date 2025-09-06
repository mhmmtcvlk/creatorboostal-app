from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import os
from .models import *
from .auth import get_password_hash, verify_password
import logging

logger = logging.getLogger(__name__)

class Database:
    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.db = None
    
    async def connect_to_mongo(self):
        """Create database connection"""
        mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
        db_name = os.environ.get('DB_NAME', 'creatorboosta')
        
        self.client = AsyncIOMotorClient(mongo_url)
        self.db = self.client[db_name]
        
        # Create indexes
        await self.create_indexes()
        logger.info("Connected to MongoDB")
    
    async def close_mongo_connection(self):
        """Close database connection"""
        if self.client:
            self.client.close()
            logger.info("Disconnected from MongoDB")
    
    async def create_indexes(self):
        """Create database indexes"""
        try:
            # Users indexes
            await self.db.users.create_index("username", unique=True)
            await self.db.users.create_index("email", unique=True)
            
            # Social accounts indexes
            await self.db.social_accounts.create_index([("platform", 1), ("username", 1)])
            await self.db.social_accounts.create_index("user_id")
            
            # Forum indexes
            await self.db.forum_topics.create_index("category_id")
            await self.db.forum_topics.create_index("user_id")
            await self.db.forum_replies.create_index("topic_id")
            
            # Notifications indexes
            await self.db.notifications.create_index([("user_id", 1), ("created_at", -1)])
            
            logger.info("Database indexes created")
        except Exception as e:
            logger.error(f"Error creating indexes: {e}")
    
    # User operations
    async def create_user(self, user_data: UserCreate) -> Optional[User]:
        """Create a new user"""
        try:
            # Check if user already exists
            existing = await self.db.users.find_one({
                "$or": [
                    {"username": user_data.username},
                    {"email": user_data.email}
                ]
            })
            
            if existing:
                return None
            
            user = User(
                username=user_data.username,
                email=user_data.email,
                password_hash=get_password_hash(user_data.password),
                security_question=user_data.security_question,
                security_answer_hash=get_password_hash(user_data.security_answer.lower()),
                language=user_data.language
            )
            
            await self.db.users.insert_one(user.dict())
            return user
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            return None
    
    async def authenticate_user(self, username: str, password: str) -> Optional[User]:
        """Authenticate user login"""
        try:
            user_doc = await self.db.users.find_one({"username": username})
            if not user_doc or not verify_password(password, user_doc["password_hash"]):
                return None
            return User(**user_doc)
        except Exception as e:
            logger.error(f"Error authenticating user: {e}")
            return None
    
    async def get_user_by_username(self, username: str) -> Optional[User]:
        """Get user by username"""
        try:
            user_doc = await self.db.users.find_one({"username": username})
            return User(**user_doc) if user_doc else None
        except Exception as e:
            logger.error(f"Error getting user: {e}")
            return None
    
    async def update_user_credits(self, user_id: str, credits: int) -> bool:
        """Update user credits"""
        try:
            result = await self.db.users.update_one(
                {"id": user_id},
                {"$inc": {"credits": credits}, "$set": {"updated_at": datetime.utcnow()}}
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error updating user credits: {e}")
            return False
    
    # Social Account operations
    async def create_social_account(self, user_id: str, account_data: SocialAccountCreate) -> Optional[SocialAccount]:
        """Create social media account"""
        try:
            account = SocialAccount(
                user_id=user_id,
                **account_data.dict()
            )
            await self.db.social_accounts.insert_one(account.dict())
            return account
        except Exception as e:
            logger.error(f"Error creating social account: {e}")
            return None
    
    async def get_social_accounts(self, limit: int = 50, skip: int = 0) -> List[SocialAccount]:
        """Get social accounts for discovery"""
        try:
            cursor = self.db.social_accounts.find().sort("boost_expires_at", -1).skip(skip).limit(limit)
            accounts = []
            async for doc in cursor:
                accounts.append(SocialAccount(**doc))
            return accounts
        except Exception as e:
            logger.error(f"Error getting social accounts: {e}")
            return []
    
    # Boost operations
    async def create_boost(self, user_id: str, boost_data: BoostCreate) -> Optional[Boost]:
        """Create a boost"""
        try:
            # Check user credits
            user = await self.get_user_by_username("")  # Need to get by id
            credits_needed = boost_data.duration_hours  # 1 credit per hour
            
            boost = Boost(
                user_id=user_id,
                social_account_id=boost_data.social_account_id,
                credits_spent=credits_needed,
                duration_hours=boost_data.duration_hours,
                expires_at=datetime.utcnow() + timedelta(hours=boost_data.duration_hours)
            )
            
            # Start transaction-like operation
            await self.db.boosts.insert_one(boost.dict())
            await self.db.users.update_one(
                {"id": user_id},
                {"$inc": {"credits": -credits_needed}}
            )
            await self.db.social_accounts.update_one(
                {"id": boost_data.social_account_id},
                {
                    "$inc": {"boost_count": 1},
                    "$set": {"boost_expires_at": boost.expires_at, "is_featured": True}
                }
            )
            
            return boost
        except Exception as e:
            logger.error(f"Error creating boost: {e}")
            return None
    
    # VIP Package operations
    async def get_vip_packages(self) -> List[VipPackageInfo]:
        """Get all active VIP packages"""
        try:
            cursor = self.db.vip_packages.find({"is_active": True})
            packages = []
            async for doc in cursor:
                packages.append(VipPackageInfo(**doc))
            return packages
        except Exception as e:
            logger.error(f"Error getting VIP packages: {e}")
            return []
    
    # Forum operations
    async def get_forum_categories(self) -> List[ForumCategory]:
        """Get forum categories"""
        try:
            cursor = self.db.forum_categories.find({"is_active": True})
            categories = []
            async for doc in cursor:
                categories.append(ForumCategory(**doc))
            return categories
        except Exception as e:
            logger.error(f"Error getting forum categories: {e}")
            return []
    
    async def create_forum_topic(self, user_id: str, topic_data: ForumTopicCreate) -> Optional[ForumTopic]:
        """Create forum topic"""
        try:
            topic = ForumTopic(
                user_id=user_id,
                **topic_data.dict()
            )
            await self.db.forum_topics.insert_one(topic.dict())
            return topic
        except Exception as e:
            logger.error(f"Error creating forum topic: {e}")
            return None
    
    async def get_forum_topics(self, category_id: Optional[str] = None, limit: int = 20, skip: int = 0) -> List[ForumTopic]:
        """Get forum topics"""
        try:
            filter_query = {"category_id": category_id} if category_id else {}
            cursor = self.db.forum_topics.find(filter_query).sort("created_at", -1).skip(skip).limit(limit)
            topics = []
            async for doc in cursor:
                topics.append(ForumTopic(**doc))
            return topics
        except Exception as e:
            logger.error(f"Error getting forum topics: {e}")
            return []
    
    # Notification operations
    async def create_notification(self, notification: Notification) -> bool:
        """Create notification"""
        try:
            await self.db.notifications.insert_one(notification.dict())
            return True
        except Exception as e:
            logger.error(f"Error creating notification: {e}")
            return False
    
    async def get_user_notifications(self, user_id: str, limit: int = 50) -> List[Notification]:
        """Get user notifications"""
        try:
            cursor = self.db.notifications.find({"user_id": user_id}).sort("created_at", -1).limit(limit)
            notifications = []
            async for doc in cursor:
                notifications.append(Notification(**doc))
            return notifications
        except Exception as e:
            logger.error(f"Error getting notifications: {e}")
            return []

# Global database instance
database = Database()