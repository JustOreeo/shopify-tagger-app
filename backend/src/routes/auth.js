import express from 'express';
import shopify from '../lib/shopify.js';

const router = express.Router();

router.get('/auth', async (req, res) => {
    const shop = req.query.shop;
    if (!shop) return res.status(400).send('No shop found');

    await shopify.auth.begin({
        rawRequest: req,
        rawResponse: res,
        shop,
        callbackPath: '/auth/callback',
        isOnline: false, // offline access token
    });
});

router.get('/auth/callback', async (req, res) => {
    try {
      const callbackResponse = await shopify.auth.callback({
        rawRequest: req,
        rawResponse: res,
      });
      
      const { session } = callbackResponse;
      // session now has accessToken, shop, scope, etc.
      console.log('Access token:', session.accessToken);
      res.send('OAuth successful! You can now call Shopify APIs.');
    } catch (error) {
      console.error(error);
      res.status(500).send('OAuth failed');
    }
});
  
  export default router;