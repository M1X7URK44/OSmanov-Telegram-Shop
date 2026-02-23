/**
 * Сервис управления кодами верификации

 */

import { query } from '../database/db';
import { smsService } from './sms.service';
import { emailService } from './email.service';

const CODE_EXPIRY_MINUTES = 10;

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export class VerificationService {
  /**
   * Создать и отправить код на телефон
   */
  async sendPhoneCode(phone: string, userIp?: string): Promise<{ success: boolean; message?: string }> {
    const normalizedPhone = smsService.normalizePhoneForStorage(phone);
    if (!normalizedPhone) {
      return { success: false, message: 'Неверный формат номера телефона' };
    }

    const code = generateCode();

    try {
      await query(
        `INSERT INTO verification_codes (identifier, code, type, expires_at) 
         VALUES ($1, $2, 'phone', NOW() + INTERVAL '${CODE_EXPIRY_MINUTES} minutes')`,
        [normalizedPhone, code]
      );

      const result = await smsService.sendSms(
        normalizedPhone,
        `Ваш код для входа в OS Gift Store: ${code}. Код действителен ${CODE_EXPIRY_MINUTES} мин.`,
        userIp
      );

      if (!result.success) {
        await query('DELETE FROM verification_codes WHERE identifier = $1 AND code = $2 AND type = $3', [
          normalizedPhone,
          code,
          'phone',
        ]);
        return result;
      }

      return { success: true };
    } catch (error) {
      console.error('Send phone code error:', error);
      return {
        success: false,
        message: 'Ошибка при отправке кода',
      };
    }
  }

  /**
   * Создать и отправить код на email
   */
  async sendEmailCode(email: string): Promise<{ success: boolean; message?: string }> {
    const code = generateCode();

    try {
      await query(
        `INSERT INTO verification_codes (identifier, code, type, expires_at) 
         VALUES ($1, $2, 'email', NOW() + INTERVAL '${CODE_EXPIRY_MINUTES} minutes')`,
        [email.toLowerCase(), code]
      );

      const result = await emailService.sendVerificationCode(email, code);

      if (!result.success) {
        await query('DELETE FROM verification_codes WHERE identifier = $1 AND code = $2 AND type = $3', [
          email.toLowerCase(),
          code,
          'email',
        ]);
        return result;
      }

      return { success: true };
    } catch (error) {
      console.error('Send email code error:', error);
      return {
        success: false,
        message: 'Ошибка при отправке кода',
      };
    }
  }

  /**
   * Проверить код верификации
   */
  async verifyCode(
    identifier: string,
    code: string,
    type: 'phone' | 'email'
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const normalizedIdentifier =
        type === 'email' ? identifier.toLowerCase() : smsService.normalizePhoneForStorage(identifier) || identifier;
      const result = await query(
        `SELECT id FROM verification_codes 
         WHERE identifier = $1 AND code = $2 AND type = $3 AND expires_at > NOW()`,
        [normalizedIdentifier, code, type]
      );

      if (result.rows.length === 0) {
        return { success: false, message: 'Неверный или истёкший код' };
      }

      await query('DELETE FROM verification_codes WHERE id = $1', [result.rows[0].id]);
      return { success: true };
    } catch (error) {
      console.error('Verify code error:', error);
      return {
        success: false,
        message: 'Ошибка проверки кода',
      };
    }
  }
}

export const verificationService = new VerificationService();
