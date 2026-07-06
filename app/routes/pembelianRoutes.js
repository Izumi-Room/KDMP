import express from 'express';
import { PegawaiPembelianController } from '../controllers/pegawaiPembelianController.js';
import { isAuthenticated, hasRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(isAuthenticated);
router.use(hasRole(['pegawai_pembelian']));

router.get('/dashboard', PegawaiPembelianController.dashboard);
router.get('/transaksi', PegawaiPembelianController.transaksi);
router.post('/transaksi', PegawaiPembelianController.storeTransaksi);

export default router;
