/**
 * Сервис отправки email через Nodemailer
 * Для домена os-gift.store
 */

import nodemailer from 'nodemailer';

export interface EmailSendResult {
  success: boolean;
  message?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      console.warn('SMTP configuration incomplete. Email sending will not work.');
      console.warn('Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env');
      return;
    }

    // Для порта 587 используется STARTTLS, поэтому secure должен быть false
    // nodemailer автоматически использует STARTTLS для порта 587 когда secure=false
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: false, // false для STARTTLS на порту 587
      requireTLS: true, // Требуем использование STARTTLS
      auth: {
        user,
        pass,
      },
      tls: {
        // Не отклоняем самоподписанные сертификаты (может быть нужно для некоторых SMTP серверов)
        rejectUnauthorized: false,
      },
    });
  }

  /**
   * Отправка кода верификации на email
   */
  async sendVerificationCode(to: string, code: string): Promise<EmailSendResult> {
    if (!this.transporter) {
      return {
        success: false,
        message: 'Email service not configured',
      };
    }

    const fromEmail = process.env.SMTP_FROM || ``;
    const siteName = process.env.SITE_NAME || 'OS Gift Store';

    try {
      await this.transporter.sendMail({
        from: `"${siteName}" <${fromEmail}>`,
        to,
        subject: `Код подтверждения - ${siteName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #1a1a2e;">Код подтверждения</h2>
            <p>Здравствуйте!</p>
            <p>Ваш код для входа в ${siteName}:</p>
            <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #88FB47; background: #1a1a2e; padding: 12px; border-radius: 8px; text-align: center;">${code}</p>
            <p>Код действителен в течение 10 минут.</p>
            <p>Если вы не запрашивали этот код, проигнорируйте это письмо.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #888; font-size: 12px;">${siteName} - ${process.env.SITE_URL || 'https://os-gift.store'}</p>
          </div>
        `,
        text: `Ваш код для входа в ${siteName}: ${code}. Код действителен 10 минут.`,
      });

      return { success: true };
    } catch (error) {
      console.error('Email send error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Ошибка отправки email',
      };
    }
  }
}

export const emailService = new EmailService();
