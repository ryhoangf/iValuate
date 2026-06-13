const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { optionalAuth, requireAuth, requirePremium } = require('../middleware/authMiddleware');
const { cacheResponse } = require('../middleware/cacheResponse');

router.get(
    '/brand-catalog',
    cacheResponse(21600, 'brand-catalog-v2'),
    productController.getBrandCatalog
);
router.get('/search', cacheResponse(1800, 'search'), productController.searchAndEvaluate);
router.get(
    '/market-price',
    optionalAuth,
    cacheResponse(3600, 'market-price'),
    productController.getMarketPriceRange
);
router.get('/feature-impact', requireAuth, requirePremium, productController.getFeatureImpact);
router.get(
    '/depreciation-curve',
    requireAuth,
    requirePremium,
    cacheResponse(21600, 'depreciation-curve'),
    productController.getDepreciationCurve
);
router.post('/counterfactual-impact', requireAuth, requirePremium, productController.postCounterfactualImpact);
router.get(
    '/price-forecast-30d',
    requireAuth,
    requirePremium,
    cacheResponse(21600, 'price-forecast-30d-v2'),
    productController.getPriceForecast30d
);

module.exports = router;
