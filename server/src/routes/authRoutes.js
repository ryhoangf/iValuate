const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');
const {
    authLoginRegisterLimiter,
    authForgotPasswordLimiter,
    authResetPasswordLimiter,
} = require('../middleware/rateLimit');

router.post('/register', authLoginRegisterLimiter, authController.handleRegister);
router.post('/login', authLoginRegisterLimiter, authController.handleLogin);
router.post('/forgot-password', authForgotPasswordLimiter, authController.handleForgotPassword);
router.post('/reset-password', authResetPasswordLimiter, authController.handleResetPassword);
router.post('/upgrade-premium-trial', requireAuth, authController.handleUpgradePremiumTrial);
router.post('/downgrade-to-lite', requireAuth, authController.handleDowngradePremiumToLite);
router.get('/me', requireAuth, authController.handleGetMe);
router.patch('/me', requireAuth, authController.handlePatchMe);

module.exports = router;