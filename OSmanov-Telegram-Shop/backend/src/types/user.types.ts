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

export interface Transaction {
  id: number;
  user_id: number;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'purchase';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  payment_method: string;
  payment_details: any;
  created_at: string;
}

export interface UserProfile {
  user: User;
  purchases: Purchase[];
  totalPurchases: number;
  successfulTransactions: number;
}

export interface BalanceUpdate {
  amount: number;
  payment_method: string;
  payment_details?: any;
}