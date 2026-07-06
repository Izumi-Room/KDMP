'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('supplier', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      kode_supplier: {
        type: Sequelize.STRING,
        allowNull: false
      },
      nama_supplier: {
        type: Sequelize.STRING,
        allowNull: false
      },
      alamat: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      npwp: {
        type: Sequelize.STRING,
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
    await queryInterface.dropTable('supplier');
  }
};
