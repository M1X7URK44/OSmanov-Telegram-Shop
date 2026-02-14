export interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'superadmin';
  created_at: string;
}

export interface AdminSettings {
  usd_to_rub_rate: number;
  min_deposit_amount: number;
  max_deposit_amount: number;
  updated_at: string;
  updated_by: number;
}

export interface AdminAuthResponse {
  token: string;
  user: AdminUser;
}

export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface UpdateExchangeRateRequest {
  usd_to_rub_rate: number;
}