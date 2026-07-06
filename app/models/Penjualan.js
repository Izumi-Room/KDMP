import { Model, DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

class Penjualan extends Model {
  static associate(models) {
    Penjualan.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    Penjualan.belongsTo(models.Umkm, { foreignKey: 'umkm_id', as: 'umkm' });
    Penjualan.hasMany(models.DetailPenjualan, { foreignKey: 'penjualan_id', as: 'details' });
  }
}

Penjualan.init({
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  no_faktur: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  tanggal: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  total_harga: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  bayar: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  kembali: {
    type: DataTypes.BIGINT,
    allowNull: true
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
  modelName: 'Penjualan',
  tableName: 'penjualan'
});

export default Penjualan;
