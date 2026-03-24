import { pool } from '../config/db.js';

const getAll = async ({ category_id, active } = {}) => {
  let query = `
    SELECT p.*, c.name AS category_name 
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (category_id) {
    query += ' AND p.category_id = ?';
    params.push(category_id);
  }
  if (active !== undefined) {
    query += ' AND p.active = ?';
    params.push(active);
  }

  query += ' ORDER BY p.created_at DESC';
  const [rows] = await pool.query(query, params);
  return rows;
};

const findById = async (id) => {
  const [rows] = await pool.query(
    `SELECT p.*, c.name AS category_name 
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.id = ?`,
    [id]
  );
  return rows[0] || null;
};

const create = async ({
  category_id,
  name,
  description,
  price,
  stock,
  image_url,
}) => {
  const [result] = await pool.query(
    'INSERT INTO products (category_id, name, description, price, stock, image_url) VALUES (?, ?, ?, ?, ?, ?)',
    [category_id, name, description, price, stock, image_url]
  );
  return result.insertId;
};

const update = async (
  id,
  { category_id, name, description, price, stock, image_url, active }
) => {
  const [result] = await pool.query(
    `UPDATE products 
     SET category_id = ?, name = ?, description = ?, price = ?, stock = ?, image_url = ?, active = ?
     WHERE id = ?`,
    [category_id, name, description, price, stock, image_url, active, id]
  );
  return result.affectedRows;
};

const remove = async (id) => {
  const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);
  return result.affectedRows;
};

export { getAll, findById, create, update, remove };
