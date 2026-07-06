import { body, validationResult } from 'express-validator';
import { User, Barang, Supplier } from '../models/index.js';
import { Op } from 'sequelize';

// Middleware to check validation results and return errors
export const validateResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // If it's an AJAX request (e.g. POS), return JSON
    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.status(422).json({
        success: false,
        message: errors.array().map(e => e.msg).join(', '),
        errors: errors.array()
      });
    }
    // For standard requests, flash errors or pass them in session
    req.session.errors = errors.array().reduce((acc, err) => {
      acc[err.path] = err.msg;
      return acc;
    }, {});
    req.session.old = req.body;
    return res.redirect('back');
  }
  next();
};

export const loginValidator = [
  body('username').trim().notEmpty().withMessage('Username wajib diisi'),
  body('password').notEmpty().withMessage('Password wajib diisi'),
  validateResult
];

export const umkmCreateValidator = [
  body('nama_umkm').trim().notEmpty().withMessage('Nama UMKM wajib diisi'),
  body('alamat').trim().optional({ nullable: true }),
  body('telepon').trim().optional({ nullable: true }),
  body('username').trim().notEmpty().withMessage('Username admin wajib diisi')
    .custom(async (value) => {
      const user = await User.findOne({ where: { username: value } });
      if (user) throw new Error('Username admin sudah digunakan');
      return true;
    }),
  body('name').trim().notEmpty().withMessage('Nama lengkap admin wajib diisi'),
  body('email').trim().optional({ nullable: true }).isEmail().withMessage('Format email tidak valid'),
  body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
  validateResult
];

export const umkmUpdateValidator = [
  body('nama_umkm').trim().notEmpty().withMessage('Nama UMKM wajib diisi'),
  body('alamat').trim().optional({ nullable: true }),
  body('telepon').trim().optional({ nullable: true }),
  body('username').trim().notEmpty().withMessage('Username admin wajib diisi')
    .custom(async (value, { req }) => {
      const umkmId = req.params.id;
      // Find the admin user for this UMKM
      const admin = await User.findOne({
        where: {
          umkm_id: umkmId,
          role_id: 2 // admin_umkm
        }
      });
      const whereClause = { username: value };
      if (admin) {
        whereClause.id = { [Op.ne]: admin.id };
      }
      const existingUser = await User.findOne({ where: whereClause });
      if (existingUser) throw new Error('Username admin sudah digunakan');
      return true;
    }),
  body('name').trim().notEmpty().withMessage('Nama lengkap admin wajib diisi'),
  body('email').trim().optional({ nullable: true }).isEmail().withMessage('Format email tidak valid'),
  body('password').optional({ checkFalsy: true }).isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
  validateResult
];

export const employeeCreateValidator = [
  body('username').trim().notEmpty().withMessage('Username wajib diisi')
    .custom(async (value) => {
      const user = await User.findOne({ where: { username: value } });
      if (user) throw new Error('Username sudah digunakan');
      return true;
    }),
  body('name').trim().notEmpty().withMessage('Nama lengkap wajib diisi'),
  body('email').trim().optional({ nullable: true }).isEmail().withMessage('Format email tidak valid'),
  body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
  body('role_id').notEmpty().withMessage('Role wajib dipilih'),
  validateResult
];

export const employeeUpdateValidator = [
  body('username').trim().notEmpty().withMessage('Username wajib diisi')
    .custom(async (value, { req }) => {
      const userId = req.params.id;
      const user = await User.findOne({
        where: {
          username: value,
          id: { [Op.ne]: userId }
        }
      });
      if (user) throw new Error('Username sudah digunakan');
      return true;
    }),
  body('name').trim().notEmpty().withMessage('Nama lengkap wajib diisi'),
  body('email').trim().optional({ nullable: true }).isEmail().withMessage('Format email tidak valid'),
  body('password').optional({ checkFalsy: true }).isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
  body('role_id').notEmpty().withMessage('Role wajib dipilih'),
  body('status').notEmpty().withMessage('Status aktif wajib dipilih'),
  validateResult
];

export const barangCreateValidator = [
  body('kode_barang').trim().notEmpty().withMessage('Kode barang wajib diisi')
    .custom(async (value, { req }) => {
      const umkmId = req.session.user.umkm_id;
      const barang = await Barang.findOne({
        where: {
          kode_barang: value,
          umkm_id: umkmId
        }
      });
      if (barang) throw new Error('Kode barang sudah digunakan di UMKM ini');
      return true;
    }),
  body('nama_barang').trim().notEmpty().withMessage('Nama barang wajib diisi'),
  body('ukuran').trim().optional({ nullable: true }),
  body('stok').isInt({ min: 0 }).withMessage('Stok minimal 0'),
  body('satuan').trim().notEmpty().withMessage('Satuan wajib diisi'),
  validateResult
];

export const barangUpdateValidator = [
  body('kode_barang').trim().notEmpty().withMessage('Kode barang wajib diisi')
    .custom(async (value, { req }) => {
      const umkmId = req.session.user.umkm_id;
      const barangId = req.params.id;
      const barang = await Barang.findOne({
        where: {
          kode_barang: value,
          umkm_id: umkmId,
          id: { [Op.ne]: barangId }
        }
      });
      if (barang) throw new Error('Kode barang sudah digunakan di UMKM ini');
      return true;
    }),
  body('nama_barang').trim().notEmpty().withMessage('Nama barang wajib diisi'),
  body('ukuran').trim().optional({ nullable: true }),
  body('stok').isInt({ min: 0 }).withMessage('Stok minimal 0'),
  body('satuan').trim().notEmpty().withMessage('Satuan wajib diisi'),
  validateResult
];

export const supplierCreateValidator = [
  body('kode_supplier').trim().notEmpty().withMessage('Kode supplier wajib diisi')
    .custom(async (value, { req }) => {
      const umkmId = req.session.user.umkm_id;
      const supplier = await Supplier.findOne({
        where: {
          kode_supplier: value,
          umkm_id: umkmId
        }
      });
      if (supplier) throw new Error('Kode supplier sudah digunakan di UMKM ini');
      return true;
    }),
  body('nama_supplier').trim().notEmpty().withMessage('Nama supplier wajib diisi'),
  body('alamat').trim().optional({ nullable: true }),
  body('npwp').trim().optional({ nullable: true }),
  validateResult
];

export const supplierUpdateValidator = [
  body('kode_supplier').trim().notEmpty().withMessage('Kode supplier wajib diisi')
    .custom(async (value, { req }) => {
      const umkmId = req.session.user.umkm_id;
      const supplierId = req.params.id;
      const supplier = await Supplier.findOne({
        where: {
          kode_supplier: value,
          umkm_id: umkmId,
          id: { [Op.ne]: supplierId }
        }
      });
      if (supplier) throw new Error('Kode supplier sudah digunakan di UMKM ini');
      return true;
    }),
  body('nama_supplier').trim().notEmpty().withMessage('Nama supplier wajib diisi'),
  body('alamat').trim().optional({ nullable: true }),
  body('npwp').trim().optional({ nullable: true }),
  validateResult
];

export const profileUpdateValidator = [
  body('name').trim().notEmpty().withMessage('Nama lengkap admin wajib diisi'),
  body('email').trim().notEmpty().withMessage('Email wajib diisi')
    .isEmail().withMessage('Format email tidak valid'),
  validateResult
];

export const passwordChangeValidator = [
  body('current_password').notEmpty().withMessage('Password saat ini wajib diisi'),
  body('password').isLength({ min: 6 }).withMessage('Password baru minimal 6 karakter'),
  body('password_confirmation').notEmpty().withMessage('Konfirmasi password baru wajib diisi')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Konfirmasi password baru tidak cocok');
      }
      return true;
    }),
  validateResult
];
