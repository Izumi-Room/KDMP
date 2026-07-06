-- SQL Script for AIWarungDB
-- Complete PKM Compliance Database Script

CREATE DATABASE IF NOT EXISTS `AIWarungDB` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `AIWarungDB`;

-- Disable foreign key checks to prevent drop/create order issues
SET FOREIGN_KEY_CHECKS = 0;

-- 1. DROP TABLES IF EXIST
DROP TABLE IF EXISTS `stok_log`;
DROP TABLE IF EXISTS `detail_pembelian`;
DROP TABLE IF EXISTS `pembelian`;
DROP TABLE IF EXISTS `detail_penjualan`;
DROP TABLE IF EXISTS `penjualan`;
DROP TABLE IF EXISTS `supplier`;
DROP TABLE IF EXISTS `barang`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `umkms`;
DROP TABLE IF EXISTS `roles`;
DROP TABLE IF EXISTS `sessions`;

SET FOREIGN_KEY_CHECKS = 1;

-- 2. CREATE TABLE roles
CREATE TABLE `roles` (
  `id` BIGINT AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_slug_unique` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. CREATE TABLE umkms
CREATE TABLE `umkms` (
  `id` BIGINT AUTO_INCREMENT,
  `nama_umkm` VARCHAR(255) NOT NULL,
  `alamat` TEXT DEFAULT NULL,
  `telepon` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. CREATE TABLE users
CREATE TABLE `users` (
  `id` BIGINT AUTO_INCREMENT,
  `username` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role_id` BIGINT NOT NULL,
  `status` TINYINT(1) DEFAULT 1,
  `umkm_id` BIGINT DEFAULT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_username_unique` (`username`),
  CONSTRAINT `users_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `users_umkm_id_foreign` FOREIGN KEY (`umkm_id`) REFERENCES `umkms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. CREATE TABLE barang
CREATE TABLE `barang` (
  `id` BIGINT AUTO_INCREMENT,
  `kode_barang` VARCHAR(255) NOT NULL,
  `nama_barang` VARCHAR(255) NOT NULL,
  `ukuran` VARCHAR(255) DEFAULT NULL,
  `stok` INT DEFAULT 0,
  `satuan` VARCHAR(255) NOT NULL,
  `umkm_id` BIGINT NOT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `barang_umkm_id_foreign` FOREIGN KEY (`umkm_id`) REFERENCES `umkms` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `barang_kode_umkm_unique` (`kode_barang`, `umkm_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. CREATE TABLE supplier
CREATE TABLE `supplier` (
  `id` BIGINT AUTO_INCREMENT,
  `kode_supplier` VARCHAR(255) NOT NULL,
  `nama_supplier` VARCHAR(255) NOT NULL,
  `alamat` TEXT DEFAULT NULL,
  `npwp` VARCHAR(255) DEFAULT NULL,
  `umkm_id` BIGINT NOT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `supplier_umkm_id_foreign` FOREIGN KEY (`umkm_id`) REFERENCES `umkms` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `supplier_kode_umkm_unique` (`kode_supplier`, `umkm_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. CREATE TABLE penjualan
CREATE TABLE `penjualan` (
  `id` BIGINT AUTO_INCREMENT,
  `no_faktur` VARCHAR(255) NOT NULL,
  `tanggal` DATE NOT NULL,
  `user_id` BIGINT NOT NULL,
  `total_harga` BIGINT NOT NULL,
  `bayar` BIGINT DEFAULT NULL,
  `kembali` BIGINT DEFAULT NULL,
  `umkm_id` BIGINT NOT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `penjualan_no_faktur_unique` (`no_faktur`),
  CONSTRAINT `penjualan_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `penjualan_umkm_id_foreign` FOREIGN KEY (`umkm_id`) REFERENCES `umkms` (`id`) ON DELETE CASCADE,
  KEY `penjualan_tanggal_index` (`tanggal`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. CREATE TABLE detail_penjualan
CREATE TABLE `detail_penjualan` (
  `id` BIGINT AUTO_INCREMENT,
  `penjualan_id` BIGINT NOT NULL,
  `barang_id` BIGINT NOT NULL,
  `qty` INT NOT NULL,
  `harga_satuan` BIGINT NOT NULL,
  `subtotal` BIGINT NOT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `detail_penjualan_penjualan_id_foreign` FOREIGN KEY (`penjualan_id`) REFERENCES `penjualan` (`id`) ON DELETE CASCADE,
  CONSTRAINT `detail_penjualan_barang_id_foreign` FOREIGN KEY (`barang_id`) REFERENCES `barang` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. CREATE TABLE pembelian
CREATE TABLE `pembelian` (
  `id` BIGINT AUTO_INCREMENT,
  `no_faktur` VARCHAR(255) NOT NULL,
  `tanggal` DATE NOT NULL,
  `supplier_id` BIGINT NOT NULL,
  `user_id` BIGINT NOT NULL,
  `total_harga` BIGINT NOT NULL,
  `umkm_id` BIGINT NOT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `pembelian_no_faktur_unique` (`no_faktur`),
  CONSTRAINT `pembelian_supplier_id_foreign` FOREIGN KEY (`supplier_id`) REFERENCES `supplier` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pembelian_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pembelian_umkm_id_foreign` FOREIGN KEY (`umkm_id`) REFERENCES `umkms` (`id`) ON DELETE CASCADE,
  KEY `pembelian_tanggal_index` (`tanggal`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. CREATE TABLE detail_pembelian
CREATE TABLE `detail_pembelian` (
  `id` BIGINT AUTO_INCREMENT,
  `pembelian_id` BIGINT NOT NULL,
  `barang_id` BIGINT NOT NULL,
  `qty` INT NOT NULL,
  `harga_satuan` BIGINT NOT NULL,
  `subtotal` BIGINT NOT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `detail_pembelian_pembelian_id_foreign` FOREIGN KEY (`pembelian_id`) REFERENCES `pembelian` (`id`) ON DELETE CASCADE,
  CONSTRAINT `detail_pembelian_barang_id_foreign` FOREIGN KEY (`barang_id`) REFERENCES `barang` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. CREATE TABLE stok_log
CREATE TABLE `stok_log` (
  `id` BIGINT AUTO_INCREMENT,
  `barang_id` BIGINT NOT NULL,
  `tipe` ENUM('masuk', 'keluar') NOT NULL,
  `qty` INT NOT NULL,
  `keterangan` VARCHAR(255) NOT NULL,
  `tanggal` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `stok_log_barang_id_foreign` FOREIGN KEY (`barang_id`) REFERENCES `barang` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. CREATE TABLE sessions
CREATE TABLE `sessions` (
  `sid` VARCHAR(36) NOT NULL,
  `expires` DATETIME DEFAULT NULL,
  `data` TEXT DEFAULT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`sid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. SEED INITIAL DATA
SET @now = NOW();

-- Roles
INSERT INTO `roles` (`id`, `name`, `slug`, `created_at`, `updated_at`) VALUES
(1, 'Admin System', 'admin_system', @now, @now),
(2, 'Admin UMKM', 'admin_umkm', @now, @now),
(3, 'Pegawai Penjualan', 'pegawai_penjualan', @now, @now),
(4, 'Pegawai Pembelian', 'pegawai_pembelian', @now, @now);

-- UMKM
INSERT INTO `umkms` (`id`, `nama_umkm`, `alamat`, `telepon`, `created_at`, `updated_at`) VALUES
(1, 'Warung Maju Utama', 'Jl. Merdeka No. 45, Tanjungpinang', '081234567890', @now, @now);

-- Users (Default password is 'password', hashed using bcrypt)
INSERT INTO `users` (`id`, `username`, `name`, `email`, `password`, `role_id`, `status`, `umkm_id`, `created_at`, `updated_at`) VALUES
(1, 'admin', 'Admin System', 'admin@aiwarung.com', '$2a$10$/iGtTydPY1S0imHwUYrlLe8FdgDB9Q5FareJpiraAfQ8GDk4ADWAG', 1, 1, NULL, @now, @now),
(2, 'umkm_admin', 'Admin UMKM Warung Maju', 'owner@warungmaju.com', '$2a$10$/iGtTydPY1S0imHwUYrlLe8FdgDB9Q5FareJpiraAfQ8GDk4ADWAG', 2, 1, 1, @now, @now),
(3, 'kasir', 'Budi Kasir', 'budi@warungmaju.com', '$2a$10$/iGtTydPY1S0imHwUYrlLe8FdgDB9Q5FareJpiraAfQ8GDk4ADWAG', 3, 1, 1, @now, @now),
(4, 'pembeli', 'Siti Pembeli', 'siti@warungmaju.com', '$2a$10$/iGtTydPY1S0imHwUYrlLe8FdgDB9Q5FareJpiraAfQ8GDk4ADWAG', 4, 1, 1, @now, @now);

-- Suppliers
INSERT INTO `supplier` (`id`, `kode_supplier`, `nama_supplier`, `alamat`, `npwp`, `umkm_id`, `created_at`, `updated_at`) VALUES
(1, 'SPL-001', 'PT. Sembako Nusantara', 'Kawasan Industri Kabil, Batam', '12.345.678.9-012.000', 1, @now, @now),
(2, 'SPL-002', 'CV. Plastik Sejahtera', 'Bintan Centre, Tanjungpinang', '98.765.432.1-987.000', 1, @now, @now);

-- Barang
INSERT INTO `barang` (`id`, `kode_barang`, `nama_barang`, `ukuran`, `stok`, `satuan`, `umkm_id`, `created_at`, `updated_at`) VALUES
(1, 'BRG-001', 'Beras Premium', '5kg', 50, 'Karung', 1, @now, @now),
(2, 'BRG-002', 'Minyak Goreng Kita', '2L', 100, 'Pouch', 1, @now, @now),
(3, 'BRG-003', 'Gula Pasir Lokal', '1kg', 75, 'Pcs', 1, @now, @now),
(4, 'BRG-004', 'Kopi Robusta Bubuk', '250g', 10, 'Pcs', 1, @now, @now);

-- Stok Logs
INSERT INTO `stok_log` (`id`, `barang_id`, `tipe`, `qty`, `keterangan`, `tanggal`, `created_at`, `updated_at`) VALUES
(1, 1, 'masuk', 50, 'Input Awal Barang', @now, @now, @now),
(2, 2, 'masuk', 100, 'Input Awal Barang', @now, @now, @now),
(3, 3, 'masuk', 75, 'Input Awal Barang', @now, @now, @now),
(4, 4, 'masuk', 10, 'Input Awal Barang', @now, @now, @now);
