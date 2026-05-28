const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { optionalAuth, requireAuth, requirePremium } = require('../middleware/authMiddleware');

router.get('/search', productController.searchAndEvaluate);
router.get('/market-price', optionalAuth, productController.getMarketPriceRange);
router.get('/feature-impact', requireAuth, requirePremium, productController.getFeatureImpact);
router.get('/depreciation-curve', requireAuth, requirePremium, productController.getDepreciationCurve);
router.post('/counterfactual-impact', requireAuth, requirePremium, productController.postCounterfactualImpact);
module.exports = router;