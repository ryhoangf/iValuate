const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

router.post('/register', authController.handleRegister);
router.post('/login', authController.handleLogin);
router.post('/forgot-password', authController.handleForgotPassword);
router.post('/reset-password', authController.handleResetPassword);
router.post('/upgrade-premium-trial', requireAuth, authController.handleUpgradePremiumTrial);
router.post('/downgrade-to-lite', requireAuth, authController.handleDowngradePremiumToLite);
router.get('/me', requireAuth, authController.handleGetMe);
router.patch('/me', requireAuth, authController.handlePatchMe);

module.exports = router;