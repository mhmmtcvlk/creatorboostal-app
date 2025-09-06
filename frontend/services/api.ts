import axios, { AxiosInstance, AxiosError } from 'axios';
import Constants from 'expo-constants';
import { TokenResponse, LoginData, RegisterData, User } from '../types/auth';
import { SocialAccount, SocialAccountCreate, Boost, BoostCreate } from '../types/social';
import { ForumCategory, ForumTopic, ForumTopicCreate } from '../types/forum';
import { VipPackage } from '../types/vip';
import { Notification } from '../types/notification';

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    const baseURL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || 
                   process.env.EXPO_PUBLIC_BACKEND_URL || 
                   'https://creatorboostal.preview.emergentagent.com';

    this.client = axios.create({
      baseURL: `${baseURL}/api`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error: AxiosError) => {
        console.error('API Error:', error.response?.status, error.response?.data || error.message);
        
        if (error.response?.status === 401) {
          this.token = null;
          // Handle unauthorized - could emit event for logout
        }
        
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string | null) {
    this.token = token;
  }

  // Auth endpoints
  async login(data: LoginData): Promise<TokenResponse> {
    const response = await this.client.post<TokenResponse>('/auth/login', data);
    return response.data;
  }

  async register(data: RegisterData): Promise<TokenResponse> {
    const response = await this.client.post<TokenResponse>('/auth/register', data);
    return response.data;
  }

  async getMe(): Promise<User> {
    const response = await this.client.get<User>('/auth/me');
    return response.data;
  }

  // Social endpoints
  async createSocialAccount(data: SocialAccountCreate): Promise<SocialAccount> {
    const response = await this.client.post<SocialAccount>('/social/accounts', data);
    return response.data;
  }

  async discoverAccounts(skip: number = 0, limit: number = 20): Promise<SocialAccount[]> {
    const response = await this.client.get<SocialAccount[]>(`/social/discover?skip=${skip}&limit=${limit}`);
    return response.data;
  }

  // Boost endpoints
  async createBoost(data: BoostCreate): Promise<Boost> {
    const response = await this.client.post<Boost>('/boost/create', data);
    return response.data;
  }

  // VIP endpoints
  async getVipPackages(): Promise<VipPackage[]> {
    const response = await this.client.get<VipPackage[]>('/vip/packages');
    return response.data;
  }

  // Admin VIP endpoints
  async updateVipPackagePrice(packageId: string, price: number): Promise<void> {
    await this.client.put(`/admin/vip/packages/${packageId}`, { price });
  }

  async toggleVipPackageStatus(packageId: string, isActive: boolean): Promise<void> {
    await this.client.put(`/admin/vip/packages/${packageId}`, { is_active: isActive });
  }

  async purchaseVipPackage(packageId: string, paymentMethod: string = 'bank_transfer'): Promise<any> {
    const response = await this.client.post('/vip/purchase', {
      package_id: packageId,
      payment_method: paymentMethod
    });
    return response.data;
  }

  // Admin User Management endpoints
  async getAdminUsers(): Promise<User[]> {
    const response = await this.client.get<User[]>('/admin/users');
    return response.data;
  }

  async updateUserRole(userId: string, role: string): Promise<{ message: string }> {
    const response = await this.client.put(`/admin/users/${userId}/role`, role);
    return response.data;
  }

  async updateUserCredits(userId: string, credits: number): Promise<{ message: string }> {
    const response = await this.client.put(`/admin/users/${userId}/credits`, credits);
    return response.data;
  }

  async getAdminStats(): Promise<any> {
    const response = await this.client.get('/admin/stats');
    return response.data;
  }

  async sendBroadcast(title: string, message: string): Promise<void> {
    await this.client.post('/admin/broadcast', {
      title,
      message
    });
  }

  async getAdminSettings(): Promise<any[]> {
    const response = await this.client.get('/admin/settings');
    return response.data;
  }

  async updateAdminSettings(settings: any): Promise<void> {
    await this.client.put('/admin/settings', settings);
  }

  // Forum endpoints
  async getForumCategories(): Promise<ForumCategory[]> {
    const response = await this.client.get<ForumCategory[]>('/forum/categories');
    return response.data;
  }

  async getForumTopics(categoryId?: string, skip: number = 0, limit: number = 20): Promise<ForumTopic[]> {
    const params = new URLSearchParams();
    if (categoryId) params.append('category_id', categoryId);
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());
    
    const response = await this.client.get<ForumTopic[]>(`/forum/topics?${params}`);
    return response.data;
  }

  async createForumTopic(data: ForumTopicCreate): Promise<ForumTopic> {
    const response = await this.client.post<ForumTopic>('/forum/topics', data);
    return response.data;
  }

  // Notification endpoints
  async getNotifications(): Promise<Notification[]> {
    const response = await this.client.get<Notification[]>('/notifications');
    return response.data;
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    await this.client.post(`/notifications/${notificationId}/read`);
  }

  // Credits endpoints
  async watchAd(): Promise<{ message: string; total_credits: number }> {
    const response = await this.client.post('/rewards/ad-watched');
    return response.data;
  }

  async followCreator(): Promise<{ message: string }> {
    const response = await this.client.post('/follow-creator');
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await this.client.get('/health');
    return response.data;
  }
}

export const apiClient = new ApiClient();