import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';

dotenv.config();

const app = express();
app.use(cookieParser());
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Shopify Tagger App API',
    endpoints: {
      auth: '/auth?shop=your-shop.myshopify.com',
      callback: '/auth/callback'
    }
  });
});

app.use('/auth', authRoutes);

const PORT = 3000;
app.listen(PORT, () => console.log(`Backend listening on port ${PORT}`));
