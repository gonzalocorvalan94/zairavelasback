import { Router } from 'express';
import {
  getAll,
  getOne,
  create,
  update,
  remove,
} from '../controllers/categories.controller.js';
import verifyToken from '../middlewares/auth.js';
import isAdmin from '../middlewares/isAdmin.js';
import { body } from 'express-validator';

const router = Router();

const validations = [
  body('name').notEmpty().withMessage('El nombre es requerido'),
  body('slug')
    .notEmpty()
    .withMessage('El slug es requerido')
    .matches(/^[a-z0-9-]+$/)
    .withMessage(
      'El slug solo puede tener letras minúsculas, números y guiones'
    ),
];

router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', verifyToken, isAdmin, validations, create);
router.put('/:id', verifyToken, isAdmin, validations, update);
router.delete('/:id', verifyToken, isAdmin, remove);

export default router;
