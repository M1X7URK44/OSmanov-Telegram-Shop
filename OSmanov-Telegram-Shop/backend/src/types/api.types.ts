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