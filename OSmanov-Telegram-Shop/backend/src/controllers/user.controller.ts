import { Request, Response } from 'express';
import { userService } from '../services/user.service';

export class UserController {
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      // В реальном приложении здесь будет auth middleware, который добавит user.id в req
      const userId = parseInt(req.params.userId) || 1; // Временно используем ID 1 для теста
      
      const profile = await userService.getUserProfile(userId);
      
      res.json({
        status: 'success',
        data: profile
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch user profile'
      });
    }
  }

  async updateBalance(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.userId) || 1; // Временно используем ID 1 для теста
      const { amount, payment_method, payment_details } = req.body;

      if (!amount || amount <= 0) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid amount'
        });
        return;
      }

      const updatedUser = await userService.updateUserBalance(userId, amount);
      
      res.json({
        status: 'success',
        data: {
          user: updatedUser,
          added_amount: amount
        }
      });
    } catch (error) {
      console.error('Error updating balance:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update balance'
      });
    }
  }

  async getPurchaseHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.userId) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const purchases = await userService.getUserPurchases(userId, limit);
      
      res.json({
        status: 'success',
        data: purchases
      });
    } catch (error) {
      console.error('Error fetching purchase history:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch purchase history'
      });
    }
  }

  async getTransactionHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.userId) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const transactions = await userService.getTransactionHistory(userId, limit);
      
      res.json({
        status: 'success',
        data: transactions
      });
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch transaction history'
      });
    }
  }
}

export const userController = new UserController();