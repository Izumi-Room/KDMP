import { Model, DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

class Barang extends Model {
  static associate(models) {
    Barang.belongsTo(models.Umkm, { foreignKey: 'umkm_id', as: 'umkm' });
    Barang.hasMany(models.DetailPenjualan, { foreignKey: 'barang_id', as: 'detailsPenjualan' });
    Barang.hasMany(models.DetailPembelian, { foreignKey: 'barang_id', as: 'detailsPembelian' });
    Barang.hasMany(models.StokLog, { foreignKey: 'barang_id', as: 'stokLogs' });
  }
}

Barang.init({
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  kode_barang: {
    type: DataTypes.STRING,
    allowNull: false
  },
  nama_barang: {
    type: DataTypes.STRING,
    allowNull: false
  },
  ukuran: {
    type: DataTypes.STRING,
    allowNull: true
  },
  stok: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  satuan: {
    type: DataTypes.STRING,
    allowNull: false
  },
  umkm_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'umkms',
      key: 'id'
    }
  }
}, {
  sequelize,
  modelName: 'Barang',
  tableName: 'barang'
});

export default Barang;
