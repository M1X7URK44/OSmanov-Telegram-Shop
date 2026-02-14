import { query, getClient } from '../database/db';
import {
  Promocode,
  PromocodeUsage,
  ActivatePromocodeRequest,
  ActivatePromocodeResponse,
  CreatePromocodeRequest,
  UpdatePromocodeRequest,
  PromocodeWithUsage,
} from '../types/promocode.types';
import { UserService } from './user.service';

const userService = new UserService();

export class PromocodeService {
  // Активация промокода пользователем
  async activatePromocode(
    request: ActivatePromocodeRequest
  ): Promise<ActivatePromocodeResponse> {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Проверяем существование промокода
      const promocodeResult = await client.query(
        `SELECT * FROM promocodes WHERE code = $1 AND is_active = true`,
        [request.code.toUpperCase().trim()]
      );

      if (promocodeResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return {
          success: false,
          message: 'Промокод не найден или неактивен',
        };
      }

      const promocode: Promocode = promocodeResult.rows[0];

      // Проверяем, использовал ли пользователь уже этот промокод
      const usageResult = await client.query(
        `SELECT * FROM promocode_usage WHERE promocode_id = $1 AND user_id = $2`,
        [promocode.id, request.user_id]
      );

      if (usageResult.rows.length > 0) {
        await client.query('ROLLBACK');
        return {
          success: false,
          message: 'Вы уже использовали этот промокод',
        };
      }

      // Обрабатываем промокод в зависимости от типа
      if (promocode.type === 'balance') {
        // Начисляем баланс
        await client.query(
          `UPDATE users SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [promocode.value, request.user_id]
        );

        // Создаем транзакцию
        await client.query(
          `INSERT INTO transactions (user_id, amount, type, status, payment_method, payment_details)
           VALUES ($1, $2, 'deposit', 'completed', 'promocode', $3)`,
          [
            request.user_id,
            promocode.value,
            JSON.stringify({ promocode_id: promocode.id, promocode_code: promocode.code }),
          ]
        );

        // Записываем использование промокода
        await client.query(
          `INSERT INTO promocode_usage (promocode_id, user_id) VALUES ($1, $2)`,
          [promocode.id, request.user_id]
        );

        // Получаем новый баланс
        const userResult = await client.query(
          `SELECT balance FROM users WHERE id = $1`,
          [request.user_id]
        );

        await client.query('COMMIT');

        return {
          success: true,
          message: `На ваш баланс начислено ${promocode.value} USD`,
          type: 'balance',
          value: promocode.value,
          new_balance: parseFloat(userResult.rows[0].balance),
        };
      } else if (promocode.type === 'discount') {
        // Для промокодов на скидку просто записываем использование
        // Скидка будет применяться при покупке
        await client.query(
          `INSERT INTO promocode_usage (promocode_id, user_id) VALUES ($1, $2)`,
          [promocode.id, request.user_id]
        );

        await client.query('COMMIT');

        return {
          success: true,
          message: `Промокод активирован! Скидка ${promocode.value}% будет применена к вашим покупкам`,
          type: 'discount',
          value: promocode.value,
        };
      }

      await client.query('ROLLBACK');
      return {
        success: false,
        message: 'Неизвестный тип промокода',
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error activating promocode:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Проверка, использовал ли пользователь промокод
  async checkPromocodeUsage(
    promocodeId: number,
    userId: number
  ): Promise<boolean> {
    try {
      const result = await query(
        `SELECT * FROM promocode_usage WHERE promocode_id = $1 AND user_id = $2`,
        [promocodeId, userId]
      );
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error checking promocode usage:', error);
      throw error;
    }
  }

  // Получение активного промокода на скидку для пользователя
  async getActiveDiscountPromocode(
    userId: number
  ): Promise<Promocode | null> {
    try {
      const result = await query(
        `SELECT p.* FROM promocodes p
         INNER JOIN promocode_usage pu ON p.id = pu.promocode_id
         WHERE p.type = 'discount' AND p.is_active = true AND pu.user_id = $1
         ORDER BY pu.used_at DESC
         LIMIT 1`,
        [userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting active discount promocode:', error);
      throw error;
    }
  }

  // Получение всех промокодов (для админ-панели)
  async getAllPromocodes(userId?: number): Promise<PromocodeWithUsage[]> {
    try {
      let queryText = `
        SELECT 
          p.*,
          COUNT(pu.id) as usage_count,
          CASE WHEN EXISTS (
            SELECT 1 FROM promocode_usage pu2 
            WHERE pu2.promocode_id = p.id AND pu2.user_id = $1
          ) THEN true ELSE false END as used_by_user
        FROM promocodes p
        LEFT JOIN promocode_usage pu ON p.id = pu.promocode_id
      `;

      const params: any[] = [];
      if (userId) {
        params.push(userId);
        queryText += ` GROUP BY p.id ORDER BY p.created_at DESC`;
      } else {
        queryText += ` GROUP BY p.id ORDER BY p.created_at DESC`;
      }

      const result = await query(queryText, userId ? params : []);
      return result.rows.map((row) => ({
        ...row,
        usage_count: parseInt(row.usage_count) || 0,
        used_by_user: row.used_by_user || false,
      }));
    } catch (error) {
      console.error('Error getting all promocodes:', error);
      throw error;
    }
  }

  // Получение промокода по ID
  async getPromocodeById(id: number): Promise<Promocode | null> {
    try {
      const result = await query(
        `SELECT * FROM promocodes WHERE id = $1`,
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting promocode by id:', error);
      throw error;
    }
  }

  // Создание промокода (для админ-панели)
  async createPromocode(
    request: CreatePromocodeRequest,
    createdBy: number
  ): Promise<Promocode> {
    try {
      const result = await query(
        `INSERT INTO promocodes (code, type, value, is_active, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          request.code.toUpperCase().trim(),
          request.type,
          request.value,
          request.is_active !== undefined ? request.is_active : true,
          createdBy,
        ]
      );
      return result.rows[0];
    } catch (error: any) {
      if (error.code === '23505') {
        // Unique violation
        throw new Error('Промокод с таким кодом уже существует');
      }
      console.error('Error creating promocode:', error);
      throw error;
    }
  }

  // Обновление промокода (для админ-панели)
  async updatePromocode(
    id: number,
    request: UpdatePromocodeRequest
  ): Promise<Promocode> {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (request.code !== undefined) {
        updates.push(`code = $${paramIndex}`);
        values.push(request.code.toUpperCase().trim());
        paramIndex++;
      }

      if (request.type !== undefined) {
        updates.push(`type = $${paramIndex}`);
        values.push(request.type);
        paramIndex++;
      }

      if (request.value !== undefined) {
        updates.push(`value = $${paramIndex}`);
        values.push(request.value);
        paramIndex++;
      }

      if (request.is_active !== undefined) {
        updates.push(`is_active = $${paramIndex}`);
        values.push(request.is_active);
        paramIndex++;
      }

      if (updates.length === 0) {
        await client.query('ROLLBACK');
        throw new Error('Нет полей для обновления');
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);

      const result = await client.query(
        `UPDATE promocodes SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error: any) {
      await client.query('ROLLBACK');
      if (error.code === '23505') {
        throw new Error('Промокод с таким кодом уже существует');
      }
      console.error('Error updating promocode:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Удаление промокода (для админ-панели)
  async deletePromocode(id: number): Promise<void> {
    try {
      await query(`DELETE FROM promocodes WHERE id = $1`, [id]);
    } catch (error) {
      console.error('Error deleting promocode:', error);
      throw error;
    }
  }

  // Удаление использования промокода на скидку после покупки
  async deactivateDiscountPromocodeForUser(userId: number, promocodeId: number): Promise<void> {
    try {
      await query(
        `DELETE FROM promocode_usage 
         WHERE user_id = $1 AND promocode_id = $2`,
        [userId, promocodeId]
      );
      console.log(`✅ Deactivated discount promocode ${promocodeId} for user ${userId}`);
    } catch (error) {
      console.error('Error deactivating discount promocode:', error);
      throw error;
    }
  }
}

export const promocodeService = new PromocodeService();
