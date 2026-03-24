import asyncHandler from '../utils/asyncHandler.js';
import * as Category from '../models/category.model.js';

const getAll = asyncHandler(async (req, res) => {
  const categories = await Category.getAll();
  res.json({ categories });
});

const getOne = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) return res.status(404).json({ message: 'Categoría no encontrada' });
  res.json({ category });
});

const create = asyncHandler(async (req, res) => {
  const { name, slug } = req.body;

  const existing = await Category.findBySlug(slug);
  if (existing) return res.status(400).json({ message: 'El slug ya está en uso' });

  const id = await Category.create({ name, slug });
  const category = await Category.findById(id);
  res.status(201).json({ category });
});

const update = asyncHandler(async (req, res) => {
  const { name, slug } = req.body;

  const category = await Category.findById(req.params.id);
  if (!category) return res.status(404).json({ message: 'Categoría no encontrada' });

  const existing = await Category.findBySlug(slug);
  if (existing && existing.id !== parseInt(req.params.id)) {
    return res.status(400).json({ message: 'El slug ya está en uso' });
  }

  await Category.update(req.params.id, { name, slug });
  const updated = await Category.findById(req.params.id);
  res.json({ category: updated });
});

const remove = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) return res.status(404).json({ message: 'Categoría no encontrada' });

  await Category.remove(req.params.id);
  res.json({ message: 'Categoría eliminada' });
});

export { getAll, getOne, create, update, remove };