import { Router } from 'express';
import { giftsController } from '../controllers/gifts.controller';

const router = Router();

router.get('/categories', giftsController.getCategories.bind(giftsController));
router.get('/services', giftsController.getAllServices.bind(giftsController));
router.get('/token', giftsController.getAuthToken.bind(giftsController));
router.get('/services/by-category', giftsController.getServicesByCategory.bind(giftsController));

router.post('/order-info', giftsController.getOrderInfo.bind(giftsController));
router.post('/orders-info', giftsController.getMultipleOrdersInfo.bind(giftsController));

router.post('/create-order', giftsController.createOrder.bind(giftsController));
router.post('/pay-order', giftsController.payOrder.bind(giftsController));
router.post('/checkout', giftsController.checkout.bind(giftsController));

router.post('/order-info-by-custom-id', giftsController.getOrderInfoByCustomId.bind(giftsController));

export const giftsRoutes = router;