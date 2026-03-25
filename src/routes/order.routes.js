import { Router } from 'express';
import * as orderController from '../controllers/order.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/admin.middleware.js';

const router = Router();

// Webhook de MP — sin JWT (MP no manda token)
router.post('/webhook', orderController.webhook);

// Rutas autenticadas
router.use(authenticate);

router.post('/',           orderController.createOrder);
router.get('/my',          orderController.getMy);
router.get('/:id',         orderController.getOne);

// Solo admin
router.get('/',            requireAdmin, orderController.getAll);
router.patch('/:id/status', requireAdmin, orderController.updateStatus);

export default router;