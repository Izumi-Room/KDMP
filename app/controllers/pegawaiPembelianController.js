import { Pembelian, DetailPembelian, Barang, Supplier, User, sequelize } from '../models/index.js';
import { TransactionService } from '../services/transactionService.js';
import { Op } from 'sequelize';

export class PegawaiPembelianController {
  static async dashboard(req, res) {
    const userId = req.session.user.id;
    const umkmId = req.session.user.umkm_id;

    try {
      const recentPurchases = await Pembelian.findAll({
        where: { user_id: userId, umkm_id: umkmId },
        include: [
          { model: Supplier, as: 'supplier' },
          { model: DetailPembelian, as: 'details', include: [{ model: Barang, as: 'barang' }] }
        ],
        order: [['created_at', 'DESC']],
        limit: 5
      });

      const totalCount = await Pembelian.count({ where: { user_id: userId } }) || 0;
      const totalSum = await Pembelian.sum('total_harga', { where: { user_id: userId } }) || 0;

      const lowStock = await Barang.findAll({
        where: {
          umkm_id: umkmId,
          stok: { [Op.lt]: 15 }
        }
      });

      res.render('pegawai_pembelian/dashboard', {
        title: 'Dashboard Pegawai Pembelian',
        recentPurchases,
        totalCount,
        totalSum,
        lowStock
      });
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { message: 'Gagal memuat dashboard pembelian', error: err });
    }
  }

  static async transaksi(req, res) {
    const umkmId = req.session.user.umkm_id;

    try {
      const barang = await Barang.findAll({ where: { umkm_id: umkmId } });
      const suppliers = await Supplier.findAll({ where: { umkm_id: umkmId } });

      res.render('pegawai_pembelian/transaksi', {
        title: 'Terminal Pembelian & Restock',
        barang,
        suppliers
      });
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { message: 'Gagal memuat terminal pembelian', error: err });
    }
  }

  static async storeTransaksi(req, res) {
    const userId = req.session.user.id;
    const umkmId = req.session.user.umkm_id;
    const { supplier_id, items, total_harga } = req.body;

    try {
      if (!supplier_id) {
        return res.status(422).json({ success: false, message: 'Supplier wajib dipilih!' });
      }
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(422).json({ success: false, message: 'Daftar restok barang belanjaan kosong!' });
      }

      const total = parseFloat(total_harga);

      const pembelian = await TransactionService.createPurchaseTransaction({
        supplier_id,
        user_id: userId,
        umkm_id: umkmId,
        items,
        total_harga: total
      });

      res.json({
        success: true,
        message: 'Transaksi pembelian/restock berhasil dicatat!',
        no_faktur: pembelian.no_faktur,
        total: pembelian.total_harga
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Gagal memproses pembelian: ' + err.message });
    }
  }

  static async supplier(req, res) {
    const umkmId = req.session.user.umkm_id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    const whereClause = { umkm_id: umkmId };

    if (search) {
      whereClause[Op.or] = [
        { kode_supplier: { [Op.like]: `%${search}%` } },
        { nama_supplier: { [Op.like]: `%${search}%` } }
      ];
    }

    try {
      const { count, rows } = await Supplier.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [['nama_supplier', 'ASC']]
      });

      const totalPages = Math.ceil(count / limit);

      res.render('pegawai_pembelian/supplier', {
        title: 'Mitra Supplier',
        suppliers: rows,
        search,
        currentPage: page,
        totalPages
      });
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { message: 'Gagal memuat mitra supplier', error: err });
    }
  }

  static async barang(req, res) {
    const umkmId = req.session.user.umkm_id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    
    let sortBy = req.query.sort_by || 'nama_barang';
    let sortDir = req.query.sort_dir || 'asc';

    if (!['kode_barang', 'nama_barang', 'stok', 'satuan'].includes(sortBy)) {
      sortBy = 'nama_barang';
    }
    if (!['asc', 'desc'].includes(sortDir.toLowerCase())) {
      sortDir = 'asc';
    }

    const whereClause = { umkm_id: umkmId };

    if (search) {
      whereClause[Op.or] = [
        { kode_barang: { [Op.like]: `%${search}%` } },
        { nama_barang: { [Op.like]: `%${search}%` } }
      ];
    }

    try {
      const { count, rows } = await Barang.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [[sortBy, sortDir.toUpperCase()]]
      });

      const totalPages = Math.ceil(count / limit);

      res.render('pegawai_pembelian/barang', {
        title: 'Katalog Barang',
        barang: rows,
        search,
        sortBy,
        sortDir,
        currentPage: page,
        totalPages
      });
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { message: 'Gagal memuat katalog barang', error: err });
    }
  }

  static async pembelian(req, res) {
    const umkmId = req.session.user.umkm_id;
    
    let bulan = parseInt(req.query.bulan, 10);
    let tahun = parseInt(req.query.tahun, 10);

    if (isNaN(bulan) || bulan < 1 || bulan > 12) {
      bulan = new Date().getMonth() + 1;
    }
    if (isNaN(tahun) || tahun < 2000 || tahun > 2100) {
      tahun = new Date().getFullYear();
    }

    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 1; i++) {
      years.push(i);
    }

    const months = {
      1: 'Januari', 2: 'Februari', 3: 'Maret', 4: 'April',
      5: 'Mei', 6: 'Juni', 7: 'Juli', 8: 'Agustus',
      9: 'September', 10: 'Oktober', 11: 'November', 12: 'Desember'
    };

    try {
      const report = await Pembelian.findAll({
        where: {
          umkm_id: umkmId,
          [Op.and]: [
            sequelize.where(sequelize.fn('MONTH', sequelize.col('tanggal')), bulan),
            sequelize.where(sequelize.fn('YEAR', sequelize.col('tanggal')), tahun)
          ]
        },
        include: [
          { model: User, as: 'user' },
          { model: Supplier, as: 'supplier' },
          { model: DetailPembelian, as: 'details', include: [{ model: Barang, as: 'barang' }] }
        ],
        order: [['tanggal', 'ASC'], ['created_at', 'ASC']]
      });

      res.render('pegawai_pembelian/pembelian', {
        title: 'Riwayat Pembelian',
        report,
        bulan,
        tahun,
        months,
        years
      });
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { message: 'Gagal memuat riwayat pembelian', error: err });
    }
  }
}

export default PegawaiPembelianController;
