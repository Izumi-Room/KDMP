import express from 'express';
import { AdminUmkmController } from '../controllers/adminUmkmController.js';
import { UserController } from '../controllers/userController.js';
import { BarangController } from '../controllers/barangController.js';
import { SupplierController } from '../controllers/supplierController.js';
import { LaporanController } from '../controllers/laporanController.js';
import { isAuthenticated, hasRole } from '../middlewares/authMiddleware.js';
import {
  employeeCreateValidator, employeeUpdateValidator,
  barangCreateValidator, barangUpdateValidator,
  supplierCreateValidator, supplierUpdateValidator
} from '../validators/validators.js';

const router = express.Router();

router.use(isAuthenticated);
router.use(hasRole(['admin_umkm']));

// Dashboard
router.get('/dashboard', AdminUmkmController.dashboard);

// UMKM Profile Edit
router.get('/profile', AdminUmkmController.editProfile);
router.post('/profile', AdminUmkmController.updateProfile);

// Employee CRUD
router.get('/user', UserController.index);
router.get('/user/create', UserController.create);
router.post('/user', employeeCreateValidator, UserController.store);
router.get('/user/:id/edit', UserController.edit);
router.post('/user/:id', employeeUpdateValidator, UserController.update);
router.post('/user/:id/delete', UserController.destroy);

// Barang CRUD
router.get('/barang', BarangController.index);
router.get('/barang/create', BarangController.create);
router.post('/barang', barangCreateValidator, BarangController.store);
router.get('/barang/:id/edit', BarangController.edit);
router.post('/barang/:id', barangUpdateValidator, BarangController.update);
router.post('/barang/:id/delete', BarangController.destroy);

// Supplier CRUD
router.get('/supplier', SupplierController.index);
router.get('/supplier/create', SupplierController.create);
router.post('/supplier', supplierCreateValidator, SupplierController.store);
router.get('/supplier/:id/edit', SupplierController.edit);
router.post('/supplier/:id', supplierUpdateValidator, SupplierController.update);
router.post('/supplier/:id/delete', SupplierController.destroy);

// Reports
router.get('/laporan/penjualan', LaporanController.penjualanIndex);
router.get('/laporan/penjualan/export-pdf', LaporanController.penjualanExportPdf);
router.get('/laporan/penjualan/export-excel', LaporanController.penjualanExportExcel);

router.get('/laporan/pembelian', LaporanController.pembelianIndex);
router.get('/laporan/pembelian/export-pdf', LaporanController.pembelianExportPdf);
router.get('/laporan/pembelian/export-excel', LaporanController.pembelianExportExcel);

export default router;
