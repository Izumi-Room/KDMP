'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // 1. Insert Roles
    await queryInterface.bulkInsert('roles', [
      { id: 1, name: 'Admin System', slug: 'admin_system', created_at: now, updated_at: now },
      { id: 2, name: 'Admin UMKM', slug: 'admin_umkm', created_at: now, updated_at: now },
      { id: 3, name: 'Pegawai Penjualan', slug: 'pegawai_penjualan', created_at: now, updated_at: now },
      { id: 4, name: 'Pegawai Pembelian', slug: 'pegawai_pembelian', created_at: now, updated_at: now }
    ], {});

    // 2. Insert default UMKM
    await queryInterface.bulkInsert('umkms', [
      {
        id: 1,
        nama_umkm: 'Warung Maju Utama',
        alamat: 'Jl. Merdeka No. 45, Tanjungpinang',
        telepon: '081234567890',
        created_at: now,
        updated_at: now
      }
    ], {});

    // Hash Password "password"
    const passwordHash = bcrypt.hashSync('password', 10);

    // 3. Insert Users
    await queryInterface.bulkInsert('users', [
      {
        id: 1,
        username: 'admin',
        name: 'Admin System',
        email: 'admin@aiwarung.com',
        password: passwordHash,
        role_id: 1,
        status: true,
        umkm_id: null,
        created_at: now,
        updated_at: now
      },
      {
        id: 2,
        username: 'umkm_admin',
        name: 'Admin UMKM Warung Maju',
        email: 'owner@warungmaju.com',
        password: passwordHash,
        role_id: 2,
        status: true,
        umkm_id: 1,
        created_at: now,
        updated_at: now
      },
      {
        id: 3,
        username: 'kasir',
        name: 'Budi Kasir',
        email: 'budi@warungmaju.com',
        password: passwordHash,
        role_id: 3,
        status: true,
        umkm_id: 1,
        created_at: now,
        updated_at: now
      },
      {
        id: 4,
        username: 'pembeli',
        name: 'Siti Pembeli',
        email: 'siti@warungmaju.com',
        password: passwordHash,
        role_id: 4,
        status: true,
        umkm_id: 1,
        created_at: now,
        updated_at: now
      }
    ], {});

    // 4. Insert Suppliers
    await queryInterface.bulkInsert('supplier', [
      {
        id: 1,
        kode_supplier: 'SPL-001',
        nama_supplier: 'PT. Sembako Nusantara',
        alamat: 'Kawasan Industri Kabil, Batam',
        npwp: '12.345.678.9-012.000',
        umkm_id: 1,
        created_at: now,
        updated_at: now
      },
      {
        id: 2,
        kode_supplier: 'SPL-002',
        nama_supplier: 'CV. Plastik Sejahtera',
        alamat: 'Bintan Centre, Tanjungpinang',
        npwp: '98.765.432.1-987.000',
        umkm_id: 1,
        created_at: now,
        updated_at: now
      }
    ], {});

    // 5. Insert Items (Barang)
    await queryInterface.bulkInsert('barang', [
      {
        id: 1,
        kode_barang: 'BRG-001',
        nama_barang: 'Beras Premium',
        ukuran: '5kg',
        stok: 50,
        satuan: 'Karung',
        umkm_id: 1,
        created_at: now,
        updated_at: now
      },
      {
        id: 2,
        kode_barang: 'BRG-002',
        nama_barang: 'Minyak Goreng Kita',
        ukuran: '2L',
        stok: 100,
        satuan: 'Pouch',
        umkm_id: 1,
        created_at: now,
        updated_at: now
      },
      {
        id: 3,
        kode_barang: 'BRG-003',
        nama_barang: 'Gula Pasir Lokal',
        ukuran: '1kg',
        stok: 75,
        satuan: 'Pcs',
        umkm_id: 1,
        created_at: now,
        updated_at: now
      },
      {
        id: 4,
        kode_barang: 'BRG-004',
        nama_barang: 'Kopi Robusta Bubuk',
        ukuran: '250g',
        stok: 10,
        satuan: 'Pcs',
        umkm_id: 1,
        created_at: now,
        updated_at: now
      }
    ], {});

    // 6. Log Initial stock logs
    await queryInterface.bulkInsert('stok_log', [
      { id: 1, barang_id: 1, tipe: 'masuk', qty: 50, keterangan: 'Input Awal Barang', tanggal: now, created_at: now, updated_at: now },
      { id: 2, barang_id: 2, tipe: 'masuk', qty: 100, keterangan: 'Input Awal Barang', tanggal: now, created_at: now, updated_at: now },
      { id: 3, barang_id: 3, tipe: 'masuk', qty: 75, keterangan: 'Input Awal Barang', tanggal: now, created_at: now, updated_at: now },
      { id: 4, barang_id: 4, tipe: 'masuk', qty: 10, keterangan: 'Input Awal Barang', tanggal: now, created_at: now, updated_at: now }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('stok_log', null, {});
    await queryInterface.bulkDelete('barang', null, {});
    await queryInterface.bulkDelete('supplier', null, {});
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('umkms', null, {});
    await queryInterface.bulkDelete('roles', null, {});
  }
};
