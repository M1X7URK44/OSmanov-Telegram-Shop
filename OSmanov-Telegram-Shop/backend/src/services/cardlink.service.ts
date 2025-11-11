// backend/src/services/cardlink.service.ts
import axios from 'axios';
import * as qs from 'qs';

export interface CardLinkPaymentRequest {
  amount: number;
  shop_id: string;
  order_id: string;
  description?: string;
  payment_type?: string;
  currency_in?: string;
  custom?: string;
  payer_pays_commission?: number;
  name?: string;
  ttl?: number;
  success_url?: string;
  fail_url?: string;
  payment_method?: string;
}

export interface CardLinkPaymentResponse {
  success: boolean;
  link_url?: string;
  link_page_url?: string;
  bill_id?: string;
  error?: string;
}

export interface PaymentStatusResponse {
  success: boolean;
  id?: string;
  bill_id?: string;
  status?: string;
  amount?: number;
  is_paid?: boolean;
  is_failed?: boolean;
  is_processing?: boolean;
  error?: string;
}

export class CardLinkService {
  private apiToken: string;
  private baseUrl: string;

  constructor() {
    this.apiToken = process.env.CARD_LINK_TOKEN || '';
    this.baseUrl = process.env.CARD_LINK_BASE_URL || 'https://cardlink.link/api/v1';
  }

  async createPayment(params: CardLinkPaymentRequest): Promise<CardLinkPaymentResponse> {
    try {
      const url = `${this.baseUrl}/bill/create`;

      // Преобразуем объект в form-urlencoded формат
      const formData = qs.stringify(params);

      console.log('Sending to CardLink:', {
        url,
        data: formData,
        shop_id: params.shop_id,
        amount: params.amount
      });
      
      const response = await axios.post(url, formData, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return response.data;
    } catch (error: any) {
      console.error('CardLink API error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  async checkPaymentStatus(billId: string): Promise<PaymentStatusResponse> {
    try {
      const url = `${this.baseUrl}/bill/status`;
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`
        },
        params: {
          id: billId
        }
      });

      const result = response.data;
      
      // Добавляем удобные флаги статуса
      if (result.success) {
        result.is_paid = result.status === 'SUCCESS';
        result.is_failed = result.status === 'FAIL';
        result.is_processing = ['NEW', 'PROCESS'].includes(result.status);
      }

      return result;
    } catch (error: any) {
      console.error('CardLink API error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  async checkPaymentStatusByPaymentId(paymentId: string): Promise<PaymentStatusResponse> {
    try {
      const url = `${this.baseUrl}/payment/status`;
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`
        },
        params: {
          id: paymentId
        }
      });

      const result = response.data;
      
      // Добавляем удобные флаги статуса
      if (result.success) {
        result.is_paid = result.status === 'SUCCESS';
        result.is_failed = result.status === 'FAIL';
        result.is_processing = ['NEW', 'PROCESS'].includes(result.status);
      }

      return result;
    } catch (error: any) {
      console.error('CardLink API error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }
}

export const cardLinkService = new CardLinkService();