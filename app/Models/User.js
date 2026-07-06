import { Model, DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

class User extends Model {
  static associate(models) {
    User.belongsTo(models.Role, { foreignKey: 'role_id', as: 'role' });
    User.belongsTo(models.Umkm, { foreignKey: 'umkm_id', as: 'umkm' });
    User.hasMany(models.Penjualan, { foreignKey: 'user_id', as: 'penjualans' });
    User.hasMany(models.Pembelian, { foreignKey: 'user_id', as: 'pembelians' });
  }
}

User.init({
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'roles',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  umkm_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'umkms',
      key: 'id'
    }
  }
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users'
});

export default User;
