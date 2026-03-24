import asyncHandler from '../utils/asyncHandler.js';
import * as Product from '../models/product.model.js';
import cloudinary from '../config/cloudinary.js';

const getAll = asyncHandler(async (req, res) => {
  const { category_id, active } = req.query;
  const filters = {};
  if (category_id) filters.category_id = category_id;
  if (active !== undefined) filters.active = active === 'true';

  const products = await Product.getAll(filters);
  res.json({ products });
});

const getOne = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product)
    return res.status(404).json({ message: 'Producto no encontrado' });
  res.json({ product });
});

const create = asyncHandler(async (req, res) => {
  const { category_id, name, description, price, stock } = req.body;

  let image_url = null;
  if (req.file) {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'ecommerce/products',
    });
    image_url = result.secure_url;
  }

  const id = await Product.create({
    category_id,
    name,
    description,
    price,
    stock,
    image_url,
  });
  const product = await Product.findById(id);
  res.status(201).json({ product });
});

const update = asyncHandler(async (req, res) => {
  const { category_id, name, description, price, stock, active } = req.body;

  const existing = await Product.findById(req.params.id);
  if (!existing)
    return res.status(404).json({ message: 'Producto no encontrado' });

  let image_url = existing.image_url;
  if (req.file) {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'ecommerce/products',
    });
    image_url = result.secure_url;
  }

  await Product.update(req.params.id, {
    category_id,
    name,
    description,
    price,
    stock,
    image_url,
    active,
  });
  const product = await Product.findById(req.params.id);
  res.json({ product });
});

const remove = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product)
    return res.status(404).json({ message: 'Producto no encontrado' });

  await Product.remove(req.params.id);
  res.json({ message: 'Producto eliminado' });
});

export { getAll, getOne, create, update, remove };
