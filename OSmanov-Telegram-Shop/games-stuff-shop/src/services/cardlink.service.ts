// frontend/src/services/cardlink.service.ts
import { userApi } from '../api/user.api';

// const API_BASE_URL = 'http://localhost:5000/api';
const API_BASE_URL = '/api';

export interface CardLinkPaymentResponse {
  success: boolean;
  link_url?: string;
  link_page_url?: string;
  bill_id?: string;
  error?: string;
}

export interface PaymentStatusResponse {
  success: boolean;
  is_paid?: boolean;
  is_failed?: boolean;
  is_processing?: boolean;
  status?: string;
  error?: string;
}

class CardLinkService {
  async createPayment(
    amount: number,
    orderId: string,
    description: string,
    userId: number
  ): Promise<CardLinkPaymentResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/cardlink/create-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          order_id: orderId,
          description,
          user_id: userId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        return result.data;
      } else {
        return {
          success: false,
          error: result.message
        };
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      return {
        success: false,
        error: 'Failed to create payment'
      };
    }
  }

  async checkPaymentStatus(billId: string): Promise<PaymentStatusResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/cardlink/check-status?bill_id=${billId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        return result.data;
      } else {
        return {
          success: false,
          error: result.message
        };
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      return {
        success: false,
        error: 'Failed to check payment status'
      };
    }
  }

  async verifyPaymentAndUpdateBalance(billId: string, userId: number, amount: number): Promise<boolean> {
    try {
      const status = await this.checkPaymentStatus(billId);
      
      if (status.success && status.is_paid) {
        // Обновляем баланс через ваш существующий API
        const balanceUpdate = {
          amount: amount,
          payment_method: 'cardlink',
        };

        await userApi.updateBalance(userId, balanceUpdate);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error verifying payment:', error);
      return false;
    }
  }
}

export const cardLinkService = new CardLinkService();