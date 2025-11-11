export interface GiftCategory {
  category_id: number;
  category_name: string;
  category_description?: string;
}

export interface GiftsCategories {
  data: GiftCategory[];
}

export interface CategoryWithImage {
  id: number;
  name: string;
  image: string;
  count: number;
  tags: string[];
  tagIDs: number[];
}

export interface ServiceItem {
  service_id: number;
  service_name: string;
  service_description?: string;
  price?: number;
  currency?: string;
  available?: boolean;
  // Добавляем дополнительные поля которые могут прийти с API
  category_id?: number;
  service_image?: string;
  min_price?: number;
  max_price?: number;
}

export interface ServicesResponse {
  data: ServiceItem[];
}

export interface User {
  id: number;
  username: string;
  email: string;
  balance: number;
  total_spent: number;
  join_date: string;
  created_at: string;
  updated_at: string;
}

export interface Purchase {
  id: number;
  user_id: number;
  service_id: number;
  service_name: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  purchase_date: string;
  created_at: string;
}

export interface UserProfile {
  user: User;
  purchases: Purchase[];
  totalPurchases: number;
  successfulTransactions: number;
}

export interface BalanceUpdateRequest {
  amount: number;
  payment_method: string;
  payment_details?: any;
}