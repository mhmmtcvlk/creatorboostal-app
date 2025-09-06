export interface ForumCategory {
  id: string;
  name: string;
  name_en: string;
  description: string;
  description_en: string;
  icon?: string;
  is_active: boolean;
}

export interface ForumTopic {
  id: string;
  category_id: string;
  user_id: string;
  title: string;
  content: string;
  replies_count: number;
  views_count: number;
  is_pinned: boolean;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
}

export interface ForumTopicCreate {
  category_id: string;
  title: string;
  content: string;
}

export interface ForumReply {
  id: string;
  topic_id: string;
  user_id: string;
  content: string;
  created_at: string;
}