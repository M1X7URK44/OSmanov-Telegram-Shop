import { query, getClient } from '../database/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'superadmin';
  created_at: string;
  updated_at: string;
}

export interface AdminSettings {
  id: number;
  usd_to_rub_rate: number;
  min_deposit_amount: number;
  max_deposit_amount: number;
  telegram_star_price_rub?: number | null;
  telegram_premium_price_rub?: number | null;
  telegram_premium_3m_price_rub?: number | null;
  telegram_premium_6m_price_rub?: number | null;
  telegram_premium_12m_price_rub?: number | null;
  updated_at: string;
  updated_by: number;
}

export class AdminService {
  async authenticate(username: string, password: string): Promise<AdminUser | null> {
    try {
      const result = await query(
        'SELECT id, username, email, password_hash, role, created_at, updated_at FROM admin_users WHERE username = $1 AND is_active = true',
        [username]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const admin = result.rows[0];
      const isValidPassword = await bcrypt.compare(password, admin.password_hash);

      if (!isValidPassword) {
        return null;
      }

      // Убираем пароль из ответа
      const { password_hash, ...adminWithoutPassword } = admin;
      return adminWithoutPassword;
    } catch (error) {
      console.error('Error authenticating admin:', error);
      throw error;
    }
  }

  async getSettings(): Promise<AdminSettings | null> {
    try {
      const result = await query(
        'SELECT id, usd_to_rub_rate, min_deposit_amount, max_deposit_amount, telegram_star_price_rub, telegram_premium_price_rub, telegram_premium_3m_price_rub, telegram_premium_6m_price_rub, telegram_premium_12m_price_rub, updated_at, updated_by FROM admin_settings ORDER BY updated_at DESC LIMIT 1'
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching admin settings:', error);
      throw error;
    }
  }

  async updateExchangeRate(rate: number, adminId: number): Promise<AdminSettings> {
    const client = await getClient();
    
    try {
        await client.query('BEGIN');

        console.log('Updating exchange rate to', rate, 'by admin', adminId);

        // Проверяем существующие настройки
        const existingResult = await client.query(
        'SELECT id FROM admin_settings ORDER BY id DESC LIMIT 1'
        );

        let settings: AdminSettings;

        if (existingResult.rows.length > 0) {
        // Обновляем существующие настройки
        const updateResult = await client.query(
            `UPDATE admin_settings 
            SET usd_to_rub_rate = $1, 
                updated_at = CURRENT_TIMESTAMP, 
                updated_by = $2 
            WHERE id = $3 
            RETURNING *`,
            [rate, adminId, existingResult.rows[0].id]
        );
        
        if (updateResult.rows.length === 0) {
            throw new Error('Failed to update settings');
        }
        
        settings = updateResult.rows[0];
        } else {
        // Создаем новые настройки
        const insertResult = await client.query(
            `INSERT INTO admin_settings (usd_to_rub_rate, min_deposit_amount, max_deposit_amount, telegram_star_price_rub, telegram_premium_price_rub, updated_by) 
            VALUES ($1, $2, $3, $4, $5, $6) 
            RETURNING *`,
            [rate, 100, 100000, 1.00, 399.00, adminId]
        );
        
        if (insertResult.rows.length === 0) {
            throw new Error('Failed to insert settings');
        }
        
        settings = insertResult.rows[0];
        }

        await client.query('COMMIT');
        
        console.log('Exchange rate updated successfully:', settings);
        
        return settings;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating exchange rate:', error);
        throw error;
    } finally {
        client.release();
    }
    }

  async updateTelegramPrices(
    starPriceRub: number,
    premiumPriceRub: number,
    adminId: number
  ): Promise<AdminSettings> {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Проверяем существующие настройки
      const existingResult = await client.query(
        'SELECT id FROM admin_settings ORDER BY id DESC LIMIT 1'
      );

      let settings: AdminSettings;

      if (existingResult.rows.length > 0) {
        const updateResult = await client.query(
          `UPDATE admin_settings
           SET telegram_star_price_rub = $1,
               telegram_premium_price_rub = $2,
               updated_at = CURRENT_TIMESTAMP,
               updated_by = $3
           WHERE id = $4
           RETURNING *`,
          [starPriceRub, premiumPriceRub, adminId, existingResult.rows[0].id]
        );

        if (updateResult.rows.length === 0) {
          throw new Error('Failed to update Telegram prices');
        }

        settings = updateResult.rows[0];
      } else {
        const insertResult = await client.query(
          `INSERT INTO admin_settings (usd_to_rub_rate, min_deposit_amount, max_deposit_amount, telegram_star_price_rub, telegram_premium_price_rub, updated_by)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [90.0, 100.0, 100000.0, starPriceRub, premiumPriceRub, adminId]
        );

        if (insertResult.rows.length === 0) {
          throw new Error('Failed to insert Telegram prices');
        }

        settings = insertResult.rows[0];
      }

      await client.query('COMMIT');
      return settings;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating Telegram prices:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async updatePremiumPrices(
    premium3mPriceRub: number,
    premium6mPriceRub: number,
    premium12mPriceRub: number,
    adminId: number
  ): Promise<AdminSettings> {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Проверяем существующие настройки
      const existingResult = await client.query(
        'SELECT id FROM admin_settings ORDER BY id DESC LIMIT 1'
      );

      let settings: AdminSettings;

      if (existingResult.rows.length > 0) {
        const updateResult = await client.query(
          `UPDATE admin_settings
           SET telegram_premium_3m_price_rub = $1,
               telegram_premium_6m_price_rub = $2,
               telegram_premium_12m_price_rub = $3,
               updated_at = CURRENT_TIMESTAMP,
               updated_by = $4
           WHERE id = $5
           RETURNING *`,
          [premium3mPriceRub, premium6mPriceRub, premium12mPriceRub, adminId, existingResult.rows[0].id]
        );

        if (updateResult.rows.length === 0) {
          throw new Error('Failed to update Premium prices');
        }

        settings = updateResult.rows[0];
      } else {
        const insertResult = await client.query(
          `INSERT INTO admin_settings (usd_to_rub_rate, min_deposit_amount, max_deposit_amount, telegram_premium_3m_price_rub, telegram_premium_6m_price_rub, telegram_premium_12m_price_rub, updated_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [90.0, 100.0, 100000.0, premium3mPriceRub, premium6mPriceRub, premium12mPriceRub, adminId]
        );

        if (insertResult.rows.length === 0) {
          throw new Error('Failed to insert Premium prices');
        }

        settings = insertResult.rows[0];
      }

      await client.query('COMMIT');
      return settings;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating Premium prices:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getAdminById(adminId: number): Promise<AdminUser | null> {
    try {
      const result = await query(
        'SELECT id, username, email, role, created_at, updated_at FROM admin_users WHERE id = $1',
        [adminId]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching admin by ID:', error);
      throw error;
    }
  }

  // Обновите метод generateToken
  generateToken(admin: AdminUser): string {
    const payload = {
        adminId: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        type: 'admin' // Добавляем тип для различия пользователей и админов
    };

    return jwt.sign(
        payload,
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '8h' }
    );
  }

  async getStatistics(): Promise<any> {
    try {
      // Общее количество пользователей
      const totalUsersResult = await query('SELECT COUNT(*) as count FROM users');
      const totalUsers = parseInt(totalUsersResult.rows[0].count);

      // Новые пользователи за день
      const dayAgo = new Date();
      dayAgo.setDate(dayAgo.getDate() - 1);
      const newUsersDayResult = await query(
        'SELECT COUNT(*) as count FROM users WHERE created_at >= $1',
        [dayAgo.toISOString()]
      );
      const newUsersDay = parseInt(newUsersDayResult.rows[0].count);

      // Новые пользователи за неделю
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const newUsersWeekResult = await query(
        'SELECT COUNT(*) as count FROM users WHERE created_at >= $1',
        [weekAgo.toISOString()]
      );
      const newUsersWeek = parseInt(newUsersWeekResult.rows[0].count);

      // Новые пользователи за месяц
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      const newUsersMonthResult = await query(
        'SELECT COUNT(*) as count FROM users WHERE created_at >= $1',
        [monthAgo.toISOString()]
      );
      const newUsersMonth = parseInt(newUsersMonthResult.rows[0].count);

      // Статистика по дням за последние 30 дней
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dailyStatsResult = await query(
        `SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM users
        WHERE created_at >= $1
        GROUP BY DATE(created_at)
        ORDER BY date ASC`,
        [thirtyDaysAgo.toISOString()]
      );

      // Статистика по неделям за последние 12 недель
      const twelveWeeksAgo = new Date();
      twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);
      const weeklyStatsResult = await query(
        `SELECT 
          DATE_TRUNC('week', created_at) as week,
          COUNT(*) as count
        FROM users
        WHERE created_at >= $1
        GROUP BY DATE_TRUNC('week', created_at)
        ORDER BY week ASC`,
        [twelveWeeksAgo.toISOString()]
      );

      // Статистика по месяцам за последние 12 месяцев
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      const monthlyStatsResult = await query(
        `SELECT 
          DATE_TRUNC('month', created_at) as month,
          COUNT(*) as count
        FROM users
        WHERE created_at >= $1
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month ASC`,
        [twelveMonthsAgo.toISOString()]
      );

      return {
        totalUsers,
        newUsersDay,
        newUsersWeek,
        newUsersMonth,
        dailyStats: dailyStatsResult.rows.map((row: any) => ({
          date: row.date,
          count: parseInt(row.count)
        })),
        weeklyStats: weeklyStatsResult.rows.map((row: any) => ({
          week: row.week,
          count: parseInt(row.count)
        })),
        monthlyStats: monthlyStatsResult.rows.map((row: any) => ({
          month: row.month,
          count: parseInt(row.count)
        }))
      };
    } catch (error) {
      console.error('Error fetching statistics:', error);
      throw error;
    }
  }

  async getPaymentsByDateRange(startDate: string, endDate: string, page: number = 1, limit: number = 50): Promise<{ payments: any[], total: number, totalPages: number }> {
    const client = await getClient();
    
    try {
      // Объединяем транзакции и покупки в один список платежей
      // Транзакции (deposits, withdrawals)
      const transactionsQuery = `
        SELECT 
          t.id,
          t.user_id,
          u.username,
          u.telegram_id,
          u.first_name,
          u.last_name,
          t.amount,
          t.type,
          t.status,
          t.payment_method,
          t.created_at as payment_date,
          NULL as service_name,
          NULL as service_id,
          NULL as quantity,
          NULL as custom_id,
          'transaction' as payment_type
        FROM transactions t
        LEFT JOIN users u ON t.user_id = u.id
        WHERE t.created_at >= $1 AND t.created_at <= $2
        AND t.type IN ('deposit', 'withdrawal')
      `;

      // Покупки (purchases)
      const purchasesQuery = `
        SELECT 
          p.id,
          p.user_id,
          u.username,
          u.telegram_id,
          u.first_name,
          u.last_name,
          p.amount,
          'purchase' as type,
          p.status,
          'balance' as payment_method,
          COALESCE(p.purchase_date, p.created_at) as payment_date,
          p.service_name,
          p.service_id,
          p.quantity,
          p.custom_id,
          'purchase' as payment_type
        FROM purchases p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE COALESCE(p.purchase_date, p.created_at) >= $1 
        AND COALESCE(p.purchase_date, p.created_at) <= $2
      `;

      // Объединяем и сортируем
      const unionQuery = `
        ${transactionsQuery}
        UNION ALL
        ${purchasesQuery}
        ORDER BY payment_date DESC
      `;

      // Получаем общее количество
      const countResult = await client.query(
        `SELECT COUNT(*) as total FROM (
          ${unionQuery}
        ) as combined_payments`,
        [startDate, endDate]
      );
      const total = parseInt(countResult.rows[0].total);

      // Получаем данные с пагинацией
      const offset = (page - 1) * limit;
      const dataResult = await client.query(
        `${unionQuery} LIMIT $3 OFFSET $4`,
        [startDate, endDate, limit, offset]
      );

      const totalPages = Math.ceil(total / limit);

      return {
        payments: dataResult.rows,
        total,
        totalPages
      };
    } catch (error) {
      console.error('Error fetching payments by date range:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

export const adminService = new AdminService();