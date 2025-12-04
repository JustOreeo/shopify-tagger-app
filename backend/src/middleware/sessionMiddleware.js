import shopify from '../lib/shopify.js';

export async function getSession(req, res, next) {
    try {
        const shop = req.query.shop || req.headers['x-shopify-shop-domain'] || req.body.shop;
        
        if (!shop) {
            return res.status(400).json({ error: 'Shop parameter is required' });
        }

        const sessionId = await shopify.session.getCurrentId({
            rawRequest: req,
            rawResponse: res,
            isOnline: false,
        });

        if (!sessionId) {
            return res.status(401).json({ error: 'No active session. Please authenticate first.' });
        }

        const session = await shopify.config.sessionStorage.loadSession(sessionId);

        if (!session) {
            return res.status(401).json({ error: 'Session not found. Please authenticate first.' });
        }

        req.session = session;
        req.shop = shop;
        next();
    } catch (error) {
        console.error('Session middleware error:', error);
        res.status(500).json({ error: 'Failed to load session' });
    }
}
