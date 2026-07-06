'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('barang', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      kode_barang: {
        type: Sequelize.STRING,
        allowNull: false
      },
      nama_barang: {
        type: Sequelize.STRING,
        allowNull: false
      },
      ukuran: {
        type: Sequelize.STRING,
        allowNull: true
      },
      stok: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      satuan: {
        type: Sequelize.STRING,
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
    await queryInterface.dropTable('barang');
  }
};
