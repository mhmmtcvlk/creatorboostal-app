export interface Notification {
  id: string;
  user_id: string;
  type: 'vip_approved' | 'boost_activated' | 'boost_expiring' | 'new_message' | 'forum_reply' | 'credits_earned';
  title: string;
  title_en: string;
  message: string;
  message_en: string;
  is_read: boolean;
  data?: Record<string, any>;
  created_at: string;
}