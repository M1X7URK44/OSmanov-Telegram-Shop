import { Router } from 'express';
import { giftsController } from '../controllers/gifts.controller';

const router = Router();

router.get('/categories', giftsController.getCategories.bind(giftsController));
router.get('/services', giftsController.getAllServices.bind(giftsController));
router.get('/token', giftsController.getAuthToken.bind(giftsController));
router.get('/services/by-category', giftsController.getServicesByCategory.bind(giftsController));

export const giftsRoutes = router;