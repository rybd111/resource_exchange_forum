const { Sequelize } = require('sequelize');
require('dotenv').config();

const { Sequelize } = require('sequelize');
require('dotenv').config();

// 根据环境变量选择数据库
const sequelize = new Sequelize({
  dialect: process.env.DB_DIALECT || 'postgres',
  host: process.env.DB_HOST || process.env.PGDATABASE ? 'localhost' : undefined,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || process.env.PGDATABASE,
  username: process.env.DB_USER || process.env.PGUSER,
  password: process.env.DB_PASSWORD || process.env.PGPASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: true
  }
});

// 测试连接
sequelize.authenticate()
  .then(() => console.log('✅ 数据库连接成功'))
  .catch(err => console.error('❌ 数据库连接失败:', err));

module.exports = sequelize;
