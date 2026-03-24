import { pool } from '../config/db.js';

const getAll = async () => {
  const [rows] = await pool.query('SELECT * FROM categories ORDER BY name ASC');
  return rows;
};

const findById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
  return rows[0] || null;
};

const findBySlug = async (slug) => {
  const [rows] = await pool.query('SELECT * FROM categories WHERE slug = ?', [slug]);
  return rows[0] || null;
};

const create = async ({ name, slug }) => {
  const [result] = await pool.query(
    'INSERT INTO categories (name, slug) VALUES (?, ?)',
    [name, slug]
  );
  return result.insertId;
};

const update = async (id, { name, slug }) => {
  const [result] = await pool.query(
    'UPDATE categories SET name = ?, slug = ? WHERE id = ?',
    [name, slug, id]
  );
  return result.affectedRows;
};

const remove = async (id) => {
  const [result] = await pool.query('DELETE FROM categories WHERE id = ?', [id]);
  return result.affectedRows;
};

export { getAll, findById, findBySlug, create, update, remove };