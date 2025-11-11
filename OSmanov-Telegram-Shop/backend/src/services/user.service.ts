import { query, getClient } from '../database/db';
import { User, Purchase, UserProfile, BalanceUpdate } from '../types/user.types';

export class UserService {
  async getUserById(userId: number): Promise<User | null> {
    try {
      const result = await query(
        'SELECT id, username, email, balance, total_spent, join_date, created_at, updated_at FROM users WHERE id = $1',
        [userId]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const result = await query(
        'SELECT id, username, email, balance, total_spent, join_date, created_at, updated_at FROM users WHERE email = $1',
        [email]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching user by email:', error);
      throw error;
    }
  }

  async getUserPurchases(userId: number, limit: number = 10): Promise<Purchase[]> {
    try {
      const result = await query(
        `SELECT id, service_id, service_name, amount, currency, status, purchase_date, created_at 
         FROM purchases 
         WHERE user_id = $1 
         ORDER BY purchase_date DESC 
         LIMIT $2`,
        [userId, limit]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error fetching user purchases:', error);
      throw error;
    }
  }

  async getUserProfile(userId: number): Promise<UserProfile> {
    try {
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const purchases = await this.getUserPurchases(userId);
      
      // Получаем статистику по успешным транзакциям
      const statsResult = await query(
        `SELECT COUNT(*) as successful_count 
         FROM purchases 
         WHERE user_id = $1 AND status = 'completed'`,
        [userId]
      );

      const successfulTransactions = parseInt(statsResult.rows[0].successful_count);

      return {
        user,
        purchases,
        totalPurchases: purchases.length,
        successfulTransactions
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  async updateUserBalance(userId: number, amount: number): Promise<User> {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');

      // Обновляем баланс пользователя
      const result = await client.query(
        'UPDATE users SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [amount, userId]
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      // Создаем запись о транзакции
      await client.query(
        `INSERT INTO transactions (user_id, amount, type, status, payment_method) 
         VALUES ($1, $2, 'deposit', 'completed', 'balance_topup')`,
        [userId, amount]
      );

      await client.query('COMMIT');
      
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating user balance:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async createPurchase(userId: number, purchaseData: Omit<Purchase, 'id' | 'user_id' | 'created_at'>): Promise<Purchase> {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');

      // Создаем запись о покупке
      const purchaseResult = await client.query(
        `INSERT INTO purchases (user_id, service_id, service_name, amount, currency, status, purchase_date) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING *`,
        [
          userId,
          purchaseData.service_id,
          purchaseData.service_name,
          purchaseData.amount,
          purchaseData.currency,
          purchaseData.status,
          purchaseData.purchase_date || new Date().toISOString()
        ]
      );

      // Обновляем баланс и общую сумму потраченного
      await client.query(
        `UPDATE users 
         SET balance = balance - $1, 
             total_spent = total_spent + $1,
             updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2`,
        [purchaseData.amount, userId]
      );

      // Создаем запись о транзакции
      await client.query(
        `INSERT INTO transactions (user_id, amount, type, status, payment_method) 
         VALUES ($1, $2, 'purchase', 'completed', 'balance')`,
        [userId, purchaseData.amount]
      );

      await client.query('COMMIT');
      
      return purchaseResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating purchase:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getTransactionHistory(userId: number, limit: number = 20): Promise<any[]> {
    try {
      const result = await query(
        `SELECT id, amount, type, status, payment_method, created_at 
         FROM transactions 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2`,
        [userId, limit]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      throw error;
    }
  }
}

export const userService = new UserService();