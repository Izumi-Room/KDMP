import { sequelize, Penjualan, DetailPenjualan, Pembelian, DetailPembelian, Barang, StokLog } from '../models/index.js';
import { Op } from 'sequelize';

export class TransactionService {
  /**
   * Generate Sales Faktur Number
   */
  static async generateSalesFakturNumber(umkmId) {
    const today = new Date();
    const yyyymmdd = today.getFullYear() +
      String(today.getMonth() + 1).padStart(2, '0') +
      String(today.getDate()).padStart(2, '0');
    const prefix = `INV-${yyyymmdd}-${String(umkmId).padStart(3, '0')}-`;

    const latest = await Penjualan.findOne({
      where: {
        no_faktur: {
          [Op.like]: `${prefix}%`
        }
      },
      order: [['no_faktur', 'DESC']]
    });

    let sequence = 1;
    if (latest) {
      const parts = latest.no_faktur.split('-');
      const lastSeqStr = parts[parts.length - 1];
      sequence = parseInt(lastSeqStr, 10) + 1;
    }

    return prefix + String(sequence).padStart(4, '0');
  }

  /**
   * Generate Purchase Faktur Number
   */
  static async generatePurchaseFakturNumber(umkmId) {
    const today = new Date();
    const yyyymmdd = today.getFullYear() +
      String(today.getMonth() + 1).padStart(2, '0') +
      String(today.getDate()).padStart(2, '0');
    const prefix = `PRC-${yyyymmdd}-${String(umkmId).padStart(3, '0')}-`;

    const latest = await Pembelian.findOne({
      where: {
        no_faktur: {
          [Op.like]: `${prefix}%`
        }
      },
      order: [['no_faktur', 'DESC']]
    });

    let sequence = 1;
    if (latest) {
      const parts = latest.no_faktur.split('-');
      const lastSeqStr = parts[parts.length - 1];
      sequence = parseInt(lastSeqStr, 10) + 1;
    }

    return prefix + String(sequence).padStart(4, '0');
  }

  /**
   * Create a Sales Transaction
   */
  static async createSalesTransaction({ user_id, umkm_id, items, total_harga, bayar, kembali }) {
    return await sequelize.transaction(async (t) => {
      const no_faktur = await this.generateSalesFakturNumber(umkm_id);
      const tanggal = new Date().toISOString().split('T')[0];

      // 1. Verify and update stock
      for (const item of items) {
        const barang = await Barang.findOne({
          where: { id: item.barang_id, umkm_id },
          transaction: t
        });

        if (!barang) {
          throw new Error(`Barang dengan ID ${item.barang_id} tidak ditemukan.`);
        }

        if (barang.stok < item.qty) {
          throw new Error(`Stok untuk '${barang.nama_barang}' tidak mencukupi (Tersedia: ${barang.stok}, Diminta: ${item.qty}).`);
        }

        // Deduct stock
        barang.stok -= parseInt(item.qty, 10);
        await barang.save({ transaction: t });
      }

      // 2. Create Penjualan record
      const penjualan = await Penjualan.create({
        no_faktur,
        tanggal,
        user_id,
        total_harga,
        bayar,
        kembali,
        umkm_id
      }, { transaction: t });

      // 3. Create Details and logs
      for (const item of items) {
        await DetailPenjualan.create({
          penjualan_id: penjualan.id,
          barang_id: item.barang_id,
          qty: item.qty,
          harga_satuan: item.harga_satuan,
          subtotal: parseInt(item.qty, 10) * parseInt(item.harga_satuan, 10)
        }, { transaction: t });

        await StokLog.create({
          barang_id: item.barang_id,
          tipe: 'keluar',
          qty: item.qty,
          keterangan: `Penjualan Faktur #${no_faktur}`,
          tanggal: new Date()
        }, { transaction: t });
      }

      return penjualan;
    });
  }

  /**
   * Create a Purchase/Restock Transaction
   */
  static async createPurchaseTransaction({ supplier_id, user_id, umkm_id, items, total_harga }) {
    return await sequelize.transaction(async (t) => {
      const no_faktur = await this.generatePurchaseFakturNumber(umkm_id);
      const tanggal = new Date().toISOString().split('T')[0];

      // 1. Verify and update stock
      for (const item of items) {
        const barang = await Barang.findOne({
          where: { id: item.barang_id, umkm_id },
          transaction: t
        });

        if (!barang) {
          throw new Error(`Barang dengan ID ${item.barang_id} tidak ditemukan.`);
        }

        // Add stock
        barang.stok += parseInt(item.qty, 10);
        await barang.save({ transaction: t });
      }

      // 2. Create Pembelian record
      const pembelian = await Pembelian.create({
        no_faktur,
        tanggal,
        supplier_id,
        user_id,
        total_harga,
        umkm_id
      }, { transaction: t });

      // 3. Create Details and logs
      for (const item of items) {
        await DetailPembelian.create({
          pembelian_id: pembelian.id,
          barang_id: item.barang_id,
          qty: item.qty,
          harga_satuan: item.harga_satuan,
          subtotal: parseInt(item.qty, 10) * parseInt(item.harga_satuan, 10)
        }, { transaction: t });

        await StokLog.create({
          barang_id: item.barang_id,
          tipe: 'masuk',
          qty: item.qty,
          keterangan: `Pembelian Faktur #${no_faktur}`,
          tanggal: new Date()
        }, { transaction: t });
      }

      return pembelian;
    });
  }
}

export default TransactionService;
