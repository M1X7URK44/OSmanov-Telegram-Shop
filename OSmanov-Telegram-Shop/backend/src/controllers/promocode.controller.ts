import { Request, Response } from 'express';
import { promocodeService } from '../services/promocode.service';
import { AdminAuthRequest } from '../middleware/adminAuth';

export class PromocodeController {
  // Активация промокода пользователем
  async activatePromocode(req: Request, res: Response): Promise<void> {
    try {
      const { code, user_id } = req.body;

      if (!code || !user_id) {
        res.status(400).json({
          status: 'error',
          message: 'Код промокода и ID пользователя обязательны',
        });
        return;
      }

      const result = await promocodeService.activatePromocode({
        code,
        user_id: parseInt(user_id),
      });

      if (result.success) {
        res.json({
          status: 'success',
          data: result,
        });
      } else {
        res.status(400).json({
          status: 'error',
          message: result.message,
        });
      }
    } catch (error) {
      console.error('Error activating promocode:', error);
      res.status(500).json({
        status: 'error',
        message: 'Ошибка при активации промокода',
      });
    }
  }

  // Получение активного промокода на скидку для пользователя
  async getActiveDiscountPromocode(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);

      if (!userId) {
        res.status(400).json({
          status: 'error',
          message: 'ID пользователя обязателен',
        });
        return;
      }

      const promocode = await promocodeService.getActiveDiscountPromocode(userId);

      res.json({
        status: 'success',
        data: promocode,
      });
    } catch (error) {
      console.error('Error getting active discount promocode:', error);
      res.status(500).json({
        status: 'error',
        message: 'Ошибка при получении промокода',
      });
    }
  }

  // Получение всех промокодов (для админ-панели)
  async getAllPromocodes(req: AdminAuthRequest, res: Response): Promise<void> {
    try {
      console.log('GET /api/promocodes - Request received');
      console.log('User:', req.user);
      const userId = req.user?.adminId;
      const promocodes = await promocodeService.getAllPromocodes(userId);

      console.log('Promocodes retrieved:', promocodes.length);
      res.json({
        status: 'success',
        data: promocodes,
      });
    } catch (error) {
      console.error('Error getting all promocodes:', error);
      res.status(500).json({
        status: 'error',
        message: 'Ошибка при получении промокодов',
      });
    }
  }

  // Получение промокода по ID (для админ-панели)
  async getPromocodeById(req: AdminAuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (!id) {
        res.status(400).json({
          status: 'error',
          message: 'ID промокода обязателен',
        });
        return;
      }

      const promocode = await promocodeService.getPromocodeById(id);

      if (!promocode) {
        res.status(404).json({
          status: 'error',
          message: 'Промокод не найден',
        });
        return;
      }

      res.json({
        status: 'success',
        data: promocode,
      });
    } catch (error) {
      console.error('Error getting promocode by id:', error);
      res.status(500).json({
        status: 'error',
        message: 'Ошибка при получении промокода',
      });
    }
  }

  // Создание промокода (для админ-панели)
  async createPromocode(req: AdminAuthRequest, res: Response): Promise<void> {
    try {
      console.log('POST /api/promocodes - Request received');
      console.log('Request body:', req.body);
      console.log('User:', req.user);
      const { code, type, value, is_active } = req.body;
      const createdBy = req.user?.adminId;

      if (!code || !type || value === undefined) {
        res.status(400).json({
          status: 'error',
          message: 'Код, тип и значение промокода обязательны',
        });
        return;
      }

      if (type !== 'balance' && type !== 'discount') {
        res.status(400).json({
          status: 'error',
          message: 'Тип промокода должен быть "balance" или "discount"',
        });
        return;
      }

      if (type === 'discount' && (value < 0 || value > 100)) {
        res.status(400).json({
          status: 'error',
          message: 'Скидка должна быть от 0 до 100 процентов',
        });
        return;
      }

      if (type === 'balance' && value <= 0) {
        res.status(400).json({
          status: 'error',
          message: 'Сумма пополнения должна быть больше 0',
        });
        return;
      }

      if (!createdBy) {
        res.status(401).json({
          status: 'error',
          message: 'Не авторизован',
        });
        return;
      }

      const promocode = await promocodeService.createPromocode(
        {
          code,
          type,
          value: parseFloat(value),
          is_active: is_active !== undefined ? is_active : true,
        },
        createdBy
      );

      res.json({
        status: 'success',
        data: promocode,
      });
    } catch (error: any) {
      console.error('Error creating promocode:', error);
      res.status(500).json({
        status: 'error',
        message: error.message || 'Ошибка при создании промокода',
      });
    }
  }

  // Обновление промокода (для админ-панели)
  async updatePromocode(req: AdminAuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const { code, type, value, is_active } = req.body;

      if (!id) {
        res.status(400).json({
          status: 'error',
          message: 'ID промокода обязателен',
        });
        return;
      }

      if (type && type !== 'balance' && type !== 'discount') {
        res.status(400).json({
          status: 'error',
          message: 'Тип промокода должен быть "balance" или "discount"',
        });
        return;
      }

      if (type === 'discount' && value !== undefined && (value < 0 || value > 100)) {
        res.status(400).json({
          status: 'error',
          message: 'Скидка должна быть от 0 до 100 процентов',
        });
        return;
      }

      if (type === 'balance' && value !== undefined && value <= 0) {
        res.status(400).json({
          status: 'error',
          message: 'Сумма пополнения должна быть больше 0',
        });
        return;
      }

      const promocode = await promocodeService.updatePromocode(id, {
        code,
        type,
        value: value !== undefined ? parseFloat(value) : undefined,
        is_active,
      });

      res.json({
        status: 'success',
        data: promocode,
      });
    } catch (error: any) {
      console.error('Error updating promocode:', error);
      res.status(500).json({
        status: 'error',
        message: error.message || 'Ошибка при обновлении промокода',
      });
    }
  }

  // Удаление промокода (для админ-панели)
  async deletePromocode(req: AdminAuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (!id) {
        res.status(400).json({
          status: 'error',
          message: 'ID промокода обязателен',
        });
        return;
      }

      await promocodeService.deletePromocode(id);

      res.json({
        status: 'success',
        message: 'Промокод удален',
      });
    } catch (error) {
      console.error('Error deleting promocode:', error);
      res.status(500).json({
        status: 'error',
        message: 'Ошибка при удалении промокода',
      });
    }
  }
}

export const promocodeController = new PromocodeController();
