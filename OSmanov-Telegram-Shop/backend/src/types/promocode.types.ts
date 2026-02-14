export interface Promocode {
  id: number;
  code: string;
  type: 'balance' | 'discount';
  value: number; // Для balance: сумма в USD, для discount: процент скидки (0-100)
  is_active: boolean;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export interface PromocodeUsage {
  id: number;
  promocode_id: number;
  user_id: number;
  used_at: string;
}

export interface ActivatePromocodeRequest {
  code: string;
  user_id: number;
}

export interface ActivatePromocodeResponse {
  success: boolean;
  message: string;
  type?: 'balance' | 'discount';
  value?: number; // Для balance: начисленная сумма, для discount: процент скидки
  new_balance?: number; // Только для balance промокодов
}

export interface CreatePromocodeRequest {
  code: string;
  type: 'balance' | 'discount';
  value: number;
  is_active?: boolean;
}

export interface UpdatePromocodeRequest {
  code?: string;
  type?: 'balance' | 'discount';
  value?: number;
  is_active?: boolean;
}

export interface PromocodeWithUsage extends Promocode {
  usage_count: number;
  used_by_user?: boolean; // Для конкретного пользователя
}
