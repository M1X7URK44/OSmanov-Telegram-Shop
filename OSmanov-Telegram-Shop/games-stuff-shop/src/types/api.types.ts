export interface GiftCategory {
  category_id: number;
  category_name: string;
  category_description?: string;
}

export interface GiftsCategories {
  data: GiftCategory[];
}

export interface SubcategoryInfo {
  name: string;
  categoryId?: number; // ID категории API, соответствующей этой подкатегории
}

export interface CategoryWithImage {
  id: number;
  name: string;
  image: string;
  count: number;
  tags: string[];
  tagIDs: number[];
  categoryIds?: number[]; // ID всех категорий API, относящихся к этой основной категории
  subcategories?: SubcategoryInfo[]; // Подкатегории для этой категории
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
  in_stock?: number;
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
  telegram_id: number;
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
  custom_id?: string; // Добавляем custom_id
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

// ========== НОВЫЕ ТИПЫ ДЛЯ ЗАКАЗОВ ==========

export interface CreateOrderRequest {
  service_id: number;
  quantity: number;
  data?: string;
  user_id: number;
  service_name: string;
  price: number;
}

export interface CreateOrderResponse {
  custom_id: string;
  status: number;
  service_id: number;
  quantity: number;
  total: number;
  date: string;
  service_name: string;
  user_id: number;
}

export interface PayOrderRequest {
  custom_id: string;
  user_id: number;
}

export interface PayOrderResponse {
  message: string;
  custom_id: string;
  status: number;
}

export interface OrderInfoRequest {
  custom_id: string;
}

export interface OrderInfoResponse {
  custom_id: string;
  status: number;
  status_message: string;
  product: string;
  quantity: number;
  total_price: number;
  data?: string;
  pins?: string[];
}

export interface CheckoutItem {
  service_id: number;
  service_name: string;
  price: number;
  currency: string;
  quantity: number;
  data?: string;
}

export interface CheckoutRequest {
  user_id: number;
  items: CheckoutItem[];
}

export interface CheckoutItemResult {
  success: boolean;
  custom_id: string;
  service_id: number;
  service_name: string;
  status: number;
  status_message: string;
  pins?: string[];
  data?: string;
  error?: string;
}

export interface CheckoutResponseData {
  results: CheckoutItemResult[];
  total_processed: number;
  total_failed: number;
  total_amount: number;
}

export interface CheckoutResponse {
  status: string;
  data: CheckoutResponseData;
  message?: string;
}

// Типы для ответов API
export interface ApiResponse<T> {
  status: string;
  data?: T;
  message?: string;
}

// Константы для статусов заказов (вместо enum)
export const ORDER_STATUS = {
  PENDING: 1,
  COMPLETED: 2,
  FAILED: 3
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

// Тип для расширенной информации о покупке (с PIN кодами и данными)
export interface ExtendedPurchase extends Purchase {
  custom_id?: string;
  pins?: string[];
  user_data?: string;
  quantity?: number;
}

// Типы для форм и UI
export interface CartItem extends ServiceItem {
  quantity: number;
  userData?: string;
}

export interface CheckoutFormData {
  userId: number;
  items: CartItem[];
}