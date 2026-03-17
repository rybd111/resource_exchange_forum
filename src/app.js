require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// 引入模型和数据库
const sequelize = require('./config/database');
const User = require('./models/User');
const Resource = require('./models/Resource');
const Cooperation = require('./models/Cooperation');
const Comment = require('./models/Comment');
const Violation = require('./models/Violation');
const DepositOrder = require('./models/DepositOrder');
const WithdrawalOrder = require('./models/WithdrawalOrder');

// 引入路由
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const resourceRoutes = require('./routes/resource');
const cooperationRoutes = require('./routes/cooperation');
const messageRoutes = require('./routes/message');
const adminRoutes = require('./routes/admin');
const commentRoutes = require('./routes/comment');
const financeRoutes = require('./routes/finance');

// 建立模型关联
User.hasMany(Resource, { foreignKey: 'userId', as: 'resources' });
Resource.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Resource.hasMany(Comment, { foreignKey: 'resourceId', as: 'comments' });
Comment.belongsTo(Resource, { foreignKey: 'resourceId', as: 'resource' });

Comment.hasMany(Comment, { foreignKey: 'parentId', as: 'replies' });
Comment.belongsTo(Comment, { foreignKey: 'parentId', as: 'parent' });

User.hasMany(Violation, { foreignKey: 'userId', as: 'violations' });
Violation.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(DepositOrder, { foreignKey: 'userId', as: 'depositOrders' });
DepositOrder.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(WithdrawalOrder, { foreignKey: 'userId', as: 'withdrawalOrders' });
WithdrawalOrder.belongsTo(User, { foreignKey: 'userId', as: 'user' });

WithdrawalOrder.belongsTo(Cooperation, { foreignKey: 'cooperationId', as: 'cooperation' });

const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 静态文件
app.use(express.static(path.join(__dirname, '../public')));

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/cooperation', cooperationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/finance', financeRoutes);

// 首页 - 未登录显示引流页，登录后显示论坛
app.get('/', (req, res) => {
  const authHeader = req.headers.authorization;
  const hasToken = authHeader && authHeader.startsWith('Bearer ');
  
  if (hasToken) {
    // 已登录，显示论坛
    res.sendFile(path.join(__dirname, '../public/forum.html'));
  } else {
    // 未登录，显示引流页
    res.sendFile(path.join(__dirname, '../public/landing.html'));
  }
});

// 登录页
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/landing.html'));
});

// 注册页
app.get('/register.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/landing.html'));
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ success: false, message: '路由不存在' });
});

// 同步数据库表（生产环境使用 migrate）
const syncDatabase = async () => {
  try {
    if (process.env.NODE_ENV === 'production') {
      // 生产环境：只创建不存在的表，不删除
      await sequelize.sync();
      console.log('✅ 数据库表同步完成');
    } else {
      // 开发环境：创建表
      await sequelize.sync({ alter: true });
      console.log('✅ 数据库表同步完成（开发模式）');
    }
  } catch (error) {
    console.error('❌ 数据库表同步失败:', error);
  }
};

const PORT = process.env.PORT || 3000;

// 启动服务器
const startServer = async () => {
  // 先同步数据库表
  await syncDatabase();
  
  // 再启动服务器
  app.listen(PORT, () => {
    console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  });
};

startServer();

module.exports = app;
