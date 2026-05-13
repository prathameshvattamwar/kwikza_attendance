const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { authLimiter } = require('../middleware/rateLimiter.middleware');
const {
  loginSchema,
  setupPasswordSchema,
  verifyOtpSchema,
} = require('../validators/auth.validator');

// Public routes (with rate limiting)
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/send-otp', authLimiter, authController.sendOtp);
router.post('/verify-otp', authLimiter, validate(verifyOtpSchema), authController.verifyOtp);

// Authenticated routes
router.post('/logout', authenticate, authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);
router.post('/setup-password', authenticate, validate(setupPasswordSchema), authController.setupPassword);
router.get('/me', authenticate, authController.getMe);

module.exports = router;
