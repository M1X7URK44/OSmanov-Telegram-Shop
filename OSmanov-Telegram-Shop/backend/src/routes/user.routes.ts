import { Router } from 'express';
import { userController } from '../controllers/user.controller';

const router = Router();

router.get('/profile/:userId', userController.getProfile.bind(userController));
router.post('/balance/:userId', userController.updateBalance.bind(userController));
router.get('/purchases/:userId', userController.getPurchaseHistory.bind(userController));
router.get('/transactions/:userId', userController.getTransactionHistory.bind(userController));
router.post('/order-info', userController.getOrderInfo.bind(userController));

export const userRoutes = router;