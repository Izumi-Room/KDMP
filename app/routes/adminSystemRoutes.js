import express from 'express';
import { AdminSystemController } from '../controllers/adminSystemController.js';
import { isAuthenticated, hasRole } from '../middlewares/authMiddleware.js';
import { umkmCreateValidator, umkmUpdateValidator } from '../validators/validators.js';

const router = express.Router();

router.use(isAuthenticated);
router.use(hasRole(['admin_system']));

router.get('/dashboard', AdminSystemController.dashboard);
router.get('/umkm', AdminSystemController.indexUmkm);
router.get('/umkm/create', AdminSystemController.createUmkm);
router.post('/umkm', umkmCreateValidator, AdminSystemController.storeUmkm);
router.get('/umkm/:id/edit', AdminSystemController.editUmkm);
router.post('/umkm/:id', umkmUpdateValidator, AdminSystemController.updateUmkm);
router.post('/umkm/:id/delete', AdminSystemController.destroyUmkm);
router.post('/user/:id/toggle-status', AdminSystemController.toggleUserStatus);

export default router;
