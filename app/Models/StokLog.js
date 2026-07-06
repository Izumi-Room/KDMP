import { Model, DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

class StokLog extends Model {
  static associate(models) {
    StokLog.belongsTo(models.Barang, { foreignKey: 'barang_id', as: 'barang' });
  }
}

StokLog.init({
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  barang_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'barang',
      key: 'id'
    }
  },
  tipe: {
    type: DataTypes.ENUM('masuk', 'keluar'),
    allowNull: false
  },
  qty: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  keterangan: {
    type: DataTypes.STRING,
    allowNull: false
  },
  tanggal: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'StokLog',
  tableName: 'stok_log'
});

export default StokLog;
