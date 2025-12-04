import dotenv from 'dotenv';
import '@shopify/shopify-api/adapters/node';
import { shopifyApi, ApiVersion } from '@shopify/shopify-api';

// Load environment variables
dotenv.config();

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: process.env.SHOPIFY_SCOPES?.split(',') || ['read_products'],
  hostName: process.env.SHOPIFY_APP_URL?.replace(/https?:\/\//, '') || 'localhost:3000',
  apiVersion: ApiVersion.October25,
  isEmbeddedApp: true,
});

export default shopify;

