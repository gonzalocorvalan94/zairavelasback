import pool from '../config/db.js';

export const create = async ({ user_id, total, items, shipping }) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [orderResult] = await conn.execute(
      `INSERT INTO orders 
         (user_id, total, phone, address_street, address_city, address_province, address_zip)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        total,
        shipping.phone,
        shipping.address_street,
        shipping.address_city,
        shipping.address_province,
        shipping.address_zip,
      ]
    );
    const orderId = orderResult.insertId;

    for (const item of items) {
      await conn.execute(
        `INSERT INTO order_items (order_id, product_id, name, unit_price, quantity, image_url)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.name, item.price, item.quantity, item.image_url ?? null]
      );
    }

    await conn.commit();
    return orderId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const findById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT o.*,
       JSON_ARRAYAGG(
         JSON_OBJECT(
           'id',         oi.id,
           'product_id', oi.product_id,
           'name',       oi.name,
           'unit_price', oi.unit_price,
           'quantity',   oi.quantity,
           'image_url',  oi.image_url
         )
       ) AS items
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     WHERE o.id = ?
     GROUP BY o.id`,
    [id]
  );
  if (!rows[0]) return null;
  // TiDB devuelve items como string en algunos drivers
  if (typeof rows[0].items === 'string') {
    rows[0].items = JSON.parse(rows[0].items);
  }
  return rows[0];
};

export const findByUser = async (user_id) => {
  const [rows] = await pool.execute(
    `SELECT o.*,
       JSON_ARRAYAGG(
         JSON_OBJECT(
           'id',         oi.id,
           'product_id', oi.product_id,
           'name',       oi.name,
           'unit_price', oi.unit_price,
           'quantity',   oi.quantity,
           'image_url',  oi.image_url
         )
       ) AS items
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     WHERE o.user_id = ?
     GROUP BY o.id
     ORDER BY o.created_at DESC`,
    [user_id]
  );
  return rows.map((r) => ({
    ...r,
    items: typeof r.items === 'string' ? JSON.parse(r.items) : r.items,
  }));
};

export const getAll = async () => {
  const [rows] = await pool.execute(
    `SELECT o.*, u.email AS user_email
     FROM orders o
     JOIN users u ON u.id = o.user_id
     ORDER BY o.created_at DESC`
  );
  return rows;
};

export const updateStatus = async (id, status) => {
  await pool.execute('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
};

export const setMpData = async (id, { preference_id, payment_id }) => {
  await pool.execute(
    `UPDATE orders SET
       mp_preference_id = COALESCE(?, mp_preference_id),
       mp_payment_id    = COALESCE(?, mp_payment_id)
     WHERE id = ?`,
    [preference_id ?? null, payment_id ?? null, id]
  );
};

export const findByPreferenceId = async (preference_id) => {
  const [rows] = await pool.execute(
    'SELECT * FROM orders WHERE mp_preference_id = ?',
    [preference_id]
  );
  return rows[0] ?? null;
};