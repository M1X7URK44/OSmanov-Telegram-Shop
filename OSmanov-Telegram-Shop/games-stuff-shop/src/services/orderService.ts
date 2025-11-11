import type { CartItem } from '../context/CartContext';

export interface CreateOrderRequest {
  service_id: number;
  quantity: number;
  data?: string;
  user_id: number;
  service_name: string;
  price: number;
}

export interface CreateOrderResponse {
  custom_id: string;
  status: number;
  service_id: number;
  quantity: number;
  total: number;
  date: string;
  service_name: string;
  user_id: number;
}

export interface PayOrderRequest {
  custom_id: string;
  user_id: number;
}

export interface PayOrderResponse {
  message: string;
  custom_id: string;
  status: number;
}

export interface OrderInfoRequest {
  custom_id: string;
}

export interface OrderInfoResponse {
  custom_id: string;
  status: number;
  status_message: string;
  product: string;
  quantity: number;
  total_price: number;
  data?: string;
  pins?: string[];
}

export interface CheckoutRequest {
  user_id: number;
  items: CartItem[];
}

export interface CheckoutItemResult {
  success: boolean;
  custom_id: string;
  service_id: number;
  service_name: string;
  status: number;
  status_message: string;
  pins?: string[];
  data?: string;
  error?: string;
}

export interface CheckoutResponse {
  status: string;
  data: {
    results: CheckoutItemResult[];
    total_processed: number;
    total_failed: number;
    total_amount: number;
  };
  message?: string;
}

// Типы для ответов API
interface ApiResponse<T> {
  status: string;
  data?: T;
  message?: string;
}

class OrderService {
  private baseUrl = 'http://localhost:5000/api';

  private async handleApiRequest<T>(
    url: string, 
    options: RequestInit
  ): Promise<T> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const result: ApiResponse<T> = await response.json();
      
      if (result.status !== 'success') {
        throw new Error(result.message || 'API request failed');
      }

      return result.data as T;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred');
    }
  }

  async createOrder(orderData: CreateOrderRequest): Promise<CreateOrderResponse> {
    return this.handleApiRequest<CreateOrderResponse>(
      `${this.baseUrl}/gifts/create-order`,
      {
        method: 'POST',
        body: JSON.stringify(orderData),
      }
    );
  }

  async payOrder(payData: PayOrderRequest): Promise<PayOrderResponse> {
    return this.handleApiRequest<PayOrderResponse>(
      `${this.baseUrl}/gifts/pay-order`,
      {
        method: 'POST',
        body: JSON.stringify(payData),
      }
    );
  }

  async getOrderInfo(custom_id: string): Promise<OrderInfoResponse> {
    return this.handleApiRequest<OrderInfoResponse>(
      `${this.baseUrl}/gifts/order-info`,
      {
        method: 'POST',
        body: JSON.stringify({ custom_id }),
      }
    );
  }

  async checkout(checkoutData: CheckoutRequest): Promise<CheckoutResponse> {
    return this.handleApiRequest<CheckoutResponse>(
      `${this.baseUrl}/gifts/checkout`,
      {
        method: 'POST',
        body: JSON.stringify(checkoutData),
      }
    );
  }

  // Вспомогательные методы для массовых операций
  async createAndPayOrder(orderData: CreateOrderRequest): Promise<{
    createResponse: CreateOrderResponse;
    payResponse: PayOrderResponse;
    orderInfo: OrderInfoResponse;
  }> {
    try {
      // Создаем заказ
      const createResponse = await this.createOrder(orderData);
      
      // Оплачиваем заказ
      const payResponse = await this.payOrder({
        custom_id: createResponse.custom_id,
        user_id: orderData.user_id,
      });
      
      // Получаем информацию о заказе
      const orderInfo = await this.getOrderInfo(createResponse.custom_id);
      
      return {
        createResponse,
        payResponse,
        orderInfo,
      };
    } catch (error) {
      throw new Error(`Failed to create and pay order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async checkMultipleOrdersStatus(customIds: string[]): Promise<OrderInfoResponse[]> {
    const promises = customIds.map(async (customId) => {
      try {
        return await this.getOrderInfo(customId);
      } catch (error) {
        console.error(`Failed to get info for order ${customId}:`, error);
        return null;
      }
    });

    const results = await Promise.all(promises);
    return results.filter((result): result is OrderInfoResponse => result !== null);
  }

  // Метод для проверки готовности заказа с повторными попытками
  async waitForOrderCompletion(
    customId: string, 
    maxAttempts: number = 10, 
    delay: number = 2000
  ): Promise<OrderInfoResponse> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const orderInfo = await this.getOrderInfo(customId);
        
        // Статус 2 означает завершенный заказ
        if (orderInfo.status === 2) {
          return orderInfo;
        }
        
        // Статус 3 означает ошибку
        if (orderInfo.status === 3) {
          throw new Error(`Order failed: ${orderInfo.status_message}`);
        }
        
        // Если заказ еще в обработке, ждем и пробуем снова
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error) {
        if (attempt === maxAttempts) {
          throw new Error(`Failed to complete order after ${maxAttempts} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }
    
    throw new Error(`Order timed out after ${maxAttempts} attempts`);
  }

  // Валидация данных перед созданием заказа
  validateOrderData(orderData: CreateOrderRequest): string | null {
    if (!orderData.service_id || orderData.service_id <= 0) {
      return 'Invalid service ID';
    }
    
    if (!orderData.quantity || orderData.quantity <= 0) {
      return 'Invalid quantity';
    }
    
    if (!orderData.user_id || orderData.user_id <= 0) {
      return 'Invalid user ID';
    }
    
    if (!orderData.service_name?.trim()) {
      return 'Service name is required';
    }
    
    if (!orderData.price || orderData.price <= 0) {
      return 'Invalid price';
    }
    
    return null;
  }

  // Валидация корзины перед оформлением заказа
  validateCartForCheckout(items: CartItem[]): string | null {
    if (!items || items.length === 0) {
      return 'Cart is empty';
    }

    const missingDataItems = items.filter(item => 
      this.requiresUserData(item.service_name) && (!item.userData || !item.userData.trim())
    );

    if (missingDataItems.length > 0) {
      const itemNames = missingDataItems.map(item => item.service_name).join(', ');
      return `Please provide required data for: ${itemNames}`;
    }

    const invalidItems = items.filter(item => !item.price || item.price <= 0);
    if (invalidItems.length > 0) {
      return 'Some items have invalid prices';
    }

    return null;
  }

  // Преобразование CartItem в CheckoutRequest items
  prepareCheckoutItems(items: CartItem[]): Array<{
    service_id: number;
    service_name: string;
    price: number;
    currency: string;
    quantity: number;
    data?: string;
  }> {
    return items.map(item => ({
      service_id: item.service_id,
      service_name: item.service_name,
      price: item.price || 0,
      currency: item.currency || 'USD',
      quantity: item.quantity,
      data: item.userData || undefined,
    }));
  }

  // Проверка необходимости данных пользователя
  requiresUserData(serviceName: string): boolean {
    const lowerName = serviceName.toLowerCase();
    return lowerName.includes('steam') || 
           lowerName.includes('account') || 
           lowerName.includes('login') ||
           lowerName.includes('аккаунт') ||
           lowerName.includes('логин');
  }

  // Получение статуса заказа в читаемом формате
  getOrderStatusText(status: number): string {
    switch (status) {
      case 1: return 'Pending';
      case 2: return 'Completed';
      case 3: return 'Failed';
      default: return 'Unknown';
    }
  }

  // Получение цвета для статуса заказа
  getOrderStatusColor(status: number): string {
    switch (status) {
      case 2: return '#88FB47'; // Green for completed
      case 3: return '#ff3b3b'; // Red for failed
      case 1: return '#F89D09'; // Orange for pending
      default: return '#737591'; // Gray for unknown
    }
  }

  // Расчет общей суммы заказа
  calculateOrderTotal(items: CartItem[]): number {
    return items.reduce((total, item) => {
      const price = item.price || 0;
      return total + (price * item.quantity);
    }, 0);
  }


  async getOrderInfoByCustomId(custom_id: string): Promise<OrderInfoResponse> {
    const response = await fetch(`${this.baseUrl}/gifts/order-info-by-custom-id`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ custom_id }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get order info: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }
}

export const orderService = new OrderService();