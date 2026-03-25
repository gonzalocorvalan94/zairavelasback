import asyncHandler from '../utils/asyncHandler.js';
import * as Order from '../models/order.model.js';
import * as Product from '../models/product.model.js';
import mpClient from '../config/mercadopago.js';
import { Preference, Payment } from 'mercadopago';

const VALID_TRANSITIONS = {
  pending:    ['processing', 'cancelled'],
  processing: ['received',   'cancelled'],
  received:   [],
  cancelled:  [],
};

const SHIPPING_FIELDS = ['phone', 'address_street', 'address_city', 'address_province', 'address_zip'];

// ── POST /orders ────────────────────────────────────────────────────────────
export const createOrder = asyncHandler(async (req, res) => {
  const { items, shipping } = req.body;

  if (!items?.length) {
    return res.status(400).json({ message: 'El carrito está vacío' });
  }

  // Validar campos de envío
  const missingFields = SHIPPING_FIELDS.filter((f) => !shipping?.[f]);
  if (missingFields.length) {
    return res.status(400).json({
      message: `Faltan datos de envío: ${missingFields.join(', ')}`,
    });
  }

  // Validar productos y armar snapshot
  const enrichedItems = [];
  let total = 0;

  for (const item of items) {
    const product = await Product.findById(item.product_id);

    if (!product) {
      return res.status(404).json({ message: `Producto ${item.product_id} no encontrado` });
    }
    if (!product.active) {
      return res.status(400).json({ message: `"${product.name}" no está disponible` });
    }
    if (product.stock < item.quantity) {
      return res.status(400).json({ message: `Stock insuficiente para "${product.name}"` });
    }

    const price = parseFloat(product.price);
    enrichedItems.push({
      product_id: product.id,
      name:       product.name,
      price,
      quantity:   item.quantity,
      image_url:  product.image_url,
    });
    total += price * item.quantity;
  }

  total = parseFloat(total.toFixed(2));

  // Crear orden en DB
  const orderId = await Order.create({
    user_id:  req.user.id,
    total,
    items:    enrichedItems,
    shipping, // phone + address_*
  });

  // Crear preferencia en Mercado Pago
  const preference = new Preference(mpClient);

  const mpResponse = await preference.create({
    body: {
      items: enrichedItems.map((item) => ({
        id:          String(item.product_id),
        title:       item.name,
        unit_price:  item.price,
        quantity:    item.quantity,
        currency_id: 'ARS',
        ...(item.image_url && { picture_url: item.image_url }),
      })),
      external_reference: String(orderId),
      back_urls: {
        success: `${process.env.FRONTEND_URL}/orders/success`,
        failure: `${process.env.FRONTEND_URL}/orders/failure`,
        pending: `${process.env.FRONTEND_URL}/orders/pending`,
      },
      auto_return: 'approved',
      notification_url: `${process.env.BACKEND_URL}/orders/webhook`,
    },
  });

  await Order.setMpData(orderId, { preference_id: mpResponse.id });

  const order = await Order.findById(orderId);
  res.status(201).json({ order, init_point: mpResponse.init_point });
});

// ── POST /orders/webhook ─────────────────────────────────────────────────────
export const webhook = asyncHandler(async (req, res) => {
  const { type, data } = req.body;

  if (type !== 'payment') return res.sendStatus(200);

  const paymentClient = new Payment(mpClient);
  const payment = await paymentClient.get({ id: data.id });

  const order = await Order.findById(payment.external_reference);
  if (!order) return res.sendStatus(200);

  let newStatus = null;
  if (payment.status === 'approved')                              newStatus = 'processing';
  if (payment.status === 'rejected' || payment.status === 'cancelled') newStatus = 'cancelled';

  if (newStatus && VALID_TRANSITIONS[order.status]?.includes(newStatus)) {
    await Order.updateStatus(order.id, newStatus);
    await Order.setMpData(order.id, { payment_id: String(payment.id) });
  }

  res.sendStatus(200);
});

// ── PATCH /orders/:id/status  (admin) ────────────────────────────────────────
export const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) return res.status(404).json({ message: 'Orden no encontrada' });

  const allowed = VALID_TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(status)) {
    return res.status(400).json({
      message: `Transición inválida: "${order.status}" → "${status}"`,
    });
  }

  await Order.updateStatus(order.id, status);
  const updated = await Order.findById(order.id);
  res.json({ order: updated });
});

// ── GET /orders  (admin) ─────────────────────────────────────────────────────
export const getAll = asyncHandler(async (req, res) => {
  const orders = await Order.getAll();
  res.json({ orders });
});

// ── GET /orders/my ───────────────────────────────────────────────────────────
export const getMy = asyncHandler(async (req, res) => {
  const orders = await Order.findByUser(req.user.id);
  res.json({ orders });
});

// ── GET /orders/:id ──────────────────────────────────────────────────────────
export const getOne = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Orden no encontrada' });

  if (!req.user.is_admin && order.user_id !== req.user.id) {
    return res.status(403).json({ message: 'Acceso denegado' });
  }

  res.json({ order });
});