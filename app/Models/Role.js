import { Model, DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

class Role extends Model {
  static associate(models) {
    Role.hasMany(models.User, { foreignKey: 'role_id', as: 'users' });
  }
}

Role.init({
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  }
}, {
  sequelize,
  modelName: 'Role',
  tableName: 'roles'
});

export default Role;
