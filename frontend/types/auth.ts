export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'vip' | 'admin';
  vip_package?: 'starter' | 'pro' | 'premium';
  vip_expires_at?: string;
  credits: number;
  language: 'tr' | 'en';
  is_following_creator: boolean;
  created_at: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  security_question: string;
  security_answer: string;
  language: 'tr' | 'en';
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}