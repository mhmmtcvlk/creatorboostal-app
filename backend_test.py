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
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://creatorboost-3.preview.emergentagent.com')
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
    
    async def run_all_tests(self):
        """Run all API tests"""
        print(f"🚀 Starting CreatorBoosta API Tests")
        print(f"📡 Backend URL: {API_BASE}")
        print("=" * 60)
        
        # Test sequence
        await self.test_health_check()
        await self.test_user_registration()
        await self.test_user_login()
        await self.test_get_current_user()
        await self.test_forum_categories()
        await self.test_vip_packages()
        await self.test_follow_creator_reward()
        await self.test_ad_watched_reward()
        await self.test_authentication_protection()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for r in self.results if r["success"])
        total = len(self.results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if total - passed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['message']}")
        
        return passed == total

async def main():
    """Main test runner"""
    async with CreatorBoostaAPITester() as tester:
        success = await tester.run_all_tests()
        return success

if __name__ == "__main__":
    success = asyncio.run(main())
    exit(0 if success else 1)