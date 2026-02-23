// backend/src/controllers/fragment.controller.ts
import { Response } from 'express';
import { fragmentService } from '../services/fragment.service';
import { AuthRequest } from '../middleware/auth';
import { adminService } from '../services/admin.service';
import { userService } from '../services/user.service';

export class FragmentController {
  /**
   * Создает заказ на покупку Telegram Stars
   * POST /api/fragment/stars
   */
  async createStarsOrder(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { username, quantity, show_sender } = req.body;

      if (!req.user || !req.user.userId) {
        res.status(401).json({
          success: false,
          error: 'Пользователь не авторизован'
        });
        return;
      }

      const userId = req.user.userId as number;

      // Валидация
      if (!username || typeof username !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Username обязателен для заполнения'
        });
        return;
      }

      if (!quantity || typeof quantity !== 'number' || quantity < 50) {
        res.status(400).json({
          success: false,
          error: 'Минимальное количество звезд: 50'
        });
        return;
      }

      if (quantity > 100000) {
        res.status(400).json({
          success: false,
          error: 'Максимальное количество звезд: 100,000'
        });
        return;
      }

      // Получаем настройки с ценами
      const settings = await adminService.getSettings();
      const usdToRub = settings?.usd_to_rub_rate || 90;
      const starPriceRub = settings?.telegram_star_price_rub || 1.0;

      // Считаем итоговую стоимость
      const totalPriceRub = starPriceRub * quantity;
      const totalPriceUsd = totalPriceRub / usdToRub;

      // Проверяем баланс пользователя (баланс в USD)
      const currentBalance = await userService.getUserBalance(userId);
      if (currentBalance < totalPriceUsd) {
        res.status(400).json({
          success: false,
          error: 'Недостаточно средств на балансе'
        });
        return;
      }

      // Создаем заказ во Fragment
      const result = await fragmentService.createStarsOrder({
        username: username.trim(),
        quantity: quantity,
        show_sender: show_sender || false
      });

      if (result.success) {
        // Списываем баланс только после успешного создания заказа
        await userService.deductUserBalance(userId, totalPriceUsd);
        const newBalance = await userService.getUserBalance(userId);

        res.json({
          success: true,
          order_id: result.order_id,
          payment_url: result.payment_url,
          total_price_rub: totalPriceRub,
          total_price_usd: totalPriceUsd,
          new_balance_usd: newBalance,
          data: result.data
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error || 'Ошибка при создании заказа на звезды'
        });
      }
    } catch (error: any) {
      console.error('Error in createStarsOrder controller:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Внутренняя ошибка сервера'
      });
    }
  }

  /**
   * Создает заказ на покупку Telegram Premium
   * POST /api/fragment/premium
   */
  async createPremiumOrder(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { username, months } = req.body;

      if (!req.user || !req.user.userId) {
        res.status(401).json({
          success: false,
          error: 'Пользователь не авторизован'
        });
        return;
      }

      const userId = req.user.userId as number;

      // Валидация
      if (!username || typeof username !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Username обязателен для заполнения'
        });
        return;
      }

      if (!months || typeof months !== 'number' || ![3, 6, 12].includes(months)) {
        res.status(400).json({
          success: false,
          error: 'Доступны только периоды: 3, 6 или 12 месяцев'
        });
        return;
      }

      // Получаем настройки с ценами
      const settings = await adminService.getSettings();
      const usdToRub = settings?.usd_to_rub_rate || 90;
      
      // Определяем цену в зависимости от количества месяцев
      let premiumPriceRub: number;
      if (months === 3 && settings?.telegram_premium_3m_price_rub) {
        premiumPriceRub = settings.telegram_premium_3m_price_rub;
      } else if (months === 6 && settings?.telegram_premium_6m_price_rub) {
        premiumPriceRub = settings.telegram_premium_6m_price_rub;
      } else if (months === 12 && settings?.telegram_premium_12m_price_rub) {
        premiumPriceRub = settings.telegram_premium_12m_price_rub;
      } else {
        // Fallback на базовую цену за месяц
        premiumPriceRub = (settings?.telegram_premium_price_rub || 399.0) * months;
      }

      // Считаем итоговую стоимость
      const totalPriceRub = premiumPriceRub;
      const totalPriceUsd = totalPriceRub / usdToRub;

      // Проверяем баланс пользователя (в USD)
      const currentBalance = await userService.getUserBalance(userId);
      if (currentBalance < totalPriceUsd) {
        res.status(400).json({
          success: false,
          error: 'Недостаточно средств на балансе'
        });
        return;
      }

      // Создаем заказ во Fragment
      const result = await fragmentService.createPremiumOrder({
        username: username.trim(),
        months: months
      });

      if (result.success) {
        // Списываем баланс только после успешного создания заказа
        await userService.deductUserBalance(userId, totalPriceUsd);
        const newBalance = await userService.getUserBalance(userId);

        res.json({
          success: true,
          order_id: result.order_id,
          payment_url: result.payment_url,
          total_price_rub: totalPriceRub,
          total_price_usd: totalPriceUsd,
          new_balance_usd: newBalance,
          data: result.data
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error || 'Ошибка при создании заказа на премиум'
        });
      }
    } catch (error: any) {
      console.error('Error in createPremiumOrder controller:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Внутренняя ошибка сервера'
      });
    }
  }
}

export const fragmentController = new FragmentController();
