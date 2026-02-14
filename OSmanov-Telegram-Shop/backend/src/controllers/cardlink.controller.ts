// backend/src/controllers/cardlink.controller.ts
import { Request, Response } from 'express';
import { cardLinkService } from '../services/cardlink.service';
import { userService } from '../services/user.service';
import { CardLinkCreatePaymentRequest, CardLinkWebhookPayload } from '../types/cardlink.types';

export class CardLinkController {
  async createPayment(req: Request, res: Response): Promise<void> {
    try {
      const { amount, order_id, description, user_id, success_url, fail_url, payer_pays_commission }: CardLinkCreatePaymentRequest = req.body;

      if (!amount || amount <= 0) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid amount'
        });
        return;
      }

      if (!order_id) {
        res.status(400).json({
          status: 'error',
          message: 'Order ID is required'
        });
        return;
      }

      const paymentParams = {
        amount,
        shop_id: process.env.CARD_LINK_SHOP_ID || '',
        order_id,
        description: description || `Пополнение баланса на ${amount} ₽`,
        payment_type: 'normal',
        currency_in: 'RUB',
        custom: `user_${user_id}`,
        payer_pays_commission: payer_pays_commission !== undefined ? payer_pays_commission : 1, // По умолчанию 1, если не указано
        name: 'Пополнение баланса',
        ttl: 3600, // 1 час
        success_url: `${process.env.FRONTEND_URL}`,
        fail_url: `${process.env.FRONTEND_URL}`,
        payment_method: 'SBP'
      };

      const paymentResult = await cardLinkService.createPayment(paymentParams);

      if (paymentResult.success) {
        res.json({
          status: 'success',
          data: paymentResult
        });
      } else {
        res.status(400).json({
          status: 'error',
          message: paymentResult.error || 'Failed to create payment'
        });
      }
    } catch (error) {
      console.error('Error creating CardLink payment:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to create payment'
      });
    }
  }

  async checkPaymentStatus(req: Request, res: Response): Promise<void> {
    try {
      const { bill_id } = req.query;

      if (!bill_id) {
        res.status(400).json({
          status: 'error',
          message: 'Bill ID is required'
        });
        return;
      }

      const status = await cardLinkService.checkPaymentStatus(bill_id as string);

      if (status.success) {
        res.json({
          status: 'success',
          data: status
        });
      } else {
        res.status(400).json({
          status: 'error',
          message: status.error || 'Failed to check payment status'
        });
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to check payment status'
      });
    }
  }

  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const payload: CardLinkWebhookPayload = req.body;
      
      console.log('CardLink webhook received:', payload);

      // Валидация подписи (реализуйте по необходимости)
      // if (!this.verifySignature(payload)) {
      //   res.status(400).send('Invalid signature');
      //   return;
      // }

      if (payload.Status === 'SUCCESS') {
        // Извлекаем ID пользователя из custom поля
        const userIdMatch = payload.custom?.match(/user_(\d+)/);
        if (userIdMatch) {
          const userId = parseInt(userIdMatch[1]);
          const amount = parseFloat(payload.OutSum);
          
          // Обновляем баланс пользователя
          await userService.updateUserBalance(userId, amount);
          
          // Логируем успешный платеж
          console.log(`Payment webhook: User ${userId}, Amount: ${amount}, Payment ID: ${payload.TrsId}`);
        }
      }

      // Всегда отвечаем 200 OK на webhook
      res.status(200).send('OK');
    } catch (error) {
      console.error('Error processing CardLink webhook:', error);
      res.status(500).send('Error');
    }
  }

  // Вспомогательный метод для верификации подписи
  private verifySignature(payload: CardLinkWebhookPayload): boolean {
    // TODO: Реализовать верификацию подписи согласно документации CardLink
    // strtoupper(md5($OutSum . ":" . $InvId . ":" . $apiToken))
    return true; // Временно возвращаем true для тестирования
  }
}

export const cardLinkController = new CardLinkController();