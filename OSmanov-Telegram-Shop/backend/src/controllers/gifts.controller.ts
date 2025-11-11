import { Request, Response } from 'express';
import { giftsApiService } from '../services/giftsApi.service';

export class GiftsController {
  async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const token = await giftsApiService.getAuthToken();
      const categories = await giftsApiService.getCategories(token);
      
      res.json({
        status: 'success',
        data: categories
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch categories'
      });
    }
  }

  async getAllServices(req: Request, res: Response): Promise<void> {
    try {
      const token = await giftsApiService.getAuthToken();
      const services = await giftsApiService.getAllServices(token);
      
      res.json({
        status: 'success',
        data: services
      });
    } catch (error) {
      console.error('Error fetching services:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch services'
      });
    }
  }

  async getAuthToken(req: Request, res: Response): Promise<void> {
    try {
      const token = await giftsApiService.getAuthToken();
      
      res.json({
        status: 'success',
        data: { token }
      });
    } catch (error) {
      console.error('Error getting auth token:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get auth token'
      });
    }
  }

  async getServicesByCategory(req: Request, res: Response): Promise<void> {
    try {
      const { category_id } = req.query;
      
      if (!category_id) {
        res.status(400).json({
          status: 'error',
          message: 'Category ID is required'
        });
        return;
      }

      const token = await giftsApiService.getAuthToken();
      const services = await giftsApiService.getServicesByCategory(
        token, 
        parseInt(category_id as string)
      );
      
      res.json({
        status: 'success',
        data: services
      });
    } catch (error) {
      console.error('Error fetching services by category:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch services by category'
      });
    }
  }

  async getOrderInfo(req: Request, res: Response): Promise<void> {
    try {
      const { custom_id } = req.body;

      if (!custom_id) {
        res.status(400).json({
          status: 'error',
          message: 'custom_id is required'
        });
        return;
      }

      console.log(`📦 Fetching order info for custom_id: ${custom_id}`);
      
      const token = await giftsApiService.getAuthToken();
      const orderInfo = await giftsApiService.getOrderInfo(token, custom_id);
      
      console.log(`✅ Order info retrieved for ${custom_id}:`, {
        status: orderInfo.status,
        product: orderInfo.product,
        status_message: orderInfo.status_message
      });
      
      res.json({
        status: 'success',
        data: orderInfo
      });
    } catch (error) {
      console.error('❌ Error fetching order info:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch order information'
      });
    }
  }

  // Дополнительный метод для получения информации о нескольких заказах
  async getMultipleOrdersInfo(req: Request, res: Response): Promise<void> {
    try {
      const { custom_ids } = req.body;

      if (!custom_ids || !Array.isArray(custom_ids)) {
        res.status(400).json({
          status: 'error',
          message: 'custom_ids array is required'
        });
        return;
      }

      console.log(`📦 Fetching info for ${custom_ids.length} orders`);
      
      const token = await giftsApiService.getAuthToken();
      const ordersPromises = custom_ids.map(custom_id => 
        giftsApiService.getOrderInfo(token, custom_id)
      );
      
      const orders = await Promise.all(ordersPromises);
      
      console.log(`✅ Successfully retrieved info for ${orders.length} orders`);
      
      res.json({
        status: 'success',
        data: orders
      });
    } catch (error) {
      console.error('❌ Error fetching multiple orders info:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch orders information'
      });
    }
  }
}

export const giftsController = new GiftsController();