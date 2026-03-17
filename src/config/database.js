const { Sequelize } = require('sequelize');
require('dotenv').config();

// 环境变量优先级：Render自动注入 > 手动配置 > 默认值
const sequelize = new Sequelize(
  process.env.PGDATABASE || process.env.DB_NAME || 'resource_platform',
  process.env.PGUSER || process.env.DB_USER || 'postgres',
  process.env.PGPASSWORD || process.env.DB_PASSWORD || '',
  {
    host: process.env.PGHOST || process.env.DB_HOST || 'localhost',
    port: process.env.PGPORT || process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true
    }
  }
);

// 测试连接
sequelize.authenticate()
  .then(() => console.log('✅ 数据库连接成功'))
  .catch(err => console.error('❌ 数据库连接失败:', err));

module.exports = sequelize;
