import express from 'express';
import { AuthController } from '../controllers/authController.js';
import { isAuthenticated, isGuest } from '../middlewares/authMiddleware.js';
import { loginValidator } from '../validators/validators.js';

const router = express.Router();

router.get('/login', isGuest, AuthController.showLogin);
router.post('/login', isGuest, loginValidator, AuthController.login);
router.post('/logout', isAuthenticated, AuthController.logout);

router.get('/change-password', isAuthenticated, AuthController.showChangePassword);
router.post('/change-password', isAuthenticated, AuthController.updatePassword);

router.get('/profile', isAuthenticated, AuthController.showProfile);
router.post('/profile', isAuthenticated, AuthController.updateProfile);

export default router;
