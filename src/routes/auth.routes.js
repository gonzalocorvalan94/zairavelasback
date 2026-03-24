import { Router } from 'express';
import { register, login, me } from '../controllers/auth.controller.js';
import verifyToken from '../middlewares/auth.js';
import { body } from 'express-validator';

const router = Router();

const registerValidations = [
  body('name').notEmpty().withMessage('El nombre es requerido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
];

const loginValidations = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('La contraseña es requerida'),
];

router.post('/register', registerValidations, register);
router.post('/login', loginValidations, login);
router.get('/me', verifyToken, me);

export default router;
