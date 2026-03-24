import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findByEmail, create, findById } from '../models/user.model.js';
import { validationResult } from 'express-validator';
import asyncHandler from '../utils/asyncHandler.js';

const register = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const { name, email, password } = req.body;

  const existing = await findByEmail(email);
  if (existing)
    return res.status(400).json({ message: 'El email ya está registrado' });

  const password_hash = await bcrypt.hash(password, 10);
  const id = await create({ name, email, password_hash });

  const user = await findById(id);
  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.status(201).json({ token, user });
});

const login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;

  const user = await findByEmail(email);
  if (!user) return res.status(401).json({ message: 'Credenciales inválidas' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid)
    return res.status(401).json({ message: 'Credenciales inválidas' });

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  const { password_hash, ...userSafe } = user;
  res.json({ token, user: userSafe });
});

const me = asyncHandler(async (req, res) => {
  const user = await findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
  res.json({ user });
});

export { register, login, me };
