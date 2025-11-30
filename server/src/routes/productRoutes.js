const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Định nghĩa đường dẫn: /api/search -> gọi vào Controller
router.get('/search', productController.searchAndEvaluate);

module.exports = router;