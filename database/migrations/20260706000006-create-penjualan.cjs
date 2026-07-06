'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('penjualan', {
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
      bayar: {
        type: Sequelize.BIGINT,
        allowNull: true
      },
      kembali: {
        type: Sequelize.BIGINT,
        allowNull: true
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
    await queryInterface.dropTable('penjualan');
  }
};
