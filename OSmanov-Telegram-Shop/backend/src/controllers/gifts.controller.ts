import { Request, Response } from 'express';
import { giftsApiService } from '../services/giftsApi.service';
import { userService } from '../services/user.service';
import { uuid } from 'uuidv4';
import { CheckoutRequest, CheckoutResponse } from '../types/api.types';

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

  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const { service_id, quantity, data, user_id, service_name, price } = req.body;

      if (!service_id || !quantity || !user_id || !service_name || !price) {
        res.status(400).json({
          status: 'error',
          message: 'service_id, quantity, user_id, service_name, and price are required'
        });
        return;
      }

      const custom_id = uuid();
      console.log(`🆕 Creating order for user ${user_id}, service ${service_name}`);

      const token = await giftsApiService.getAuthToken();
      
      const orderData = {
        service_id: parseInt(service_id),
        quantity: parseFloat(quantity),
        custom_id,
        data: data || ''
      };

      const order = await giftsApiService.createOrder(token, orderData);
      
      // Сохраняем заказ в базу данных
      await userService.savePurchaseWithDetails({
        user_id: parseInt(user_id),
        custom_id,
        service_id: parseInt(service_id),
        service_name,
        quantity: parseFloat(quantity),
        total_price: parseFloat(price) * parseFloat(quantity),
        status: 'pending'
      });

      console.log(`✅ Order created: ${custom_id}, total: ${order.total}`);
      
      res.json({
        status: 'success',
        data: {
          ...order,
          service_name,
          user_id: parseInt(user_id)
        }
      });
    } catch (error) {
      console.error('❌ Error creating order:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to create order'
      });
    }
  }

  async payOrder(req: Request, res: Response): Promise<void> {
    try {
      const { custom_id, user_id } = req.body;

      if (!custom_id || !user_id) {
        res.status(400).json({
          status: 'error',
          message: 'custom_id and user_id are required'
        });
        return;
      }

      console.log(`💳 Paying for order: ${custom_id}`);

      const token = await giftsApiService.getAuthToken();
      const paymentResult = await giftsApiService.payOrder(token, custom_id);
      
      console.log('💰 Payment result:', paymentResult);
      
      // Получаем информацию о заказе
      const orderInfo = await giftsApiService.getOrderInfo(token, custom_id);
      
      console.log('📦 Order info:', orderInfo);
      
      // Определяем статус для БД
      let dbStatus: 'pending' | 'completed' | 'failed' = 'pending';
      if (orderInfo.status === 2) dbStatus = 'completed';
      else if (orderInfo.status === 3) dbStatus = 'failed';

      // Обновляем статус заказа в базе данных
      await userService.updatePurchaseStatus(
        custom_id, 
        dbStatus,
        orderInfo.pins,
        orderInfo.data
      );

      console.log(`✅ Order paid: ${custom_id}, status: ${orderInfo.status_message}`);
      
      res.json({
        status: 'success',
        data: {
          payment: paymentResult,
          order: orderInfo
        }
      });
    } catch (error) {
      console.error('❌ Error paying order:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to pay order'
      });
    }
  }

  async checkout(req: Request, res: Response): Promise<void> {
    try {
      const { user_id, items }: CheckoutRequest = req.body;

      if (!user_id || !items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({
          status: 'error',
          message: 'user_id and items array are required'
        });
        return;
      }

      console.log(`🛒 Processing checkout for user ${user_id} with ${items.length} items`);

      // Проверяем баланс пользователя
      const userBalance = await userService.getUserBalance(parseInt(user_id));
      const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      if (userBalance < totalAmount) {
        res.status(400).json({
          status: 'error',
          message: `Insufficient balance. Available: ${userBalance}, Required: ${totalAmount}`
        });
        return;
      }

      const token = await giftsApiService.getAuthToken();
      const results: CheckoutResponse[] = [];

      // Списываем сумму с баланса
      await userService.deductUserBalance(parseInt(user_id), totalAmount);

      // Обрабатываем каждый товар в корзине
      for (const item of items) {
        try {
          const custom_id = uuid();
          
          // Создаем заказ
          const order = await giftsApiService.createOrder(token, {
            service_id: item.service_id,
            quantity: item.quantity,
            custom_id,
            data: item.data || ''
          });

          // Оплачиваем заказ
          await giftsApiService.payOrder(token, custom_id);
          
          // Получаем информацию о заказе
          const orderInfo = await giftsApiService.getOrderInfo(token, custom_id);
          
          // Определяем статус
          let dbStatus: 'pending' | 'completed' | 'failed' = 'pending';
          if (orderInfo.status === 2) dbStatus = 'completed';
          else if (orderInfo.status === 3) dbStatus = 'failed';

          // Сохраняем в базу данных
          await userService.savePurchaseWithDetails({
            user_id: parseInt(user_id),
            custom_id,
            service_id: item.service_id,
            service_name: item.service_name,
            quantity: item.quantity,
            total_price: item.price * item.quantity,
            status: dbStatus,
            pins: orderInfo.pins,
            data: orderInfo.data
          });

          results.push({
            success: orderInfo.status === 2,
            custom_id,
            service_id: item.service_id,
            service_name: item.service_name,
            status: orderInfo.status,
            status_message: orderInfo.status_message,
            pins: orderInfo.pins,
            data: orderInfo.data
          });

          console.log(`✅ Processed: ${item.service_name}, status: ${orderInfo.status_message}`);

        } catch (itemError) {
          console.error(`❌ Error processing ${item.service_name}:`, itemError);
          results.push({
            success: false,
            custom_id: '',
            service_id: item.service_id,
            service_name: item.service_name,
            status: 3,
            status_message: 'Processing failed',
            error: itemError instanceof Error ? itemError.message : 'Unknown error'
          });
        }
      }

      // Проверяем есть ли неудачные операции
      const failedItems = results.filter(item => !item.success);
      if (failedItems.length > 0) {
        // Возвращаем деньги за неудачные операции
        const refundAmount = failedItems.reduce((sum, item) => {
          const originalItem = items.find(i => i.service_id === item.service_id);
          return sum + (originalItem ? originalItem.price * originalItem.quantity : 0);
        }, 0);

        if (refundAmount > 0) {
          await userService.updateUserBalance(parseInt(user_id), refundAmount);
          console.log(`💸 Refunded ${refundAmount} for ${failedItems.length} failed items`);
        }
      }

      res.json({
        status: 'success',
        data: {
          results,
          total_processed: results.filter(r => r.success).length,
          total_failed: failedItems.length,
          total_amount: totalAmount
        }
      });

    } catch (error) {
      console.error('❌ Error during checkout:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to process checkout'
      });
    }
  }

  async getOrderInfoByCustomId(req: Request, res: Response): Promise<void> {
    try {
      const { custom_id } = req.body;

      if (!custom_id) {
        res.status(400).json({
          status: 'error',
          message: 'custom_id is required'
        });
        return;
      }

      console.log(`📦 Fetching detailed order info for: ${custom_id}`);
      
      const token = await giftsApiService.getAuthToken();
      const orderInfo = await giftsApiService.getOrderInfo(token, custom_id);
      
      console.log(`✅ Detailed order info retrieved for ${custom_id}`);
      
      res.json({
        status: 'success',
        data: orderInfo
      });
    } catch (error) {
      console.error('❌ Error fetching detailed order info:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch detailed order information'
      });
    }
  }
}

export const giftsController = new GiftsController();