export interface SocialAccount {
  id: string;
  user_id: string;
  platform: 'instagram' | 'twitter' | 'tiktok' | 'youtube';
  username: string;
  display_name: string;
  description?: string;
  profile_image?: string;
  followers_count: number;
  category?: string;
  boost_count: number;
  boost_expires_at?: string;
  is_featured: boolean;
  created_at: string;
}

export interface SocialAccountCreate {
  platform: 'instagram' | 'twitter' | 'tiktok' | 'youtube';
  username: string;
  display_name: string;
  description?: string;
  profile_image?: string;
  followers_count?: number;
  category?: string;
}

export interface Boost {
  id: string;
  user_id: string;
  social_account_id: string;
  credits_spent: number;
  duration_hours: number;
  started_at: string;
  expires_at: string;
  is_active: boolean;
}

export interface BoostCreate {
  social_account_id: string;
  duration_hours: number;
}