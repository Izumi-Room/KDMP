import { Penjualan, DetailPenjualan, Barang } from '../models/index.js';
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
          { model: DetailPenjualan, as: 'details', include: [{ model: Barang, as: 'barang' }] }
        ]
      });

      if (!penjualan) {
        return res.status(404).send('Transaksi tidak ditemukan.');
      }

      res.render('pegawai_penjualan/print', {
        title: `Faktur #${penjualan.no_faktur}`,
        penjualan,
        layout: false // Do not use main master layout for receipt prints
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Terjadi kesalahan memuat print invoice.');
    }
  }
}

export default PegawaiPenjualanController;
