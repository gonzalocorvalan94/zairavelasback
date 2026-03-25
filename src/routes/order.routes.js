import { Router } from 'express';
import * as orderController from '../controllers/order.controller.js';
import verifyToken from '../middlewares/auth.js';
import isAdmin from '../middlewares/isAdmin.js';

const router = Router();

// Webhook de MP — sin JWT
router.post('/webhook', orderController.webhook);

// Rutas autenticadas
router.use(verifyToken);

router.post('/',            orderController.createOrder);
router.get('/my',           orderController.getMy);
router.get('/:id',          orderController.getOne);

// Solo admin
router.get('/',             isAdmin, orderController.getAll);
router.patch('/:id/status', isAdmin, orderController.updateStatus);

export default router;