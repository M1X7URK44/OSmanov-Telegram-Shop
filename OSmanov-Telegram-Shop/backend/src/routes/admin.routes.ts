import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticateAdmin, AdminAuthRequest } from '../middleware/adminAuth';

const router = Router();

// Публичные роуты
router.post('/login', adminController.login.bind(adminController));

// Защищенные роуты (требуют авторизации)
router.get('/me', authenticateAdmin, adminController.getMe.bind(adminController));
router.get('/settings', authenticateAdmin, adminController.getSettings.bind(adminController));
router.post('/settings/exchange-rate', authenticateAdmin, adminController.updateExchangeRate.bind(adminController));
router.post('/settings/telegram-prices', authenticateAdmin, adminController.updateTelegramPrices.bind(adminController));
router.post('/settings/premium-prices', authenticateAdmin, adminController.updatePremiumPrices.bind(adminController));
router.get('/statistics', authenticateAdmin, adminController.getStatistics.bind(adminController));
router.get('/users', authenticateAdmin, adminController.getUsers.bind(adminController));
router.post('/users/balance', authenticateAdmin, adminController.updateUserBalance.bind(adminController));
router.get('/user-purchases', authenticateAdmin, adminController.getUserPurchasesAdmin.bind(adminController));
router.get('/payments-by-date', authenticateAdmin, adminController.getPaymentsByDateRange.bind(adminController));
router.post('/logout', authenticateAdmin, adminController.logout.bind(adminController));
// Публичный роут для получения курса
router.get('/settings/public', adminController.getPublicSettings.bind(adminController));

export const adminRoutes = router;