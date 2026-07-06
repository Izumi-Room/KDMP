import { Model, DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

class DetailPenjualan extends Model {
  static associate(models) {
    DetailPenjualan.belongsTo(models.Penjualan, { foreignKey: 'penjualan_id', as: 'penjualan' });
    DetailPenjualan.belongsTo(models.Barang, { foreignKey: 'barang_id', as: 'barang' });
  }
}

DetailPenjualan.init({
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  penjualan_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'penjualan',
      key: 'id'
    }
  },
  barang_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'barang',
      key: 'id'
    }
  },
  qty: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  harga_satuan: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  subtotal: {
    type: DataTypes.BIGINT,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'DetailPenjualan',
  tableName: 'detail_penjualan'
});

export default DetailPenjualan;
