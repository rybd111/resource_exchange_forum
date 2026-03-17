const { Sequelize } = require('sequelize');
require('dotenv').config();

// 解析 DATABASE_URL（Render提供的格式：postgres://user:pass@host:port/db）
let dbConfig = {};
if (process.env.DATABASE_URL) {
  const url = require('url');
  const parsed = url.parse(process.env.DATABASE_URL);
  dbConfig = {
    database: parsed.pathname.slice(1), // 去掉开头的 /
    username: parsed.auth.split(':')[0],
    password: parsed.auth.split(':')[1],
    host: parsed.hostname,
    port: parsed.port || 5432
  };
}

// 环境变量优先级：DATABASE_URL > 单独变量 > 默认值
const sequelize = new Sequelize(
  dbConfig.database || process.env.PGDATABASE || process.env.DB_NAME || 'resource_platform',
  dbConfig.username || process.env.PGUSER || process.env.DB_USER || 'postgres',
  dbConfig.password || process.env.PGPASSWORD || process.env.DB_PASSWORD || '',
  {
    host: dbConfig.host || process.env.PGHOST || process.env.DB_HOST || 'localhost',
    port: dbConfig.port || process.env.PGPORT || process.env.DB_PORT || 5432,
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
