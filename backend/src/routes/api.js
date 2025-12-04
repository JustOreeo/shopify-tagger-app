import express from 'express';
import { getSession } from '../middleware/sessionMiddleware.js';
import {
    getFilteredProducts,
    previewProducts,
    bulkTagProducts,
} from '../services/productService.js';

const router = express.Router();

router.use(getSession);

router.get('/products/filter', async (req, res) => {
    try {
        const { keyword, productType, collectionHandle, collectionId, limit = 250 } = req.query;

        const filters = {};
        if (keyword) filters.keyword = keyword;
        if (productType) filters.productType = productType;
        if (collectionHandle) filters.collectionHandle = collectionHandle;
        if (collectionId) filters.collectionId = collectionId;

        const result = await getFilteredProducts(req.session, filters, parseInt(limit));

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('Filter products error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to filter products',
        });
    }
});

router.get('/products/preview', async (req, res) => {
    try {
        const { keyword, productType, collectionHandle, collectionId } = req.query;

        const filters = {};
        if (keyword) filters.keyword = keyword;
        if (productType) filters.productType = productType;
        if (collectionHandle) filters.collectionHandle = collectionHandle;
        if (collectionId) filters.collectionId = collectionId;

        const result = await previewProducts(req.session, filters);

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
            console.error('Preview products error:', error);
            res.status(500).json({
            success: false,
            error: error.message || 'Failed to preview products',
        });
    }
});

router.post('/products/bulk-tag', async (req, res) => {
    try {
        const { keyword, productType, collectionHandle, collectionId, tag } = req.body;

        if (!tag || typeof tag !== 'string' || tag.trim() === '') {
        return res.status(400).json({
            success: false,
            error: 'Tag is required and must be a non-empty string',
        });
        }

        const filters = {};
        if (keyword) filters.keyword = keyword;
        if (productType) filters.productType = productType;
        if (collectionHandle) filters.collectionHandle = collectionHandle;
        if (collectionId) filters.collectionId = collectionId;

        const result = await bulkTagProducts(req.session, filters, tag.trim());

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
            console.error('Bulk tag error:', error);
            res.status(500).json({
            success: false,
            error: error.message || 'Failed to bulk tag products',
        });
    }
});

export default router;

