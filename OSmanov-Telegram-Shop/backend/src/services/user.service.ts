import { query, getClient } from '../database/db';
import { User, UserProfile, Purchase, Transaction, BalanceUpdate } from '../types/user.types';
import { CartItem, CheckoutResponse } from '../types/api.types';

export class UserService {
  async getUserById(userId: number): Promise<any> {
    try {
      const result = await query(
        'SELECT id, telegram_id, username, email, first_name, last_name, photo_url, phone, auth_type, balance, total_spent, join_date, created_at, updated_at FROM users WHERE id = $1',
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
    currency?: string; // Добавляем опциональный параметр валюты
    original_usd_amount?: number; // Исходная сумма в USD для Steam TopUp
  }): Promise<void> {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');

      // Определяем валюту: для Steam TopUp (service_id=1) используем RUB, иначе USD
      const currency = purchaseData.currency || (purchaseData.service_id === 1 ? 'RUB' : 'USD');
      
      // Сохраняем основную информацию о покупке
      console.log(`💾 Saving purchase to DB:`, {
        custom_id: purchaseData.custom_id,
        service_id: purchaseData.service_id,
        total_price: purchaseData.total_price,
        currency: currency,
        quantity: purchaseData.quantity,
        original_usd_amount: purchaseData.original_usd_amount
      });
      
      const purchaseResult = await client.query(
        `INSERT INTO purchases (user_id, service_id, service_name, amount, currency, status, purchase_date, custom_id, total_price) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
         RETURNING *`,
        [
          purchaseData.user_id,
          purchaseData.service_id,
          purchaseData.service_name,
          purchaseData.total_price,
          currency,
          purchaseData.status,
          new Date().toISOString(),
          purchaseData.custom_id,
          purchaseData.total_price
        ]
      );
      
      console.log(`✅ Purchase saved:`, {
        id: purchaseResult.rows[0].id,
        amount: purchaseResult.rows[0].amount,
        total_price: purchaseResult.rows[0].total_price,
        currency: purchaseResult.rows[0].currency
      });

      // Сохраняем детали заказа в транзакции
      const paymentDetails: any = {
        custom_id: purchaseData.custom_id,
        quantity: purchaseData.quantity,
        pins: purchaseData.pins || null,
        data: purchaseData.data || null,
        service_id: purchaseData.service_id,
        service_name: purchaseData.service_name
      };
      
      // Для Steam TopUp сохраняем исходную сумму в USD
      if (purchaseData.service_id === 1 && purchaseData.original_usd_amount) {
        paymentDetails.original_usd_amount = purchaseData.original_usd_amount;
      }

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
      
      // Обновляем статус покупки (используем подзапрос для ORDER BY и LIMIT)
      await client.query(
        `UPDATE purchases 
         SET status = $1 
         WHERE id = (
           SELECT id 
           FROM purchases 
           WHERE user_id = $2 AND amount = $3
           ORDER BY created_at DESC 
           LIMIT 1
         )`,
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
        `SELECT p.*, 
                t.payment_details->>'pins' as pins, 
                t.payment_details->>'data' as user_data,
                t.payment_details->>'original_usd_amount' as original_usd_amount
        FROM purchases p
        LEFT JOIN transactions t ON t.payment_details->>'custom_id' = p.custom_id
        WHERE p.custom_id = $1`,
        [custom_id]
      );
      
      if (result.rows.length > 0) {
        const purchase = result.rows[0];
        console.log(`📦 Purchase found by custom_id ${custom_id}:`, {
          id: purchase.id,
          service_id: purchase.service_id,
          amount: purchase.amount,
          total_price: purchase.total_price,
          currency: purchase.currency,
          quantity: purchase.quantity,
          original_usd_amount: purchase.original_usd_amount,
          raw_total_price: purchase.total_price,
          raw_amount: purchase.amount,
          total_price_type: typeof purchase.total_price,
          amount_type: typeof purchase.amount
        });
        return purchase;
      }
      
      console.log(`⚠️ Purchase not found by custom_id: ${custom_id}`);
      return null;
    } catch (error) {
      console.error('Error fetching purchase by custom_id:', error);
      throw error;
    }
  }

  async getUserByTelegramId(telegramId: number): Promise<User | null> {
    try {
      const result = await query(
        'SELECT id, telegram_id, username, email, first_name, last_name, photo_url, phone, auth_type, balance, total_spent, join_date, created_at, updated_at FROM users WHERE telegram_id = $1',
        [telegramId]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching user by Telegram ID:', error);
      throw error;
    }
  }

  async getUserByPhone(phone: string): Promise<any> {
    try {
      const result = await query(
        'SELECT id, telegram_id, username, email, first_name, last_name, photo_url, phone, auth_type, balance, total_spent, join_date, created_at, updated_at FROM users WHERE phone = $1',
        [phone]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching user by phone:', error);
      throw error;
    }
  }

  async createUser(userData: {
    telegram_id?: number;
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
    photo_url?: string;
    balance?: number;
    total_spent?: number;
    phone?: string;
    auth_type?: string;
  }): Promise<any> {
    try {
      const result = await query(
        `INSERT INTO users (
          telegram_id, username, email, first_name, last_name, photo_url, balance, total_spent, phone, auth_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
        RETURNING *`,
        [
          userData.telegram_id ?? null,
          userData.username,
          userData.email,
          userData.first_name,
          userData.last_name,
          userData.photo_url,
          userData.balance || 0.00,
          userData.total_spent || 0.00,
          userData.phone ?? null,
          userData.auth_type || 'telegram'
        ]
      );

      return result.rows[0];
    } catch (error: any) {
      // Если ошибка дублирования username или email, пробуем создать с другим username
      if (error.code === '23505' && error.constraint === 'users_username_key') {
        const uniqueUsername = `${userData.username}_${Date.now()}`;
        return this.createUser({
          ...userData,
          username: uniqueUsername
        });
      }
      
      if (error.code === '23505' && error.constraint === 'users_email_key') {
        const uniqueEmail = userData.telegram_id 
          ? `tg${userData.telegram_id}_${Date.now()}@telegram.user`
          : `user_${Date.now()}@os-gift.store`;
        return this.createUser({
          ...userData,
          email: uniqueEmail
        });
      }
      
      if (error.code === '23505' && error.constraint === 'users_phone_key') {
        throw new Error('Пользователь с таким номером уже зарегистрирован');
      }
      
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Создание пользователя для веб-авторизации (телефон или email)
   */
  async createWebUser(params: {
    phone?: string;
    email?: string;
    authType: 'phone' | 'email';
  }): Promise<any> {
    if (params.authType === 'phone' && params.phone) {
      const email = `p${params.phone}@os-gift.store`;
      const username = `user_${params.phone}`;
      return this.createUser({
        phone: params.phone,
        username,
        email,
        auth_type: 'phone',
        balance: 0,
        total_spent: 0
      });
    }
    if (params.authType === 'email' && params.email) {
      const email = params.email.toLowerCase();
      const username = email.split('@')[0] + '_' + Date.now();
      return this.createUser({
        username,
        email,
        auth_type: 'email',
        balance: 0,
        total_spent: 0
      });
    }
    throw new Error('Invalid web user params');
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

  async getPWAInstructionStatus(userId: number): Promise<boolean> {
    try {
      const result = await query(
        'SELECT pwa_instruction_shown FROM users WHERE id = $1',
        [userId]
      );
      
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }
      
      return result.rows[0].pwa_instruction_shown || false;
    } catch (error) {
      console.error('Error getting PWA instruction status:', error);
      throw error;
    }
  }

  async setPWAInstructionShown(userId: number): Promise<void> {
    try {
      await query(
        'UPDATE users SET pwa_instruction_shown = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [userId]
      );
    } catch (error) {
      console.error('Error setting PWA instruction shown:', error);
      throw error;
    }
  }

}

export const userService = new UserService();