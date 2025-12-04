import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import apiRoutes from './routes/api.js';

dotenv.config();

const app = express();
app.use(cookieParser());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ 
    message: 'Shopify Tagger App API',
    endpoints: {
      auth: '/auth?shop=your-shop.myshopify.com',
      callback: '/auth/callback',
      filter: 'GET /api/products/filter',
      preview: 'GET /api/products/preview',
      bulkTag: 'POST /api/products/bulk-tag'
    }
  });
});

app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

const PORT = 3000;
app.listen(PORT, () => console.log(`Backend listening on port ${PORT}`));
