import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/telegram-login', authController.telegramLogin.bind(authController));
router.get('/me', authenticateToken, authController.getMe.bind(authController));

// Веб-авторизация (телефон/email)
router.post('/send-phone-code', authController.sendPhoneCode.bind(authController));
router.post('/send-email-code', authController.sendEmailCode.bind(authController));
router.post('/web-login', authController.webLogin.bind(authController));

export const authRoutes = router;