import { Router } from 'express';
import {
  getAll,
  getOne,
  create,
  update,
  remove,
} from '../controllers/products.controller.js';
import verifyToken from '../middlewares/auth.js';
import isAdmin from '../middlewares/isAdmin.js';
import multer from 'multer';
import { body } from 'express-validator';

const router = Router();

const upload = multer({ storage: multer.memoryStorage() });

const validations = [
  body('name').notEmpty().withMessage('El nombre es requerido'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('El precio debe ser un número positivo'),
  body('stock')
    .isInt({ min: 0 })
    .withMessage('El stock debe ser un número entero positivo'),
];

router.get('/', getAll);
router.get('/:id', getOne);
router.post(
  '/',
  verifyToken,
  isAdmin,
  upload.single('image'),
  validations,
  create
);
router.put(
  '/:id',
  verifyToken,
  isAdmin,
  upload.single('image'),
  validations,
  update
);
router.delete('/:id', verifyToken, isAdmin, remove);

export default router;
