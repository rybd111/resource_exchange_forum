require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// 引入路由
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const resourceRoutes = require('./routes/resource');
const cooperationRoutes = require('./routes/cooperation');
const messageRoutes = require('./routes/message');
const adminRoutes = require('./routes/admin');

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

// 首页
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
});

module.exports = app;
