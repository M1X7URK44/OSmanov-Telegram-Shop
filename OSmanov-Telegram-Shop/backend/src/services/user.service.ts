import { query, getClient } from '../database/db';
import { User, UserProfile, Purchase, Transaction, BalanceUpdate } from '../types/user.types';
import { CartItem, CheckoutResponse } from '../types/api.types';

export class UserService {
  async getUserById(userId: number): Promise<any> {
    try {
      const result = await query(
        'SELECT id, telegram_id, username, email, first_name, last_name, photo_url, balance, total_spent, join_date, created_at, updated_at FROM users WHERE id = $1',
        [userId]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<any> {
    try {
      const result = await query(
        'SELECT id, telegram_id, username, email, first_name, last_name, photo_url, balance, total_spent, join_date, created_at, updated_at FROM users WHERE username = $1',
        [username]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching user by username:', error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<any> {
    try {
      const result = await query(
        'SELECT id, telegram_id, username, email, first_name, last_name, photo_url, balance, total_spent, join_date, created_at, updated_at FROM users WHERE email = $1',
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
        `SELECT id, user_id, service_id, service_name, amount, currency, status, purchase_date, created_at, custom_id
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
          purchaseData.currency || 'USD',
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

  async getUserPurchasesPaginated(userId: number, page: number = 1, limit: number = 20): Promise<{ purchases: Purchase[]; total: number; totalPages: number }> {
    try {
      const offset = (page - 1) * limit;

      const purchasesQuery = `
        SELECT 
          id, 
          user_id, 
          service_id, 
          service_name, 
          quantity,
          amount, 
          total_price,
          currency, 
          status, 
          purchase_date, 
          created_at, 
          custom_id
        FROM purchases
        WHERE user_id = $1
        ORDER BY purchase_date DESC
        LIMIT $2 OFFSET $3
      `;

      const countQuery = `
        SELECT COUNT(*) as total
        FROM purchases
        WHERE user_id = $1
      `;

      const [purchasesResult, countResult] = await Promise.all([
        query(purchasesQuery, [userId, limit, offset]),
        query(countQuery, [userId])
      ]);

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      return {
        purchases: purchasesResult.rows,
        total,
        totalPages
      };
    } catch (error) {
      console.error('Error fetching paginated user purchases:', error);
      throw error;
    }
  }

  // НОВЫЕ МЕТОДЫ ДЛЯ РАБОТЫ С ЗАКАЗАМИ

  async savePurchaseWithDetails(purchaseData: {
    user_id: number;
    custom_id: string;
    service_id: number;
    service_name: string;
    quantity: number;
    total_price: number;
    status: 'pending' | 'completed' | 'failed';
    pins?: string[];
    data?: string;
  }): Promise<void> {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');

      // Сохраняем основную информацию о покупке
      const purchaseResult = await client.query(
        `INSERT INTO purchases (user_id, service_id, service_name, amount, currency, status, purchase_date, custom_id) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         RETURNING *`,
        [
          purchaseData.user_id,
          purchaseData.service_id,
          purchaseData.service_name,
          purchaseData.total_price,
          'USD',
          purchaseData.status,
          new Date().toISOString(),
          purchaseData.custom_id
        ]
      );

      // Сохраняем детали заказа в транзакции
      const paymentDetails = {
        custom_id: purchaseData.custom_id,
        quantity: purchaseData.quantity,
        pins: purchaseData.pins || null,
        data: purchaseData.data || null,
        service_id: purchaseData.service_id,
        service_name: purchaseData.service_name
      };

      await client.query(
        `INSERT INTO transactions (user_id, amount, type, status, payment_method, payment_details) 
         VALUES ($1, $2, 'purchase', $3, 'gifts_api', $4)`,
        [
          purchaseData.user_id,
          purchaseData.total_price,
          purchaseData.status,
          JSON.stringify(paymentDetails)
        ]
      );

      // Если статус completed, обновляем total_spent
      if (purchaseData.status === 'completed') {
        await client.query(
          `UPDATE users 
           SET total_spent = total_spent + $1,
               updated_at = CURRENT_TIMESTAMP 
           WHERE id = $2`,
          [purchaseData.total_price, purchaseData.user_id]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error saving purchase with details:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async updatePurchaseStatus(custom_id: string, status: 'pending' | 'completed' | 'failed', pins?: string[], data?: string): Promise<void> {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');

      // Обновляем статус покупки по custom_id
      await client.query(
        `UPDATE purchases 
        SET status = $1 
        WHERE custom_id = $2`,
        [status, custom_id]
      );

      // Находим транзакцию по custom_id
      const transactionResult = await client.query(
        `SELECT id, user_id, amount 
         FROM transactions 
         WHERE payment_details->>'custom_id' = $1 AND type = 'purchase'`,
        [custom_id]
      );

      if (transactionResult.rows.length === 0) {
        throw new Error(`Transaction not found for custom_id: ${custom_id}`);
      }

      const transaction = transactionResult.rows[0];
      
      // Обновляем статус покупки
      await client.query(
        `UPDATE purchases 
         SET status = $1 
         WHERE user_id = $2 AND amount = $3
         ORDER BY created_at DESC 
         LIMIT 1`,
        [status, transaction.user_id, transaction.amount]
      );

      // Обновляем статус транзакции
      await client.query(
        `UPDATE transactions 
         SET status = $1 
         WHERE id = $2`,
        [status, transaction.id]
      );

      // Обновляем payment_details если есть pins или data
      if (pins || data) {
        const currentDetailsResult = await client.query(
          `SELECT payment_details FROM transactions WHERE id = $1`,
          [transaction.id]
        );

        const currentDetails = currentDetailsResult.rows[0].payment_details || {};
        const updatedDetails = {
          ...currentDetails,
          ...(pins && { pins }),
          ...(data && { data })
        };

        await client.query(
          `UPDATE transactions 
           SET payment_details = $1 
           WHERE id = $2`,
          [JSON.stringify(updatedDetails), transaction.id]
        );
      }

      // Если статус стал completed, обновляем total_spent
       if (status === 'completed') {
        const purchaseResult = await client.query(
          `SELECT user_id, amount FROM purchases WHERE custom_id = $1`,
          [custom_id]
        );
        
        if (purchaseResult.rows.length > 0) {
          const purchase = purchaseResult.rows[0];
          await client.query(
            `UPDATE users 
            SET total_spent = total_spent + $1,
                updated_at = CURRENT_TIMESTAMP 
            WHERE id = $2`,
            [purchase.amount, purchase.user_id]
          );
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating purchase status:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getUserBalance(userId: number): Promise<number> {
    try {
      const result = await query(
        'SELECT balance FROM users WHERE id = $1',
        [userId]
      );
      
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }
      
      return parseFloat(result.rows[0].balance);
    } catch (error) {
      console.error('Error getting user balance:', error);
      throw error;
    }
  }

  async deductUserBalance(userId: number, amount: number): Promise<void> {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');

      const result = await client.query(
        'UPDATE users SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND balance >= $1 RETURNING *',
        [amount, userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Insufficient balance or user not found');
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error deducting user balance:', error);
      throw error;
    } finally {
      client.release();
    }
  }


  async getPurchaseByCustomId(custom_id: string): Promise<any> {
    try {
      const result = await query(
        `SELECT p.*, t.payment_details->>'pins' as pins, t.payment_details->>'data' as user_data
        FROM purchases p
        LEFT JOIN transactions t ON t.payment_details->>'custom_id' = p.custom_id
        WHERE p.custom_id = $1`,
        [custom_id]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching purchase by custom_id:', error);
      throw error;
    }
  }

  async getUserByTelegramId(telegramId: number): Promise<User | null> {
    try {
      const result = await query(
        'SELECT id, telegram_id, username, email, first_name, last_name, photo_url, balance, total_spent, join_date, created_at, updated_at FROM users WHERE telegram_id = $1',
        [telegramId]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching user by Telegram ID:', error);
      throw error;
    }
  }

  async createUser(userData: {
    telegram_id: number;
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
    photo_url?: string;
    balance?: number;
    total_spent?: number;
  }): Promise<any> {
    try {
      const result = await query(
        `INSERT INTO users (
          telegram_id, username, email, first_name, last_name, photo_url, balance, total_spent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
        RETURNING *`,
        [
          userData.telegram_id,
          userData.username,
          userData.email,
          userData.first_name,
          userData.last_name,
          userData.photo_url,
          userData.balance || 0.00,
          userData.total_spent || 0.00
        ]
      );

      return result.rows[0];
    } catch (error: any) {
      // Если ошибка дублирования username или email, пробуем создать с другим username
      if (error.code === '23505' && error.constraint === 'users_username_key') {
        // Генерируем уникальный username
        const uniqueUsername = `${userData.username}_${Date.now()}`;
        return this.createUser({
          ...userData,
          username: uniqueUsername
        });
      }
      
      // Если ошибка дублирования email, пробуем создать с другим email
      if (error.code === '23505' && error.constraint === 'users_email_key') {
        const uniqueEmail = `tg${userData.telegram_id}_${Date.now()}@telegram.user`;
        return this.createUser({
          ...userData,
          email: uniqueEmail
        });
      }
      
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async getAllUsers(page: number = 1, limit: number = 10, search?: string): Promise<{ users: User[], total: number, totalPages: number }> {
    try {
      const offset = (page - 1) * limit;
      let queryText = '';
      let countQuery = '';
      const queryParams: any[] = [];

      if (search) {
        // Поиск по ID, username или telegram_id
        const searchParam = `%${search}%`;
        queryText = `
          SELECT id, telegram_id, username, email, first_name, last_name, photo_url, balance, total_spent, join_date, created_at, updated_at 
          FROM users 
          WHERE username ILIKE $1 OR CAST(id AS TEXT) = $2 OR CAST(telegram_id AS TEXT) = $3
          ORDER BY created_at DESC 
          LIMIT $4 OFFSET $5
        `;
        countQuery = `
          SELECT COUNT(*) as total 
          FROM users 
          WHERE username ILIKE $1 OR CAST(id AS TEXT) = $2 OR CAST(telegram_id AS TEXT) = $3
        `;
        queryParams.push(searchParam, search, search, limit, offset);
      } else {
        queryText = `
          SELECT id, telegram_id, username, email, first_name, last_name, photo_url, balance, total_spent, join_date, created_at, updated_at 
          FROM users 
          ORDER BY created_at DESC 
          LIMIT $1 OFFSET $2
        `;
        countQuery = 'SELECT COUNT(*) as total FROM users';
        queryParams.push(limit, offset);
      }

      const [usersResult, countResult] = await Promise.all([
        query(queryText, queryParams),
        query(countQuery, search ? [queryParams[0], queryParams[1], queryParams[2]] : [])
      ]);

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      return {
        users: usersResult.rows,
        total,
        totalPages
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  async updateUserBalanceById(userId: number, newBalance: number): Promise<User> {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');

      // Получаем текущий баланс пользователя
      const currentUserResult = await client.query(
        'SELECT balance FROM users WHERE id = $1',
        [userId]
      );

      if (currentUserResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const oldBalance = parseFloat(currentUserResult.rows[0].balance);
      const balanceChange = newBalance - oldBalance;

      // Обновляем баланс пользователя на конкретное значение
      const result = await client.query(
        'UPDATE users SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [newBalance, userId]
      );

      // Создаем запись о транзакции только если баланс изменился
      if (Math.abs(balanceChange) > 0.01) {
        await client.query(
          `INSERT INTO transactions (user_id, amount, type, status, payment_method) 
           VALUES ($1, $2, $3, 'completed', 'admin_adjustment')`,
          [userId, balanceChange, balanceChange > 0 ? 'deposit' : 'withdrawal']
        );
      }

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

}

export const userService = new UserService();