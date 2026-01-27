const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/search', productController.searchAndEvaluate);
router.get('/market-price', productController.getMarketPriceRange);

module.exports = router;