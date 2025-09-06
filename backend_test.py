#!/usr/bin/env python3
"""
CreatorBoosta Backend API Test Suite
Tests all major endpoints for the social media boost platform
"""

import asyncio
import aiohttp
import json
import os
from datetime import datetime
from typing import Dict, Any, Optional

# Get backend URL from environment
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://creatorboostal.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

class CreatorBoostaAPITester:
    def __init__(self):
        self.session: Optional[aiohttp.ClientSession] = None
        self.auth_token: Optional[str] = None
        self.test_user_data = {
            "username": "testuser_mehmet",
            "email": "mehmet.test@example.com", 
            "password": "TestPassword123!",
            "security_question": "En sevdiğin renk nedir?",
            "security_answer": "mavi",
            "language": "tr"
        }
        # Admin credentials from review request
        self.admin_data = {
            "username": "admin",  # Correct admin username
            "email": "mhmmdc83@gmail.com",
            "password": "admin123"
        }
        self.admin_token: Optional[str] = None
        self.test_user_id: Optional[str] = None
        self.vip_package_id: Optional[str] = None
        self.original_package_price: Optional[float] = None
        self.results = []
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def log_result(self, test_name: str, success: bool, message: str, response_data: Any = None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        
        self.results.append({
            "test": test_name,
            "success": success,
            "message": message,
            "response_data": response_data,
            "timestamp": datetime.now().isoformat()
        })
    
    async def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None) -> tuple[bool, Any]:
        """Make HTTP request and return success status and response data"""
        try:
            url = f"{API_BASE}{endpoint}"
            request_headers = {"Content-Type": "application/json"}
            
            if headers:
                request_headers.update(headers)
                
            if self.auth_token and "Authorization" not in request_headers:
                request_headers["Authorization"] = f"Bearer {self.auth_token}"
            
            async with self.session.request(
                method, 
                url, 
                json=data if data else None,
                headers=request_headers
            ) as response:
                try:
                    response_data = await response.json()
                except:
                    response_data = await response.text()
                
                return response.status < 400, {
                    "status": response.status,
                    "data": response_data
                }
        except Exception as e:
            return False, {"error": str(e)}
    
    async def test_health_check(self):
        """Test 1: Health check endpoint"""
        success, response = await self.make_request("GET", "/health")
        
        if success and response["status"] == 200:
            data = response["data"]
            if "status" in data and data["status"] == "healthy":
                self.log_result("Health Check", True, "API is healthy", data)
            else:
                self.log_result("Health Check", False, "Invalid health response format", response)
        else:
            self.log_result("Health Check", False, f"Health check failed: {response}", response)
    
    async def test_user_registration(self):
        """Test 2: User registration"""
        success, response = await self.make_request("POST", "/auth/register", self.test_user_data)
        
        if success and response["status"] == 200:
            data = response["data"]
            if "access_token" in data and "user" in data:
                self.auth_token = data["access_token"]
                user = data["user"]
                self.log_result("User Registration", True, 
                              f"User registered successfully: {user['username']}", data)
            else:
                self.log_result("User Registration", False, "Invalid registration response format", response)
        else:
            # Check if user already exists
            if response["status"] == 400 and "already exists" in str(response["data"]):
                self.log_result("User Registration", True, 
                              "User already exists (expected for repeated tests)", response)
                # Try to login instead
                await self.test_user_login()
            else:
                self.log_result("User Registration", False, f"Registration failed: {response}", response)
    
    async def test_user_login(self):
        """Test 3: User login"""
        login_data = {
            "username": self.test_user_data["username"],
            "password": self.test_user_data["password"]
        }
        
        success, response = await self.make_request("POST", "/auth/login", login_data)
        
        if success and response["status"] == 200:
            data = response["data"]
            if "access_token" in data and "user" in data:
                self.auth_token = data["access_token"]
                user = data["user"]
                self.log_result("User Login", True, 
                              f"Login successful for user: {user['username']}", data)
            else:
                self.log_result("User Login", False, "Invalid login response format", response)
        else:
            self.log_result("User Login", False, f"Login failed: {response}", response)
    
    async def test_get_current_user(self):
        """Test 4: Get current user with authentication"""
        if not self.auth_token:
            self.log_result("Get Current User", False, "No auth token available", None)
            return
            
        success, response = await self.make_request("GET", "/auth/me")
        
        if success and response["status"] == 200:
            data = response["data"]
            if "id" in data and "username" in data:
                self.log_result("Get Current User", True, 
                              f"Retrieved user info: {data['username']}", data)
            else:
                self.log_result("Get Current User", False, "Invalid user response format", response)
        else:
            self.log_result("Get Current User", False, f"Failed to get user info: {response}", response)
    
    async def test_forum_categories(self):
        """Test 5: Get forum categories"""
        success, response = await self.make_request("GET", "/forum/categories")
        
        if success and response["status"] == 200:
            data = response["data"]
            if isinstance(data, list):
                if len(data) > 0:
                    # Check if categories have expected structure
                    category = data[0]
                    if "name" in category and "description" in category:
                        self.log_result("Forum Categories", True, 
                                      f"Retrieved {len(data)} forum categories", data)
                    else:
                        self.log_result("Forum Categories", False, "Invalid category structure", response)
                else:
                    self.log_result("Forum Categories", True, "No categories found (empty list)", data)
            else:
                self.log_result("Forum Categories", False, "Response is not a list", response)
        else:
            self.log_result("Forum Categories", False, f"Failed to get categories: {response}", response)
    
    async def test_vip_packages(self):
        """Test 6: Get VIP packages"""
        success, response = await self.make_request("GET", "/vip/packages")
        
        if success and response["status"] == 200:
            data = response["data"]
            if isinstance(data, list):
                if len(data) > 0:
                    # Check if packages have expected structure
                    package = data[0]
                    if "name" in package and "price" in package and "features" in package:
                        self.log_result("VIP Packages", True, 
                                      f"Retrieved {len(data)} VIP packages", data)
                    else:
                        self.log_result("VIP Packages", False, "Invalid package structure", response)
                else:
                    self.log_result("VIP Packages", True, "No VIP packages found (empty list)", data)
            else:
                self.log_result("VIP Packages", False, "Response is not a list", response)
        else:
            self.log_result("VIP Packages", False, f"Failed to get VIP packages: {response}", response)
    
    async def test_follow_creator_reward(self):
        """Test 7: Follow creator reward system"""
        if not self.auth_token:
            self.log_result("Follow Creator Reward", False, "No auth token available", None)
            return
            
        success, response = await self.make_request("POST", "/follow-creator")
        
        if success and response["status"] == 200:
            data = response["data"]
            if "message" in data and "credits" in str(data["message"]).lower():
                self.log_result("Follow Creator Reward", True, 
                              f"Follow reward successful: {data['message']}", data)
            else:
                self.log_result("Follow Creator Reward", True, 
                              f"Follow reward response: {data}", data)
        else:
            # Check if already following
            if response["status"] == 400 and "already following" in str(response["data"]).lower():
                self.log_result("Follow Creator Reward", True, 
                              "Already following creator (expected for repeated tests)", response)
            else:
                self.log_result("Follow Creator Reward", False, f"Follow reward failed: {response}", response)
    
    async def test_ad_watched_reward(self):
        """Test 8: Ad watched reward system"""
        if not self.auth_token:
            self.log_result("Ad Watched Reward", False, "No auth token available", None)
            return
            
        success, response = await self.make_request("POST", "/rewards/ad-watched")
        
        if success and response["status"] == 200:
            data = response["data"]
            if "message" in data and "credits" in str(data["message"]).lower():
                self.log_result("Ad Watched Reward", True, 
                              f"Ad reward successful: {data['message']}", data)
            else:
                self.log_result("Ad Watched Reward", True, 
                              f"Ad reward response: {data}", data)
        else:
            # Check if daily limit reached
            if response["status"] == 400 and "daily" in str(response["data"]).lower():
                self.log_result("Ad Watched Reward", True, 
                              "Daily ad limit reached (expected behavior)", response)
            else:
                self.log_result("Ad Watched Reward", False, f"Ad reward failed: {response}", response)
    
    async def test_authentication_protection(self):
        """Test 9: Authentication protection on protected endpoints"""
        # Test without token
        old_token = self.auth_token
        self.auth_token = None
        
        success, response = await self.make_request("GET", "/auth/me")
        
        if not success or response["status"] == 401:
            self.log_result("Authentication Protection", True, 
                          "Protected endpoint correctly requires authentication", response)
        else:
            self.log_result("Authentication Protection", False, 
                          "Protected endpoint accessible without auth", response)
        
        # Restore token
        self.auth_token = old_token
    
    async def test_admin_login(self):
        """Test 10: Admin login with provided credentials"""
        # Try login with email first (as per review request)
        login_data = {
            "username": self.admin_data["email"],  # Try email as username
            "password": self.admin_data["password"]
        }
        
        success, response = await self.make_request("POST", "/auth/login", login_data)
        
        if success and response["status"] == 200:
            data = response["data"]
            if "access_token" in data and "user" in data:
                self.admin_token = data["access_token"]
                user = data["user"]
                if user.get("role") == "admin":
                    self.log_result("Admin Login", True, 
                                  f"Admin login successful: {user['username']} (role: {user['role']})", data)
                else:
                    self.log_result("Admin Login", False, 
                                  f"User logged in but role is not admin: {user.get('role')}", data)
            else:
                self.log_result("Admin Login", False, "Invalid login response format", response)
        else:
            # Try with username if email failed
            login_data = {
                "username": self.admin_data["username"],
                "password": self.admin_data["password"]
            }
            
            success, response = await self.make_request("POST", "/auth/login", login_data)
            
            if success and response["status"] == 200:
                data = response["data"]
                if "access_token" in data and "user" in data:
                    self.admin_token = data["access_token"]
                    user = data["user"]
                    if user.get("role") == "admin":
                        self.log_result("Admin Login", True, 
                                      f"Admin login successful: {user['username']} (role: {user['role']})", data)
                    else:
                        self.log_result("Admin Login", False, 
                                      f"User logged in but role is not admin: {user.get('role')}", data)
                else:
                    self.log_result("Admin Login", False, "Invalid login response format", response)
            else:
                self.log_result("Admin Login", False, f"Admin login failed with both email and username: {response}", response)
    
    async def test_admin_stats(self):
        """Test 11: Admin platform statistics"""
        if not self.admin_token:
            self.log_result("Admin Stats", False, "No admin token available", None)
            return
            
        # Use admin token for this request
        old_token = self.auth_token
        self.auth_token = self.admin_token
        
        success, response = await self.make_request("GET", "/admin/stats")
        
        if success and response["status"] == 200:
            data = response["data"]
            expected_fields = ["total_users", "vip_users", "total_boosts", "active_boosts", 
                             "total_topics", "total_social_accounts", "total_vip_purchases", "revenue"]
            
            if all(field in data for field in expected_fields):
                self.log_result("Admin Stats", True, 
                              f"Platform stats retrieved successfully: {len(data)} metrics", data)
            else:
                missing = [f for f in expected_fields if f not in data]
                self.log_result("Admin Stats", False, f"Missing stats fields: {missing}", response)
        else:
            self.log_result("Admin Stats", False, f"Failed to get admin stats: {response}", response)
        
        # Restore original token
        self.auth_token = old_token
    
    async def test_admin_get_users(self):
        """Test 12: Admin get all users"""
        if not self.admin_token:
            self.log_result("Admin Get Users", False, "No admin token available", None)
            return
            
        # Use admin token for this request
        old_token = self.auth_token
        self.auth_token = self.admin_token
        
        success, response = await self.make_request("GET", "/admin/users")
        
        if success and response["status"] == 200:
            data = response["data"]
            if isinstance(data, list):
                if len(data) > 0:
                    # Store a test user ID for later tests
                    for user in data:
                        if user.get("role") != "admin":
                            self.test_user_id = user.get("id")
                            break
                    
                    self.log_result("Admin Get Users", True, 
                                  f"Retrieved {len(data)} users successfully", {"user_count": len(data)})
                else:
                    self.log_result("Admin Get Users", True, "No users found (empty list)", data)
            else:
                self.log_result("Admin Get Users", False, "Response is not a list", response)
        else:
            self.log_result("Admin Get Users", False, f"Failed to get users: {response}", response)
        
        # Restore original token
        self.auth_token = old_token
    
    async def test_admin_update_user_role(self):
        """Test 13: Admin update user role"""
        if not self.admin_token or not self.test_user_id:
            self.log_result("Admin Update User Role", False, 
                          "No admin token or test user ID available", None)
            return
            
        # Use admin token for this request
        old_token = self.auth_token
        self.auth_token = self.admin_token
        
        # Try to update user role to VIP - the endpoint expects the role as request body
        success, response = await self.make_request("PUT", f"/admin/users/{self.test_user_id}/role", "vip")
        
        if success and response["status"] == 200:
            data = response["data"]
            if "message" in data and "role updated" in data["message"].lower():
                self.log_result("Admin Update User Role", True, 
                              f"User role updated successfully: {data['message']}", data)
            else:
                self.log_result("Admin Update User Role", True, 
                              f"Role update response: {data}", data)
        else:
            self.log_result("Admin Update User Role", False, 
                          f"Failed to update user role: {response}", response)
        
        # Restore original token
        self.auth_token = old_token
    
    async def test_admin_update_user_credits(self):
        """Test 14: Admin update user credits"""
        if not self.admin_token or not self.test_user_id:
            self.log_result("Admin Update User Credits", False, 
                          "No admin token or test user ID available", None)
            return
            
        # Use admin token for this request
        old_token = self.auth_token
        self.auth_token = self.admin_token
        
        # Try to update user credits - the endpoint expects credits as a query parameter
        success, response = await self.make_request("PUT", f"/admin/users/{self.test_user_id}/credits?credits=1000")
        
        if success and response["status"] == 200:
            data = response["data"]
            if "message" in data and "credits updated" in data["message"].lower():
                self.log_result("Admin Update User Credits", True, 
                              f"User credits updated successfully: {data['message']}", data)
            else:
                self.log_result("Admin Update User Credits", True, 
                              f"Credits update response: {data}", data)
        else:
            self.log_result("Admin Update User Credits", False, 
                          f"Failed to update user credits: {response}", response)
        
        # Restore original token
        self.auth_token = old_token
    
    async def test_admin_broadcast_message(self):
        """Test 15: Admin broadcast message to all users"""
        if not self.admin_token:
            self.log_result("Admin Broadcast Message", False, "No admin token available", None)
            return
            
        # Use admin token for this request
        old_token = self.auth_token
        self.auth_token = self.admin_token
        
        # The broadcast endpoint expects title and message as query parameters
        title = "Test Broadcast Message"
        message = "Bu bir test mesajıdır. This is a test message."
        
        success, response = await self.make_request("POST", f"/admin/broadcast?title={title}&message={message}")
        
        if success and response["status"] == 200:
            data = response["data"]
            if "message" in data and "broadcasted" in data["message"].lower():
                self.log_result("Admin Broadcast Message", True, 
                              f"Broadcast successful: {data['message']}", data)
            else:
                self.log_result("Admin Broadcast Message", True, 
                              f"Broadcast response: {data}", data)
        else:
            self.log_result("Admin Broadcast Message", False, 
                          f"Failed to broadcast message: {response}", response)
        
        # Restore original token
        self.auth_token = old_token
    
    async def test_admin_grant_vip(self):
        """Test 16: Admin grant VIP to user"""
        if not self.admin_token or not self.test_user_id:
            self.log_result("Admin Grant VIP", False, 
                          "No admin token or test user ID available", None)
            return
            
        # Use admin token for this request
        old_token = self.auth_token
        self.auth_token = self.admin_token
        
        # The VIP endpoint expects package and duration_days as query parameters
        success, response = await self.make_request("POST", f"/admin/vip/{self.test_user_id}?package=starter&duration_days=30")
        
        if success and response["status"] == 200:
            data = response["data"]
            if "message" in data and "vip" in data["message"].lower():
                self.log_result("Admin Grant VIP", True, 
                              f"VIP granted successfully: {data['message']}", data)
            else:
                self.log_result("Admin Grant VIP", True, 
                              f"VIP grant response: {data}", data)
        else:
            self.log_result("Admin Grant VIP", False, 
                          f"Failed to grant VIP: {response}", response)
        
        # Restore original token
        self.auth_token = old_token
    
    async def test_admin_get_settings(self):
        """Test 17: Admin get settings"""
        if not self.admin_token:
            self.log_result("Admin Get Settings", False, "No admin token available", None)
            return
            
        # Use admin token for this request
        old_token = self.auth_token
        self.auth_token = self.admin_token
        
        success, response = await self.make_request("GET", "/admin/settings")
        
        if success and response["status"] == 200:
            data = response["data"]
            if isinstance(data, dict):
                expected_settings = ["telegram_bot_token", "creator_instagram", "company_name"]
                found_settings = [s for s in expected_settings if s in data]
                
                if len(found_settings) > 0:
                    self.log_result("Admin Get Settings", True, 
                                  f"Admin settings retrieved: {len(data)} settings", 
                                  {"settings_count": len(data), "sample_keys": list(data.keys())[:5]})
                else:
                    self.log_result("Admin Get Settings", False, 
                                  f"No expected settings found in response", response)
            else:
                self.log_result("Admin Get Settings", False, "Response is not a dictionary", response)
        else:
            self.log_result("Admin Get Settings", False, f"Failed to get admin settings: {response}", response)
        
        # Restore original token
        self.auth_token = old_token
    
    async def test_admin_update_settings(self):
        """Test 18: Admin update settings"""
        if not self.admin_token:
            self.log_result("Admin Update Settings", False, "No admin token available", None)
            return
            
        # Use admin token for this request
        old_token = self.auth_token
        self.auth_token = self.admin_token
        
        settings_update = {
            "company_name": "CreatorBoostal Test",
            "support_email": "test@creatorboostal.com"
        }
        
        success, response = await self.make_request("PUT", "/admin/settings", settings_update)
        
        if success and response["status"] == 200:
            data = response["data"]
            if "message" in data and "updated" in data["message"].lower():
                self.log_result("Admin Update Settings", True, 
                              f"Settings updated successfully: {data['message']}", data)
            else:
                self.log_result("Admin Update Settings", True, 
                              f"Settings update response: {data}", data)
        else:
            self.log_result("Admin Update Settings", False, 
                          f"Failed to update settings: {response}", response)
        
        # Restore original token
        self.auth_token = old_token
    
    async def test_vip_packages_for_admin_update(self):
        """Test 19: Get VIP packages to prepare for admin updates"""
        success, response = await self.make_request("GET", "/vip/packages")
        
        if success and response["status"] == 200:
            data = response["data"]
            if isinstance(data, list) and len(data) > 0:
                # Store the first package ID for update tests
                self.vip_package_id = data[0].get("id")
                self.original_package_price = data[0].get("price")
                self.log_result("VIP Packages for Admin Update", True, 
                              f"Retrieved {len(data)} VIP packages for admin testing", 
                              {"package_count": len(data), "first_package_id": self.vip_package_id})
            else:
                self.log_result("VIP Packages for Admin Update", False, 
                              "No VIP packages available for admin update testing", response)
        else:
            self.log_result("VIP Packages for Admin Update", False, 
                          f"Failed to get VIP packages: {response}", response)
    
    async def test_admin_vip_package_price_update(self):
        """Test 20: Admin VIP package price update"""
        if not self.admin_token:
            self.log_result("Admin VIP Package Price Update", False, "No admin token available", None)
            return
            
        if not hasattr(self, 'vip_package_id') or not self.vip_package_id:
            self.log_result("Admin VIP Package Price Update", False, "No VIP package ID available", None)
            return
            
        # Use admin token for this request
        old_token = self.auth_token
        self.auth_token = self.admin_token
        
        # Test price update using VipPackageUpdate model
        new_price = 39.99
        update_data = {
            "price": new_price
        }
        
        success, response = await self.make_request("PUT", f"/admin/vip/packages/{self.vip_package_id}", update_data)
        
        if success and response["status"] == 200:
            data = response["data"]
            if "message" in data and "updated" in data["message"].lower():
                self.log_result("Admin VIP Package Price Update", True, 
                              f"VIP package price updated successfully: {data['message']}", data)
            else:
                self.log_result("Admin VIP Package Price Update", True, 
                              f"VIP package price update response: {data}", data)
        else:
            self.log_result("Admin VIP Package Price Update", False, 
                          f"Failed to update VIP package price: {response}", response)
        
        # Restore original token
        self.auth_token = old_token
    
    async def test_admin_vip_package_status_update(self):
        """Test 21: Admin VIP package status update"""
        if not self.admin_token:
            self.log_result("Admin VIP Package Status Update", False, "No admin token available", None)
            return
            
        if not hasattr(self, 'vip_package_id') or not self.vip_package_id:
            self.log_result("Admin VIP Package Status Update", False, "No VIP package ID available", None)
            return
            
        # Use admin token for this request
        old_token = self.auth_token
        self.auth_token = self.admin_token
        
        # Test status update using VipPackageUpdate model
        update_data = {
            "is_active": False
        }
        
        success, response = await self.make_request("PUT", f"/admin/vip/packages/{self.vip_package_id}", update_data)
        
        if success and response["status"] == 200:
            data = response["data"]
            if "message" in data and "updated" in data["message"].lower():
                self.log_result("Admin VIP Package Status Update", True, 
                              f"VIP package status updated successfully: {data['message']}", data)
            else:
                self.log_result("Admin VIP Package Status Update", True, 
                              f"VIP package status update response: {data}", data)
        else:
            self.log_result("Admin VIP Package Status Update", False, 
                          f"Failed to update VIP package status: {response}", response)
        
        # Restore original token
        self.auth_token = old_token
    
    async def test_admin_vip_package_combined_update(self):
        """Test 22: Admin VIP package combined price and status update"""
        if not self.admin_token:
            self.log_result("Admin VIP Package Combined Update", False, "No admin token available", None)
            return
            
        if not hasattr(self, 'vip_package_id') or not self.vip_package_id:
            self.log_result("Admin VIP Package Combined Update", False, "No VIP package ID available", None)
            return
            
        # Use admin token for this request
        old_token = self.auth_token
        self.auth_token = self.admin_token
        
        # Test combined update using VipPackageUpdate model
        update_data = {
            "price": 49.99,
            "is_active": True
        }
        
        success, response = await self.make_request("PUT", f"/admin/vip/packages/{self.vip_package_id}", update_data)
        
        if success and response["status"] == 200:
            data = response["data"]
            if "message" in data and "updated" in data["message"].lower():
                self.log_result("Admin VIP Package Combined Update", True, 
                              f"VIP package combined update successful: {data['message']}", data)
            else:
                self.log_result("Admin VIP Package Combined Update", True, 
                              f"VIP package combined update response: {data}", data)
        else:
            self.log_result("Admin VIP Package Combined Update", False, 
                          f"Failed to update VIP package (combined): {response}", response)
        
        # Restore original token
        self.auth_token = old_token
    
    async def test_admin_vip_package_invalid_id(self):
        """Test 23: Admin VIP package update with invalid package ID"""
        if not self.admin_token:
            self.log_result("Admin VIP Package Invalid ID", False, "No admin token available", None)
            return
            
        # Use admin token for this request
        old_token = self.auth_token
        self.auth_token = self.admin_token
        
        # Test with invalid package ID
        invalid_package_id = "invalid-package-id-12345"
        update_data = {
            "price": 29.99
        }
        
        success, response = await self.make_request("PUT", f"/admin/vip/packages/{invalid_package_id}", update_data)
        
        if not success or response["status"] == 404:
            self.log_result("Admin VIP Package Invalid ID", True, 
                          "Correctly handled invalid package ID with 404 error", response)
        else:
            self.log_result("Admin VIP Package Invalid ID", False, 
                          f"Should have returned 404 for invalid package ID: {response}", response)
        
        # Restore original token
        self.auth_token = old_token
    
    async def test_admin_vip_package_no_auth(self):
        """Test 24: Admin VIP package update without authentication"""
        if not hasattr(self, 'vip_package_id') or not self.vip_package_id:
            self.log_result("Admin VIP Package No Auth", False, "No VIP package ID available", None)
            return
            
        # Test without admin token
        old_token = self.auth_token
        self.auth_token = None
        
        update_data = {
            "price": 29.99
        }
        
        success, response = await self.make_request("PUT", f"/admin/vip/packages/{self.vip_package_id}", update_data)
        
        if not success or response["status"] == 401:
            self.log_result("Admin VIP Package No Auth", True, 
                          "Correctly requires authentication for VIP package updates", response)
        else:
            self.log_result("Admin VIP Package No Auth", False, 
                          f"Should require authentication for VIP package updates: {response}", response)
        
        # Restore original token
        self.auth_token = old_token
    
    async def run_all_tests(self):
        """Run all API tests including admin functionality"""
        print(f"🚀 Starting CreatorBoosta API Tests (Including Admin Features)")
        print(f"📡 Backend URL: {API_BASE}")
        print("=" * 60)
        
        # Basic API test sequence
        await self.test_health_check()
        await self.test_user_registration()
        await self.test_user_login()
        await self.test_get_current_user()
        await self.test_forum_categories()
        await self.test_vip_packages()
        await self.test_follow_creator_reward()
        await self.test_ad_watched_reward()
        await self.test_authentication_protection()
        
        # Admin functionality tests
        print("\n" + "=" * 60)
        print("🔐 ADMIN FUNCTIONALITY TESTS")
        print("=" * 60)
        
        await self.test_admin_login()
        await self.test_admin_stats()
        await self.test_admin_get_users()
        await self.test_admin_update_user_role()
        await self.test_admin_update_user_credits()
        await self.test_admin_broadcast_message()
        await self.test_admin_grant_vip()
        await self.test_admin_get_settings()
        await self.test_admin_update_settings()
        
        # VIP Package Update Tests (Critical for Save/Purchase buttons)
        print("\n" + "=" * 60)
        print("📦 VIP PACKAGE UPDATE TESTS")
        print("=" * 60)
        
        await self.test_vip_packages_for_admin_update()
        await self.test_admin_vip_package_price_update()
        await self.test_admin_vip_package_status_update()
        await self.test_admin_vip_package_combined_update()
        await self.test_admin_vip_package_invalid_id()
        await self.test_admin_vip_package_no_auth()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for r in self.results if r["success"])
        total = len(self.results)
        
        # Separate basic and admin test results
        basic_tests = [r for r in self.results if not r["test"].startswith("Admin")]
        admin_tests = [r for r in self.results if r["test"].startswith("Admin")]
        
        basic_passed = sum(1 for r in basic_tests if r["success"])
        admin_passed = sum(1 for r in admin_tests if r["success"])
        
        print(f"Total Tests: {total}")
        print(f"Basic API Tests: {len(basic_tests)} (Passed: {basic_passed})")
        print(f"Admin Tests: {len(admin_tests)} (Passed: {admin_passed})")
        print(f"Overall Success Rate: {(passed/total)*100:.1f}%")
        
        if total - passed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['message']}")
        
        if admin_passed == len(admin_tests) and len(admin_tests) > 0:
            print("\n✅ ALL ADMIN FEATURES WORKING CORRECTLY!")
        
        return passed == total

async def main():
    """Main test runner"""
    async with CreatorBoostaAPITester() as tester:
        success = await tester.run_all_tests()
        return success

if __name__ == "__main__":
    success = asyncio.run(main())
    exit(0 if success else 1)