import { Model, DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

class Pembelian extends Model {
  static associate(models) {
    Pembelian.belongsTo(models.Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
    Pembelian.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    Pembelian.belongsTo(models.Umkm, { foreignKey: 'umkm_id', as: 'umkm' });
    Pembelian.hasMany(models.DetailPembelian, { foreignKey: 'pembelian_id', as: 'details' });
  }
}

Pembelian.init({
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
  supplier_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'supplier',
      key: 'id'
    }
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
  modelName: 'Pembelian',
  tableName: 'pembelian'
});

export default Pembelian;
