require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USERNAME || 'bossKDMP',
    password: process.env.DB_PASSWORD || 'FTtkUMrah',
    database: process.env.DB_DATABASE || 'AIWarungDB',
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    dialect: 'mysql',
    logging: false
  },
  test: {
    username: process.env.DB_USERNAME || 'bossKDMP',
    password: process.env.DB_PASSWORD || 'FTtkUMrah',
    database: process.env.DB_DATABASE || 'AIWarungDB_test',
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    dialect: 'mysql',
    logging: false
  },
  production: {
    username: process.env.DB_USERNAME || 'bossKDMP',
    password: process.env.DB_PASSWORD || 'FTtkUMrah',
    database: process.env.DB_DATABASE || 'AIWarungDB',
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    dialect: 'mysql',
    logging: false
  }
};
