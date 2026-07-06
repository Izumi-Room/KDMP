'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('pembelian', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      no_faktur: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      tanggal: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      supplier_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'supplier',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      total_harga: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      umkm_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'umkms',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('pembelian');
  }
};
