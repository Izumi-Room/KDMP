import { sequelize, User, Umkm, Barang, Supplier, Penjualan, Pembelian, DetailPenjualan } from '../models/index.js';
import { Op } from 'sequelize';

export class DashboardService {
  /**
   * Get stats for system admin
   */
  static async getSystemStats() {
    const totalUsers = await User.count() || 0;
    const totalUmkm = await Umkm.count() || 0;
    const totalBarang = await Barang.count() || 0;
    const totalSupplier = await Supplier.count() || 0;

    const totalSales = await Penjualan.sum('total_harga') || 0;
    const totalPurchases = await Pembelian.sum('total_harga') || 0;

    const currentYear = new Date().getFullYear();

    // Sales monthly trend
    const monthlySales = await Penjualan.findAll({
      attributes: [
        [sequelize.fn('MONTH', sequelize.col('tanggal')), 'month'],
        [sequelize.fn('SUM', sequelize.col('total_harga')), 'total']
      ],
      where: sequelize.where(sequelize.fn('YEAR', sequelize.col('tanggal')), currentYear),
      group: [sequelize.fn('MONTH', sequelize.col('tanggal'))],
      raw: true
    });

    // Purchase monthly trend
    const monthlyPurchases = await Pembelian.findAll({
      attributes: [
        [sequelize.fn('MONTH', sequelize.col('tanggal')), 'month'],
        [sequelize.fn('SUM', sequelize.col('total_harga')), 'total']
      ],
      where: sequelize.where(sequelize.fn('YEAR', sequelize.col('tanggal')), currentYear),
      group: [sequelize.fn('MONTH', sequelize.col('tanggal'))],
      raw: true
    });

    // Format chart data (12 months array)
    const chartSales = Array(12).fill(0);
    const chartPurchases = Array(12).fill(0);

    monthlySales.forEach(s => {
      const idx = parseInt(s.month || s['month'], 10) - 1;
      if (idx >= 0 && idx < 12) chartSales[idx] = parseFloat(s.total || s['total'] || 0);
    });

    monthlyPurchases.forEach(p => {
      const idx = parseInt(p.month || p['month'], 10) - 1;
      if (idx >= 0 && idx < 12) chartPurchases[idx] = parseFloat(p.total || p['total'] || 0);
    });

    return {
      total_users: totalUsers,
      total_umkm: totalUmkm,
      total_barang: totalBarang,
      total_supplier: totalSupplier,
      total_sales: totalSales,
      total_purchases: totalPurchases,
      chart_sales: chartSales,
      chart_purchases: chartPurchases
    };
  }

  /**
   * Get stats for specific UMKM owner
   */
  static async getUmkmStats(umkmId) {
    const totalUsers = await User.count({ where: { umkm_id: umkmId } }) || 0;
    const totalBarang = await Barang.count({ where: { umkm_id: umkmId } }) || 0;
    const totalSupplier = await Supplier.count({ where: { umkm_id: umkmId } }) || 0;

    const totalSales = await Penjualan.sum('total_harga', { where: { umkm_id: umkmId } }) || 0;
    const totalPurchases = await Pembelian.sum('total_harga', { where: { umkm_id: umkmId } }) || 0;

    const currentYear = new Date().getFullYear();

    // Sales trend
    const monthlySales = await Penjualan.findAll({
      attributes: [
        [sequelize.fn('MONTH', sequelize.col('tanggal')), 'month'],
        [sequelize.fn('SUM', sequelize.col('total_harga')), 'total']
      ],
      where: {
        umkm_id: umkmId,
        [Op.and]: sequelize.where(sequelize.fn('YEAR', sequelize.col('tanggal')), currentYear)
      },
      group: [sequelize.fn('MONTH', sequelize.col('tanggal'))],
      raw: true
    });

    // Purchase trend
    const monthlyPurchases = await Pembelian.findAll({
      attributes: [
        [sequelize.fn('MONTH', sequelize.col('tanggal')), 'month'],
        [sequelize.fn('SUM', sequelize.col('total_harga')), 'total']
      ],
      where: {
        umkm_id: umkmId,
        [Op.and]: sequelize.where(sequelize.fn('YEAR', sequelize.col('tanggal')), currentYear)
      },
      group: [sequelize.fn('MONTH', sequelize.col('tanggal'))],
      raw: true
    });

    const chartSales = Array(12).fill(0);
    const chartPurchases = Array(12).fill(0);

    monthlySales.forEach(s => {
      const idx = parseInt(s.month, 10) - 1;
      if (idx >= 0 && idx < 12) chartSales[idx] = parseFloat(s.total || 0);
    });

    monthlyPurchases.forEach(p => {
      const idx = parseInt(p.month, 10) - 1;
      if (idx >= 0 && idx < 12) chartPurchases[idx] = parseFloat(p.total || 0);
    });

    // Low stock warnings
    const lowStock = await Barang.findAll({
      where: {
        umkm_id: umkmId,
        stok: {
          [Op.lt]: 15
        }
      }
    });

    // Best Sellers (sold counts)
    const bestSellersRaw = await DetailPenjualan.findAll({
      attributes: [
        'barang_id',
        [sequelize.fn('SUM', sequelize.col('qty')), 'total_sold']
      ],
      include: [
        {
          model: Penjualan,
          as: 'penjualan',
          where: { umkm_id: umkmId },
          attributes: []
        },
        {
          model: Barang,
          as: 'barang',
          attributes: ['nama_barang', 'kode_barang', 'ukuran', 'satuan']
        }
      ],
      group: ['barang_id', 'barang.id'],
      order: [[sequelize.literal('total_sold'), 'DESC']],
      limit: 5
    });

    const best_sellers = bestSellersRaw.map(bs => ({
      barang_id: bs.barang_id,
      total_sold: parseInt(bs.getDataValue('total_sold') || 0, 10),
      barang: bs.barang
    }));

    return {
      total_users: totalUsers,
      total_barang: totalBarang,
      total_supplier: totalSupplier,
      total_sales: totalSales,
      total_purchases: totalPurchases,
      chart_sales: chartSales,
      chart_purchases: chartPurchases,
      low_stock: lowStock,
      best_sellers: best_sellers
    };
  }
}

export default DashboardService;
