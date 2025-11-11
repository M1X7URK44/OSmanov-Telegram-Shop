export interface Credentials {
  login: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
}

export interface Category {
  category_id: number;
  category_name: string;
  category_description?: string;
}

export interface Service {
  service_id: number;
  service_name: string;
  service_description?: string;
  category_id?: number;
}

export interface ApiResponse<T> {
  data?: T;
  status: string;
  message?: string;
}


// Order Types
export interface CreateOrderRequest {
  service_id: number;
  quantity: number;
  custom_id: string;
  data?: string;
}

export interface CreateOrderResponse {
  custom_id: string;
  status: number;
  service_id: number;
  quantity: number;
  total: number;
  date: string;
}

export interface PayOrderRequest {
  custom_id: string;
}

export interface PayOrderResponse {
  message: string;
  custom_id: string;
  status: number;
}

export interface OrderInfo {
  custom_id: string;
  status: number;
  status_message: string;
  product: string;
  quantity: number;
  total_price: number;
  data?: string; // Для Steam и подобных сервисов
  pins?: string[]; // Для gift cards
  [key: string]: any; // для дополнительных полей
}

export interface OrderInfoRequest {
  custom_id: string;
}

// Purchase Types для базы данных
export interface PurchaseRecord {
  id?: number;
  user_id: number;
  custom_id: string;
  service_id: number;
  service_name: string;
  quantity: number;
  total_price: number;
  status: 'pending' | 'completed' | 'failed';
  purchase_date: string;
  created_at?: string;
  updated_at?: string;
  pins?: string[];
  data?: string;
  [key: string]: any; // для дополнительных полей
}

// Cart Types
export interface CartItem {
  service_id: number;
  service_name: string;
  service_description?: string;
  price: number;
  currency: string;
  quantity: number;
  data?: string; // Для Steam логина и т.д.
}

export interface CheckoutRequest {
  user_id: string;
  items: CartItem[];
}

export interface CheckoutResponse {
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