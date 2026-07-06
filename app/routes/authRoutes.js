import express from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from '../controllers/authController.js';
import { isAuthenticated, isGuest } from '../middlewares/authMiddleware.js';
import { loginValidator, profileUpdateValidator, passwordChangeValidator } from '../validators/validators.js';

const router = express.Router();

// Stricter Rate Limiter for Login Attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 login attempts per window
  message: 'Terlalu banyak percobaan login dari IP ini. Silakan coba lagi setelah 15 menit.'
});

router.get('/login', isGuest, AuthController.showLogin);
router.post('/login', isGuest, loginLimiter, loginValidator, AuthController.login);
router.post('/logout', isAuthenticated, AuthController.logout);

router.get('/change-password', isAuthenticated, AuthController.showChangePassword);
router.post('/change-password', isAuthenticated, passwordChangeValidator, AuthController.updatePassword);

router.get('/profile', isAuthenticated, AuthController.showProfile);
router.post('/profile', isAuthenticated, profileUpdateValidator, AuthController.updateProfile);

export default router;
