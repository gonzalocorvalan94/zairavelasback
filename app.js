import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './src/config/db.js';
import authRoutes from './src/routes/auth.routes.js';
import categoriesRoutes from './src/routes/categories.routes.js';
import productsRoutes from './src/routes/products.routes.js';
import orderRoutes from './src/routes/order.routes.js';
import errorHandler from './src/middlewares/errorHandler.js';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', orderRoutes);

app.use(errorHandler);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server corriendo en puerto ${PORT}`);
  });
});