import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { verificationService } from '../services/verification.service';
import { smsService } from '../services/sms.service';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middleware/auth';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

// Расширяем тип User для ответа
interface AuthUser {
  id: number;
  telegram_id?: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
  phone?: string;
  auth_type?: string;
  balance: number;
  total_spent: number;
  join_date: string;
}

export class AuthController {
  async telegramLogin(req: Request, res: Response): Promise<void> {
    try {
      const userData: TelegramUser = req.body;

      // В реальном приложении нужно верифицировать хэш
      // if (!this.verifyTelegramData(userData)) {
      //   res.status(400).json({ status: 'error', message: 'Invalid Telegram data' });
      //   return;
      // }

      // Ищем пользователя по Telegram ID или создаем нового
      let user = await userService.getUserByTelegramId(userData.id);

      if (!user) {
        // Создаем нового пользователя
        const email = `tg${userData.id}@telegram.user`;
        const username = userData.username || `user${userData.id}`;
        
        user = await userService.createUser({
          telegram_id: userData.id,
          username: username,
          email: email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          photo_url: userData.photo_url,
          balance: 0.00,
          total_spent: 0.00
        });
      }

      if (user) {

          // Создаем JWT токен
          const token = jwt.sign(
              { 
              userId: user.id, 
              telegramId: user.telegram_id,
              username: user.username 
              },
              process.env.JWT_SECRET || 'your-secret-key',
              { expiresIn: '30d' }
          );

          // Формируем ответ с пользователем
          const authUser: AuthUser = {
              id: user.id,
              telegram_id: user.telegram_id,
              username: user.username,
              email: user.email,
              first_name: user.first_name,
              last_name: user.last_name,
              balance: user.balance,
              total_spent: user.total_spent,
              join_date: user.join_date
          };

          res.json({
              status: 'success',
              data: {
              token,
              user: authUser
              }
          });

      }

    } catch (error) {
      console.error('Error in Telegram login:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to process login'
      });
    }
  }

  async getMe(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user.userId;
      const user = await userService.getUserById(userId);
      
      if (!user) {
        res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
        return;
      }

      // Формируем ответ с пользователем
      const authUser: AuthUser = {
        id: user.id,
        telegram_id: user.telegram_id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        balance: user.balance,
        total_spent: user.total_spent,
        join_date: user.join_date
      };

      res.json({
        status: 'success',
        data: {
          user: authUser
        }
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch user profile'
      });
    }
  }

  /**
   * Отправка SMS-кода на телефон (для регистрации/входа)
   */
  async sendPhoneCode(req: Request, res: Response): Promise<void> {
    try {
      const { phone } = req.body;
      const userIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress;

      if (!phone) {
        res.status(400).json({ status: 'error', message: 'Номер телефона обязателен' });
        return;
      }

      const result = await verificationService.sendPhoneCode(phone, userIp);

      if (result.success) {
        res.json({ status: 'success', message: 'Код отправлен на указанный номер' });
      } else {
        res.status(400).json({ status: 'error', message: result.message || 'Ошибка отправки кода' });
      }
    } catch (error) {
      console.error('Error sending phone code:', error);
      res.status(500).json({ status: 'error', message: 'Ошибка при отправке кода' });
    }
  }

  /**
   * Отправка кода на email (для регистрации/входа)
   */
  async sendEmailCode(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ status: 'error', message: 'Email обязателен' });
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({ status: 'error', message: 'Неверный формат email' });
        return;
      }

      const result = await verificationService.sendEmailCode(email);

      if (result.success) {
        res.json({ status: 'success', message: 'Код отправлен на указанный email' });
      } else {
        res.status(400).json({ status: 'error', message: result.message || 'Ошибка отправки кода' });
      }
    } catch (error) {
      console.error('Error sending email code:', error);
      res.status(500).json({ status: 'error', message: 'Ошибка при отправке кода' });
    }
  }

  /**
   * Вход/регистрация по телефону или email с кодом подтверждения
   */
  async webLogin(req: Request, res: Response): Promise<void> {
    try {
      const { phone, email, code } = req.body;

      if (!code) {
        res.status(400).json({ status: 'error', message: 'Код подтверждения обязателен' });
        return;
      }

      let user;

      if (phone) {
        const normalizedPhone = smsService.normalizePhoneForStorage(phone);
        if (!normalizedPhone) {
          res.status(400).json({ status: 'error', message: 'Неверный формат номера телефона' });
          return;
        }

        const verifyResult = await verificationService.verifyCode(normalizedPhone, code, 'phone');
        if (!verifyResult.success) {
          res.status(400).json({ status: 'error', message: verifyResult.message });
          return;
        }

        user = await userService.getUserByPhone(normalizedPhone);
        if (!user) {
          user = await userService.createWebUser({ phone: normalizedPhone, authType: 'phone' });
        }
      } else if (email) {
        const normalizedEmail = email.toLowerCase().trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
          res.status(400).json({ status: 'error', message: 'Неверный формат email' });
          return;
        }

        const verifyResult = await verificationService.verifyCode(normalizedEmail, code, 'email');
        if (!verifyResult.success) {
          res.status(400).json({ status: 'error', message: verifyResult.message });
          return;
        }

        user = await userService.getUserByEmail(normalizedEmail);
        if (!user) {
          user = await userService.createWebUser({ email: normalizedEmail, authType: 'email' });
        }
      } else {
        res.status(400).json({ status: 'error', message: 'Укажите телефон или email' });
        return;
      }

      const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '30d' }
      );

      const authUser: AuthUser = {
        id: user.id,
        telegram_id: user.telegram_id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        auth_type: user.auth_type,
        balance: user.balance,
        total_spent: user.total_spent,
        join_date: user.join_date
      };

      res.json({
        status: 'success',
        data: { token, user: authUser }
      });
    } catch (error) {
      console.error('Error in web login:', error);
      res.status(500).json({ status: 'error', message: 'Ошибка при входе' });
    }
  }

  private verifyTelegramData(userData: TelegramUser): boolean {
    // TODO: Реализовать верификацию данных Telegram
    return true;
  }
}

export const authController = new AuthController();