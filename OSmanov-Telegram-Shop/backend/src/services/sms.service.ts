/**
 * Сервис отправки SMS через SMS.ru
 * Документация: https://sms.ru/api/send
 */

const SMS_RU_API_URL = 'https://sms.ru/sms/send';

export interface SmsSendResult {
  success: boolean;
  message?: string;
  smsId?: string;
}

export class SmsService {
  private apiId: string;

  constructor() {
    this.apiId = process.env.SMS_RU_API_ID || 'A1801C43-B1F3-76FA-191B-A5F6F72A5741';
  }

  /**
   * Отправка SMS через SMS.ru
   * @param phone - Номер телефона в формате 79255070602
   * @param message - Текст сообщения
   * @param userIp - IP пользователя для защиты от флуда (рекомендуется SMS.ru)
   */
  async sendSms(phone: string, message: string, userIp?: string): Promise<SmsSendResult> {
    try {
      const normalizedPhone = this.normalizePhone(phone);
      if (!normalizedPhone) {
        return { success: false, message: 'Неверный формат номера телефона' };
      }

      const params = new URLSearchParams({
        api_id: this.apiId,
        to: normalizedPhone,
        msg: message,
        json: '1',
      });

      if (userIp) {
        params.append('ip', userIp);
      }

      const response = await fetch(`${SMS_RU_API_URL}?${params.toString()}`, {
        method: 'GET',
      });

      const data = (await response.json()) as {
        status?: string;
        status_code?: number;
        status_text?: string;
        sms?: Record<string, { status?: string; sms_id?: string; status_text?: string }>;
      };

      if (data.status === 'OK' && data.status_code === 100) {
        const smsData = data.sms?.[normalizedPhone];
        if (smsData?.status === 'OK') {
          return {
            success: true,
            smsId: smsData.sms_id,
          };
        }
        return {
          success: false,
          message: smsData?.status_text || 'Ошибка отправки SMS',
        };
      }

      return {
        success: false,
        message: data.status_text || 'Ошибка отправки SMS',
      };
    } catch (error) {
      console.error('SMS send error:', error);
      return {
        success: false,
        message: 'Ошибка при отправке SMS',
      };
    }
  }

  /**
   * Нормализация номера телефона к формату 79XXXXXXXXX
   */
  private normalizePhone(phone: string): string | null {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10 && digits.startsWith('9')) {
      return '7' + digits;
    }
    if (digits.length === 11 && digits.startsWith('7')) {
      return digits;
    }
    if (digits.length === 11 && digits.startsWith('8')) {
      return '7' + digits.slice(1);
    }
    return null;
  }

  /** Нормализованный номер для хранения в БД (формат 79XXXXXXXXX) */
  normalizePhoneForStorage(phone: string): string | null {
    return this.normalizePhone(phone);
  }
}

export const smsService = new SmsService();
