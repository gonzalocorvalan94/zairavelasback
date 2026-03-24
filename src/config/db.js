import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : false,
  waitForConnections: true,
  connectionLimit: 10,
});

const connectDB = async () => {
  try {
    await pool.getConnection();
    console.log('DB conectada');
  } catch (error) {
    console.error('Error conectando a la DB:', error.message);
    process.exit(1);
  }
};

export { pool, connectDB };
