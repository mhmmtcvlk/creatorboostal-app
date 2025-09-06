export interface VipPackage {
  id: string;
  name: string;
  name_en: string;
  price: number;
  duration_days: number;
  features: string[];
  features_en: string[];
  is_active: boolean;
  created_at: string;
}

export interface VipPurchase {
  id: string;
  user_id: string;
  package_id: string;
  amount: number;
  payment_method: string;
  payment_status: 'pending' | 'approved' | 'rejected';
  telegram_payment_id?: string;
  created_at: string;
}