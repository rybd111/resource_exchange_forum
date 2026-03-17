const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const User = require('../models/User');
const Resource = require('../models/Resource');
const Cooperation = require('../models/Cooperation');
const DepositOrder = require('../models/DepositOrder');
const WithdrawalOrder = require('../models/WithdrawalOrder');
const jwt = require('jsonwebtoken');

// 管理员认证中间件
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '请先登录' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    
    // 查询用户信息
    const user = User.findOne({
      where: { id: decoded.id, role: 'admin' }
    });
    
    if (!user) {
      return res.status(403).json({ success: false, message: '无权限访问' });
    }
    
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token已失效' });
  }
}

// 获取统计数据
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const userCount = await User.count();
    const resourceCount = await Resource.count({ where: { status: 'published' } });
    const cooperationCount = await Cooperation.count({ where: { status: 'in_progress' } });
    const pendingDeposit = await DepositOrder.sum('amount', { where: { status: 'pending' } });
    const pendingWithdrawal = await WithdrawalOrder.sum('amount', { where: { status: 'pending' } });
    
    res.json({
      success: true,
      data: {
        users: userCount,
        resources: resourceCount,
        cooperations: cooperationCount,
        pendingDeposit: pendingDeposit || 0,
        pendingWithdrawal: pendingWithdrawal || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取用户列表
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, role } = req.query;
    const offset = (page - 1) * limit;
    
    const where = {};
    if (status) where.status = status;
    if (role) where.role = role;
    
    const { rows, count } = await User.findAndCountAll({
      where,
      attributes: ['id', 'username', 'realName', 'phone', 'accountType', 'creditScore', 'creditLevel', 'depositAmount', 'status', 'role', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      data: { rows, count }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 封号/解封用户
router.put('/users/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['active', 'frozen', 'banned'].includes(status)) {
      return res.status(400).json({ success: false, message: '无效的状态' });
    }
    
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: '无法操作管理员账号' });
    }
    
    await user.update({ status });
    
    res.json({ success: true, message: `用户状态已更新为${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 设置管理员
router.put('/users/:id/role', requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: '无效的角色' });
    }
    
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    await user.update({ role });
    
    res.json({ success: true, message: `用户角色已更新为${role}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取充值订单列表
router.get('/deposits', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;
    
    const where = status ? { status } : {};
    
    const { rows, count } = await DepositOrder.findAndCountAll({
      where,
      include: [{
        model: User,
        attributes: ['id', 'username', 'realName', 'phone']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({ success: true, data: { rows, count } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 审核充值
router.put('/deposits/:id/approve', requireAdmin, async (req, res) => {
  try {
    const { action, remark } = req.body;
    
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: '无效的操作' });
    }
    
    const order = await DepositOrder.findByPk(req.params.id);
    
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }
    
    if (order.status !== 'pending') {
      return res.status(400).json({ success: false, message: '订单已处理' });
    }
    
    await sequelize.transaction(async (t) => {
      if (action === 'approve') {
        // 增加用户保证金
        await User.increment('depositAmount', {
          by: order.amount,
          where: { id: order.userId },
          transaction: t
        });
        
        // 更新信誉分
        await User.increment('creditScore', {
          by: 10,
          where: { id: order.userId },
          transaction: t
        });
      }
      
      // 更新订单状态
      await order.update({
        status: action === 'approve' ? 'approved' : 'rejected',
        remark: remark || null,
        processedBy: req.admin.id,
        processedAt: new Date()
      }, { transaction: t });
    });
    
    res.json({ success: true, message: action === 'approve' ? '充值已通过' : '充值已拒绝' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取退款/提现订单列表
router.get('/withdrawals', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, reason } = req.query;
    const offset = (page - 1) * limit;
    
    const where = {};
    if (status) where.status = status;
    if (reason) where.reason = reason;
    
    const { rows, count } = await WithdrawalOrder.findAndCountAll({
      where,
      include: [{
        model: User,
        attributes: ['id', 'username', 'realName', 'phone']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({ success: true, data: { rows, count } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 处理退款/提现
router.put('/withdrawals/:id/approve', requireAdmin, async (req, res) => {
  try {
    const { action, remark } = req.body;
    
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: '无效的操作' });
    }
    
    const order = await WithdrawalOrder.findByPk(req.params.id);
    
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }
    
    if (order.status !== 'pending') {
      return res.status(400).json({ success: false, message: '订单已处理' });
    }
    
    await sequelize.transaction(async (t) => {
      if (action === 'approve') {
        // 扣除用户保证金
        const user = await User.findByPk(order.userId, { transaction: t });
        
        if (user.depositAmount < order.amount) {
          throw new Error('用户保证金不足');
        }
        
        await user.decrement('depositAmount', {
          by: order.amount,
          transaction: t
        });
      }
      
      // 更新订单状态
      await order.update({
        status: action === 'approve' ? 'approved' : 'rejected',
        remark: remark || null,
        processedBy: req.admin.id,
        processedAt: new Date()
      }, { transaction: t });
    });
    
    res.json({ success: true, message: action === 'approve' ? '退款已通过' : '退款已拒绝' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 初始化管理员账号（通过环境变量）
router.post('/init', async (req, res) => {
  try {
    const { username, password, phone } = req.body;
    
    // 检查是否已存在管理员
    const existingAdmin = await User.findOne({ where: { role: 'admin' } });
    if (existingAdmin) {
      return res.status(400).json({ success: false, message: '管理员已存在' });
    }
    
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await User.create({
      username,
      password: hashedPassword,
      phone,
      realName: '系统管理员',
      role: 'admin',
      creditScore: 1000,
      creditLevel: 'AAA',
      status: 'active'
    });
    
    res.json({ success: true, message: '管理员账号创建成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
