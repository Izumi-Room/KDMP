import { Pembelian, DetailPembelian, Barang, Supplier } from '../models/index.js';
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
}

export default PegawaiPembelianController;
