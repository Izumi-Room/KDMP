import { Penjualan, DetailPenjualan, Barang, User, Umkm, sequelize } from '../models/index.js';
import { TransactionService } from '../services/transactionService.js';
import { Op } from 'sequelize';

export class PegawaiPenjualanController {
  static async dashboard(req, res) {
    const userId = req.session.user.id;
    const umkmId = req.session.user.umkm_id;

    try {
      const recentSales = await Penjualan.findAll({
        where: { user_id: userId, umkm_id: umkmId },
        include: [{
          model: DetailPenjualan,
          as: 'details',
          include: [{ model: Barang, as: 'barang' }]
        }],
        order: [['created_at', 'DESC']],
        limit: 5
      });

      const totalCount = await Penjualan.count({ where: { user_id: userId } }) || 0;
      const totalSum = await Penjualan.sum('total_harga', { where: { user_id: userId } }) || 0;

      const lowStock = await Barang.findAll({
        where: {
          umkm_id: umkmId,
          stok: { [Op.lt]: 15 }
        }
      });

      res.render('pegawai_penjualan/dashboard', {
        title: 'Dashboard Kasir Penjualan',
        recentSales,
        totalCount,
        totalSum,
        lowStock
      });
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { message: 'Gagal memuat dashboard kasir', error: err });
    }
  }

  static async transaksi(req, res) {
    const umkmId = req.session.user.umkm_id;

    try {
      const barang = await Barang.findAll({
        where: { umkm_id: umkmId }
      });

      res.render('pegawai_penjualan/transaksi', {
        title: 'POS Terminal Penjualan',
        barang
      });
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { message: 'Gagal memuat POS terminal', error: err });
    }
  }

  static async storeTransaksi(req, res) {
    const userId = req.session.user.id;
    const umkmId = req.session.user.umkm_id;
    const { items, total_harga, bayar } = req.body;

    try {
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(422).json({ success: false, message: 'Daftar barang belanjaan kosong!' });
      }

      const total = parseFloat(total_harga);
      const pay = parseFloat(bayar);

      if (pay < total) {
        return res.status(422).json({ success: false, message: 'Uang bayar tidak boleh kurang dari total harga belanja!' });
      }

      const kembali = pay - total;

      const penjualan = await TransactionService.createSalesTransaction({
        user_id: userId,
        umkm_id: umkmId,
        items,
        total_harga: total,
        bayar: pay,
        kembali
      });

      res.json({
        success: true,
        message: 'Transaksi penjualan berhasil disimpan!',
        penjualan_id: penjualan.id,
        no_faktur: penjualan.no_faktur,
        total,
        bayar: pay,
        kembali
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Gagal memproses transaksi: ' + err.message });
    }
  }

  static async printInvoice(req, res) {
    const { id } = req.params;
    const umkmId = req.session.user.umkm_id;

    try {
      const penjualan = await Penjualan.findOne({
        where: { id, umkm_id: umkmId },
        include: [
          { model: User, as: 'user' },
          { model: DetailPenjualan, as: 'details', include: [{ model: Barang, as: 'barang' }] }
        ]
      });

      if (!penjualan) {
        return res.status(404).send('Transaksi tidak ditemukan.');
      }

      const umkm = await Umkm.findByPk(umkmId);

      res.render('pegawai_penjualan/print', {
        title: `Faktur #${penjualan.no_faktur}`,
        penjualan,
        umkm,
        layout: false // Do not use main master layout for receipt prints
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Terjadi kesalahan memuat print invoice.');
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

      res.render('pegawai_penjualan/barang', {
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

  static async penjualan(req, res) {
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
      const report = await Penjualan.findAll({
        where: {
          umkm_id: umkmId,
          [Op.and]: [
            sequelize.where(sequelize.fn('MONTH', sequelize.col('tanggal')), bulan),
            sequelize.where(sequelize.fn('YEAR', sequelize.col('tanggal')), tahun)
          ]
        },
        include: [
          { model: User, as: 'user' },
          { model: DetailPenjualan, as: 'details', include: [{ model: Barang, as: 'barang' }] }
        ],
        order: [['tanggal', 'ASC'], ['created_at', 'ASC']]
      });

      res.render('pegawai_penjualan/penjualan', {
        title: 'Riwayat Penjualan',
        report,
        bulan,
        tahun,
        months,
        years
      });
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { message: 'Gagal memuat riwayat penjualan', error: err });
    }
  }
}

export default PegawaiPenjualanController;
