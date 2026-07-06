'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('stok_log', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      barang_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'barang',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      tipe: {
        type: Sequelize.ENUM('masuk', 'keluar'),
        allowNull: false
      },
      qty: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      keterangan: {
        type: Sequelize.STRING,
        allowNull: false
      },
      tanggal: {
        type: Sequelize.DATE,
        allowNull: false
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
    await queryInterface.dropTable('stok_log');
  }
};
