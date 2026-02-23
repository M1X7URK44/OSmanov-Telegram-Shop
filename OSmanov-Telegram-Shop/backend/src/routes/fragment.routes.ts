// backend/src/routes/fragment.routes.ts
import { Router } from 'express';
import { fragmentController } from '../controllers/fragment.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/stars', authenticateToken, fragmentController.createStarsOrder.bind(fragmentController));
router.post('/premium', authenticateToken, fragmentController.createPremiumOrder.bind(fragmentController));

export const fragmentRoutes = router;
