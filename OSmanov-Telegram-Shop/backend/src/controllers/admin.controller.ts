import { Request, Response } from 'express';
import { adminService, AdminUser } from '../services/admin.service';
import { AuthRequest } from '../middleware/auth';
import { AdminAuthRequest } from '../middleware/adminAuth';
import { userService } from '../services/user.service';

export class AdminController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        res.status(400).json({
          status: 'error',
          message: 'Username and password are required'
        });
        return;
      }

      const admin = await adminService.authenticate(username, password);

      if (!admin) {
        res.status(401).json({
          status: 'error',
          message: 'Invalid username or password'
        });
        return;
      }

      const token = adminService.generateToken(admin);

      res.json({
        status: 'success',
        data: {
          token,
          user: admin
        }
      });
    } catch (error) {
      console.error('Error in admin login:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to process login'
      });
    }
  }

  async getSettings(req: AuthRequest, res: Response): Promise<void> {
    try {
      const settings = await adminService.getSettings();

      res.json({
        status: 'success',
        data: settings || {
          usd_to_rub_rate: 90, // Значение по умолчанию
          min_deposit_amount: 100,
          max_deposit_amount: 100000
        }
      });
    } catch (error) {
      console.error('Error fetching admin settings:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch settings'
      });
    }
  }

  async updateExchangeRate(req: AdminAuthRequest, res: Response): Promise<void> {
    try {
        console.log('Update exchange rate - req.user:', req.user);
        console.log('Request body:', req.body);
        
        if (!req.user || !req.user.adminId) {
        res.status(401).json({
            status: 'error',
            message: 'Admin not authenticated'
        });
        return;
        }

        const { usd_to_rub_rate } = req.body;
        const adminId = req.user.adminId;

        console.log('Admin ID:', adminId);
        console.log('Exchange rate:', usd_to_rub_rate);

        if (!usd_to_rub_rate || usd_to_rub_rate <= 0) {
        res.status(400).json({
            status: 'error',
            message: 'Valid exchange rate is required'
        });
        return;
        }

        const settings = await adminService.updateExchangeRate(usd_to_rub_rate, adminId);

        res.json({
        status: 'success',
        data: settings
        });
    } catch (error) {
        console.error('Error updating exchange rate:', error);
        res.status(500).json({
        status: 'error',
        message: 'Failed to update exchange rate'
        });
    }
    }

  async getMe(req: AdminAuthRequest, res: Response): Promise<void> {
    try {
        console.log('Admin in request:', req.user);
        
        if (!req.user || !req.user.adminId) {
        res.status(401).json({
            status: 'error',
            message: 'Admin not authenticated'
        });
        return;
        }

        const adminId = req.user.adminId;
        console.log('Fetching admin with ID:', adminId);
        
        const admin = await adminService.getAdminById(adminId);
        
        if (!admin) {
        console.log('Admin not found for ID:', adminId);
        res.status(404).json({
            status: 'error',
            message: 'Admin not found'
        });
        return;
        }

        // Формируем ответ
        const authAdmin = {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        created_at: admin.created_at,
        updated_at: admin.updated_at
        };

        res.json({
        status: 'success',
        data: {
            user: authAdmin
        }
        });
    } catch (error) {
        console.error('Error fetching admin profile:', error);
        res.status(500).json({
        status: 'error',
        message: 'Failed to fetch admin profile'
        });
    }
    }

  async logout(req: Request, res: Response): Promise<void> {
    // В JWT-аутентификации logout обычно реализуется на клиенте
    res.json({
      status: 'success',
      message: 'Logout successful'
    });
  }

  // Публичный метод для получения курса (без авторизации)
  async getPublicSettings(req: Request, res: Response): Promise<void> {
    try {
      const settings = await adminService.getSettings();

      // Возвращаем только курс для публичного доступа
      res.json({
        status: 'success',
        data: {
          usd_to_rub_rate: settings?.usd_to_rub_rate || 90,
          updated_at: settings?.updated_at || new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error fetching public settings:', error);
      
      // Fallback значение
      res.json({
        status: 'success',
        data: {
          usd_to_rub_rate: 90,
          updated_at: new Date().toISOString()
        }
      });
    }
  }

  async getStatistics(req: AdminAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.adminId) {
        res.status(401).json({
          status: 'error',
          message: 'Admin not authenticated'
        });
        return;
      }

      const statistics = await adminService.getStatistics();

      res.json({
        status: 'success',
        data: statistics
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch statistics'
      });
    }
  }

  async getUsers(req: AdminAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.adminId) {
        res.status(401).json({
          status: 'error',
          message: 'Admin not authenticated'
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string | undefined;

      const result = await userService.getAllUsers(page, limit, search);

      res.json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch users'
      });
    }
  }

  async updateUserBalance(req: AdminAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.adminId) {
        res.status(401).json({
          status: 'error',
          message: 'Admin not authenticated'
        });
        return;
      }

      const { userId, balance } = req.body;

      if (!userId || balance === undefined) {
        res.status(400).json({
          status: 'error',
          message: 'User ID and balance are required'
        });
        return;
      }

      if (isNaN(parseFloat(balance)) || parseFloat(balance) < 0) {
        res.status(400).json({
          status: 'error',
          message: 'Balance must be a valid positive number'
        });
        return;
      }

      const user = await userService.updateUserBalanceById(userId, parseFloat(balance));

      res.json({
        status: 'success',
        data: user
      });
    } catch (error: any) {
      console.error('Error updating user balance:', error);
      res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to update user balance'
      });
    }
  }

  async getUserPurchasesAdmin(req: AdminAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.adminId) {
        res.status(401).json({
          status: 'error',
          message: 'Admin not authenticated'
        });
        return;
      }

      const { userId, username } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!userId && !username) {
        res.status(400).json({
          status: 'error',
          message: 'User ID or username is required'
        });
        return;
      }

      let user: any = null;

      if (userId) {
        const id = parseInt(userId as string, 10);
        if (isNaN(id)) {
          res.status(400).json({
            status: 'error',
            message: 'Invalid user ID'
          });
          return;
        }

        // Если число слишком большое для int4, считаем, что это Telegram ID
        const INT32_MAX = 2147483647;
        if (id > INT32_MAX) {
          user = await userService.getUserByTelegramId(id);
        } else {
          // Сначала пробуем найти по внутреннему ID
          user = await userService.getUserById(id);
          // Если не нашли — пробуем как Telegram ID
          if (!user) {
            user = await userService.getUserByTelegramId(id);
          }
        }
      } else if (username) {
        const usernameStr = (username as string).replace(/^@/, '');
        user = await userService.getUserByUsername(usernameStr);
      }

      if (!user) {
        res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
        return;
      }

      const purchasesData = await userService.getUserPurchasesPaginated(user.id, page, limit);

      res.json({
        status: 'success',
        data: {
          user,
          ...purchasesData
        }
      });
    } catch (error) {
      console.error('Error fetching user purchases (admin):', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch user purchases'
      });
    }
  }
}

export const adminController = new AdminController();