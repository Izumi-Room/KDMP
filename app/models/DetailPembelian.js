import { Model, DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

class DetailPembelian extends Model {
  static associate(models) {
    DetailPembelian.belongsTo(models.Pembelian, { foreignKey: 'pembelian_id', as: 'pembelian' });
    DetailPembelian.belongsTo(models.Barang, { foreignKey: 'barang_id', as: 'barang' });
  }
}

DetailPembelian.init({
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  pembelian_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'pembelian',
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
  modelName: 'DetailPembelian',
  tableName: 'detail_pembelian'
});

export default DetailPembelian;
