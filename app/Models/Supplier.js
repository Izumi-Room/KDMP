import { Model, DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

class Supplier extends Model {
  static associate(models) {
    Supplier.belongsTo(models.Umkm, { foreignKey: 'umkm_id', as: 'umkm' });
    Supplier.hasMany(models.Pembelian, { foreignKey: 'supplier_id', as: 'pembelians' });
  }
}

Supplier.init({
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  kode_supplier: {
    type: DataTypes.STRING,
    allowNull: false
  },
  nama_supplier: {
    type: DataTypes.STRING,
    allowNull: false
  },
  alamat: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  npwp: {
    type: DataTypes.STRING,
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
  modelName: 'Supplier',
  tableName: 'supplier'
});

export default Supplier;
