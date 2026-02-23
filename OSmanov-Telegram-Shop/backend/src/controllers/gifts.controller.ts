import { Request, Response } from 'express';
import { giftsApiService } from '../services/giftsApi.service';
import { userService } from '../services/user.service';
import { uuid } from 'uuidv4';
import { CheckoutRequest, CheckoutResponse } from '../types/api.types';

export class GiftsController {
  async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const token = await giftsApiService.getAuthToken();
      const categoriesResponse = await giftsApiService.getCategories(token);
      
      // Получаем массив категорий из ответа API
      let categories = categoriesResponse;
      if (categoriesResponse && categoriesResponse.data && Array.isArray(categoriesResponse.data)) {
        categories = categoriesResponse.data;
      } else if (Array.isArray(categoriesResponse)) {
        categories = categoriesResponse;
      }
      
      // Проверяем, есть ли уже категория с category_id=1
      const hasSteamTopUp = categories.some((cat: any) => cat.category_id === 1);
      
      // Добавляем категорию "Steam CIS TopUp" с category_id=1, если её нет
      if (!hasSteamTopUp) {
        const steamTopUpCategory = {
          category_name: 'Steam CIS TopUp',
          category_id: 1
        };
        // Добавляем в начало массива
        categories = [steamTopUpCategory, ...categories];
        console.log('✅ Added Steam CIS TopUp category with category_id=1');
      }
      
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
      const categoryId = parseInt(category_id as string);
      let servicesResponse = await giftsApiService.getServicesByCategory(
        token, 
        categoryId
      );
      
      // Получаем массив сервисов из ответа API
      let services = servicesResponse;
      if (servicesResponse && servicesResponse.data && Array.isArray(servicesResponse.data)) {
        services = servicesResponse.data;
      } else if (Array.isArray(servicesResponse)) {
        services = servicesResponse;
      }
      
      // Для category_id=1 оставляем только товар с service_id=1
      if (categoryId === 1) {
        const filteredServices = services.filter((service: any) => service.service_id === 1);
        console.log(`✅ Filtered services for category_id=1: ${services.length} -> ${filteredServices.length} (only service_id=1)`);
        services = filteredServices;
      }
      
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
      
      // Для Steam TopUp (service_id=1) определяем исходную сумму в USD
      const isSteamTopUp = parseInt(service_id) === 1;
      let originalUsdAmount: number | undefined;
      let finalPrice = parseFloat(price);
      
      // Если это Steam TopUp, price уже в рублях (конвертирован на фронтенде)
      // quantity - это сумма в USD, которую ввел пользователь
      if (isSteamTopUp) {
        originalUsdAmount = parseFloat(quantity); // Исходная сумма в USD
        finalPrice = parseFloat(price); // Уже конвертированная сумма в рублях
        
        console.log(`💰 Steam TopUp order creation:`, {
          custom_id,
          usd_amount: originalUsdAmount,
          price_in_rubles: finalPrice,
          quantity: parseFloat(quantity),
          price_param: price
        });
      } else {
        // Для обычных товаров: price * quantity
        finalPrice = parseFloat(price) * parseFloat(quantity);
      }
      
      // Сохраняем заказ в базу данных
      await userService.savePurchaseWithDetails({
        user_id: parseInt(user_id),
        custom_id,
        service_id: parseInt(service_id),
        service_name,
        quantity: parseFloat(quantity),
        total_price: finalPrice,
        status: 'pending',
        currency: isSteamTopUp ? 'RUB' : 'USD',
        original_usd_amount: originalUsdAmount
      });
      
      console.log(`✅ Order saved to DB: custom_id=${custom_id}, total_price=${finalPrice}, currency=${isSteamTopUp ? 'RUB' : 'USD'}`);

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

      // Для Steam top-up (service_id=1) списываем баланс перед оплатой
      const purchase = await userService.getPurchaseByCustomId(custom_id);
      if (purchase && purchase.service_id === 1) {
        const userBalance = await userService.getUserBalance(parseInt(user_id));
        
        // ВАЖНО: Баланс пользователя хранится в USD, поэтому списываем original_usd_amount (в USD)
        // а не total_price (в рублях)!
        let totalAmount: number;
        
        // Используем original_usd_amount из payment_details, если он есть
        if (purchase.original_usd_amount !== null && purchase.original_usd_amount !== undefined) {
          totalAmount = parseFloat(purchase.original_usd_amount);
        } else {
          // Fallback: если original_usd_amount нет, используем quantity (которое тоже в USD для Steam TopUp)
          if (purchase.quantity !== null && purchase.quantity !== undefined) {
            totalAmount = parseFloat(purchase.quantity);
          } else {
            console.error(`❌ ERROR: Cannot determine USD amount for Steam TopUp purchase ${custom_id}`);
            res.status(500).json({
              status: 'error',
              message: 'Ошибка: не удалось определить сумму заказа в USD'
            });
            return;
          }
        }
        
        // Проверяем, что сумма корректна (больше 0)
        if (isNaN(totalAmount) || totalAmount <= 0) {
          console.error(`❌ ERROR: Invalid totalAmount for purchase ${custom_id}: ${totalAmount}`);
          res.status(500).json({
            status: 'error',
            message: 'Ошибка: некорректная сумма заказа'
          });
          return;
        }
        
        console.log(`💰 Steam TopUp - Purchase data:`, {
          custom_id,
          original_usd_amount: purchase.original_usd_amount,
          quantity: purchase.quantity,
          total_price: purchase.total_price,
          amount: purchase.amount,
          currency: purchase.currency,
          calculated_total_usd: totalAmount,
          user_balance: userBalance,
          user_id: parseInt(user_id)
        });
        
        if (userBalance < totalAmount) {
          res.status(400).json({
            status: 'error',
            message: 'Недостаточно средств на счету!'
          });
          return;
        }

        // Списываем баланс в USD (так как баланс хранится в USD)
        await userService.deductUserBalance(parseInt(user_id), totalAmount);
        const newBalance = await userService.getUserBalance(parseInt(user_id));
        console.log(`💰 Balance deducted: ${totalAmount} USD for user ${user_id}, was: ${userBalance}, now: ${newBalance}`);
      }

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
      
      // Проверяем активный промокод на скидку
      const { promocodeService } = await import('../services/promocode.service');
      const discountPromocode = await promocodeService.getActiveDiscountPromocode(parseInt(user_id));
      
      // Рассчитываем общую сумму
      let totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      let discountAmount = 0;
      
      // Применяем скидку если есть активный промокод
      if (discountPromocode && discountPromocode.value > 0) {
        discountAmount = totalAmount * (discountPromocode.value / 100);
        totalAmount = totalAmount - discountAmount;
      }

      if (userBalance < totalAmount) {
        res.status(400).json({
          status: 'error',
          message: `Недостаточно средств на счету!`
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

      // Если был применен промокод на скидку и хотя бы одна покупка успешна - деактивируем промокод
      const successfulItems = results.filter(item => item.success);
      if (discountPromocode && successfulItems.length > 0) {
        try {
          await promocodeService.deactivateDiscountPromocodeForUser(
            parseInt(user_id),
            discountPromocode.id
          );
          console.log(`🎫 Discount promocode ${discountPromocode.code} deactivated after successful purchase`);
        } catch (error) {
          console.error('Error deactivating discount promocode:', error);
          // Не прерываем выполнение, если не удалось деактивировать промокод
        }
      }

      res.json({
        status: 'success',
        data: {
          results,
          total_processed: results.filter(r => r.success).length,
          total_failed: failedItems.length,
          total_amount: totalAmount,
          original_amount: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          discount_amount: discountAmount,
          discount_percent: discountPromocode ? discountPromocode.value : 0
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

  async getSteamCurrencyRates(req: Request, res: Response): Promise<void> {
    try {
      const token = await giftsApiService.getAuthToken();
      const rates = await giftsApiService.getSteamCurrencyRates(token);
      
      res.json({
        status: 'success',
        data: rates
      });
    } catch (error) {
      console.error('Error fetching Steam currency rates:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch Steam currency rates'
      });
    }
  }
}

export const giftsController = new GiftsController();