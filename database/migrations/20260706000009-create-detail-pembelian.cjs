'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('detail_pembelian', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      pembelian_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'pembelian',
          key: 'id'
        },
        onDelete: 'CASCADE'
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
      qty: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      harga_satuan: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      subtotal: {
        type: Sequelize.BIGINT,
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
    await queryInterface.dropTable('detail_pembelian');
  }
};
