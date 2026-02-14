import { Router } from 'express';
import { promocodeController } from '../controllers/promocode.controller';
import { authenticateAdmin } from '../middleware/adminAuth';

const router = Router();

// Тестовый роут для проверки работы
router.get('/test', (req, res) => {
  console.log('✅ GET /api/promocodes/test - Route is working!');
  res.json({ status: 'success', message: 'Promocode routes are working!' });
});

// Публичные роуты (для пользователей) - должны быть ПЕРЕД параметризованными роутами
router.post('/activate', promocodeController.activatePromocode.bind(promocodeController));
router.get('/discount/:userId', promocodeController.getActiveDiscountPromocode.bind(promocodeController));

// Защищенные роуты (для админ-панели)
// ВАЖНО: роут '/' должен быть ПЕРЕД параметризованными роутами типа '/:id'
// Обрабатываем оба варианта: с и без завершающего слэша
router.get('/', authenticateAdmin, (req, res, next) => {
  console.log('✅ GET /api/promocodes - Route matched!');
  next();
}, promocodeController.getAllPromocodes.bind(promocodeController));
router.post('/', authenticateAdmin, (req, res, next) => {
  console.log('✅ POST /api/promocodes - Route matched!');
  next();
}, promocodeController.createPromocode.bind(promocodeController));

// Параметризованные роуты должны быть ПОСЛЕ конкретных роутов
router.get('/:id', authenticateAdmin, promocodeController.getPromocodeById.bind(promocodeController));
router.put('/:id', authenticateAdmin, promocodeController.updatePromocode.bind(promocodeController));
router.delete('/:id', authenticateAdmin, promocodeController.deletePromocode.bind(promocodeController));

export const promocodeRoutes = router;
