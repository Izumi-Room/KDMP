import { Model, DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

class Umkm extends Model {
  static associate(models) {
    Umkm.hasMany(models.User, { foreignKey: 'umkm_id', as: 'users' });
    Umkm.hasMany(models.Barang, { foreignKey: 'umkm_id', as: 'barangs' });
    Umkm.hasMany(models.Supplier, { foreignKey: 'umkm_id', as: 'suppliers' });
    Umkm.hasMany(models.Penjualan, { foreignKey: 'umkm_id', as: 'penjualans' });
    Umkm.hasMany(models.Pembelian, { foreignKey: 'umkm_id', as: 'pembelians' });
  }
}

Umkm.init({
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  nama_umkm: {
    type: DataTypes.STRING,
    allowNull: false
  },
  alamat: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  telepon: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Umkm',
  tableName: 'umkms'
});

export default Umkm;
