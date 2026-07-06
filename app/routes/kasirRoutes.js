import express from 'express';
import { PegawaiPenjualanController } from '../controllers/pegawaiPenjualanController.js';
import { isAuthenticated, hasRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(isAuthenticated);
router.use(hasRole(['pegawai_penjualan']));

router.get('/dashboard', PegawaiPenjualanController.dashboard);
router.get('/transaksi', PegawaiPenjualanController.transaksi);
router.post('/transaksi', PegawaiPenjualanController.storeTransaksi);
router.get('/transaksi/:id/print', PegawaiPenjualanController.printInvoice);

export default router;
