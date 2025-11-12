import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/telegram-login', authController.telegramLogin.bind(authController));
router.get('/me', authenticateToken, authController.getMe.bind(authController));

export const authRoutes = router;