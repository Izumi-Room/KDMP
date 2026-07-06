'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add unique constraint for kode_barang + umkm_id
    await queryInterface.addIndex('barang', ['kode_barang', 'umkm_id'], {
      unique: true,
      name: 'barang_kode_umkm_unique'
    });

    // 2. Add unique constraint for kode_supplier + umkm_id
    await queryInterface.addIndex('supplier', ['kode_supplier', 'umkm_id'], {
      unique: true,
      name: 'supplier_kode_umkm_unique'
    });

    // 3. Add index on tanggal for penjualan to optimize report queries
    await queryInterface.addIndex('penjualan', ['tanggal'], {
      name: 'penjualan_tanggal_index'
    });

    // 4. Add index on tanggal for pembelian to optimize report queries
    await queryInterface.addIndex('pembelian', ['tanggal'], {
      name: 'pembelian_tanggal_index'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('barang', 'barang_kode_umkm_unique');
    await queryInterface.removeIndex('supplier', 'supplier_kode_umkm_unique');
    await queryInterface.removeIndex('penjualan', 'penjualan_tanggal_index');
    await queryInterface.removeIndex('pembelian', 'pembelian_tanggal_index');
  }
};
