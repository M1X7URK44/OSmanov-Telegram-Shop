// backend/src/routes/cardlink.routes.ts
import { Router } from 'express';
import { cardLinkController } from '../controllers/cardlink.controller';

const router = Router();

router.post('/create-payment', cardLinkController.createPayment.bind(cardLinkController));
router.get('/check-status', cardLinkController.checkPaymentStatus.bind(cardLinkController));
router.post('/webhook', cardLinkController.handleWebhook.bind(cardLinkController));

export const cardLinkRoutes = router;