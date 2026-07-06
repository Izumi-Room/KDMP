import sequelize from '../../config/database.js';
import Role from './Role.js';
import Umkm from './Umkm.js';
import User from './User.js';
import Barang from './Barang.js';
import Supplier from './Supplier.js';
import Penjualan from './Penjualan.js';
import DetailPenjualan from './DetailPenjualan.js';
import Pembelian from './Pembelian.js';
import DetailPembelian from './DetailPembelian.js';
import StokLog from './StokLog.js';

const models = {
  Role,
  Umkm,
  User,
  Barang,
  Supplier,
  Penjualan,
  DetailPenjualan,
  Pembelian,
  DetailPembelian,
  StokLog
};

// Associate all models
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

export {
  sequelize,
  Role,
  Umkm,
  User,
  Barang,
  Supplier,
  Penjualan,
  DetailPenjualan,
  Pembelian,
  DetailPembelian,
  StokLog
};

export default models;
