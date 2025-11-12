import { Request, Response } from 'express';
import { userService } from '../services/user.service';
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

  private verifyTelegramData(userData: TelegramUser): boolean {
    // TODO: Реализовать верификацию данных Telegram
    // Согласно документации: https://core.telegram.org/widgets/login#checking-authorization
    return true; // Временно для разработки
  }
}

export const authController = new AuthController();