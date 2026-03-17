const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const DepositOrder = require('../models/DepositOrder');
const WithdrawalOrder = require('../models/WithdrawalOrder');
const User = require('../models/User');
const Cooperation = require('../models/Cooperation');
const jwt = require('jsonwebtoken');

// 中间件：验证Token
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '请先登录' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token已失效' });
  }
}

// 充值订单列表
router.get('/deposits', requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;
    
    const where = {
      userId: req.user.id
    };
    
    if (status) {
      where.status = status;
    }
    
    const { rows, count } = await DepositOrder.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({ success: true, data: { rows, count } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 创建充值订单
router.post('/deposit', requireAuth, async (req, res) => {
  try {
    const { amount, paymentMethod, remark } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: '充值金额必须大于0' });
    }
    
    if (amount > 10000) {
      return res.status(400).json({ success: false, message: '单次充值金额不能超过10000元' });
    }
    
    if (!['wechat', 'alipay', 'bank', 'manual'].includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: '无效的支付方式' });
    }
    
    // 生成订单号
    const orderNo = 'DEP' + Date.now() + Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const order = await DepositOrder.create({
      userId: req.user.id,
      orderNo,
      amount,
      paymentMethod,
      status: 'pending',
      remark
    });
    
    res.status(201).json({
      success: true,
      message: '充值订单创建成功，等待管理员审核',
      data: order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 退款/提现订单列表
router.get('/withdrawals', requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, reason } = req.query;
    const offset = (page - 1) * limit;
    
    const where = {
      userId: req.user.id
    };
    
    if (status) {
      where.status = status;
    }
    
    if (reason) {
      where.reason = reason;
    }
    
    const { rows, count } = await WithdrawalOrder.findAndCountAll({
      where,
      include: [{
        model: Cooperation,
        attributes: ['id', 'title']
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

// 申请退款
router.post('/refund/:cooperationId', requireAuth, async (req, res) => {
  try {
    const { cooperationId } = req.params;
    const { amount, reason, remark } = req.body;
    
    // 查询合作订单
    const cooperation = await Cooperation.findOne({
      where: { id: cooperationId }
    });
    
    if (!cooperation) {
      return res.status(404).json({ success: false, message: '合作订单不存在' });
    }
    
    if (cooperation.userId !== req.user.id && cooperation.partnerId !== req.user.id) {
      return res.status(403).json({ success: false, message: '无权限操作此订单' });
    }
    
    if (cooperation.status === 'completed') {
      return res.status(400).json({ success: false, message: '已完成的订单无法退款' });
    }
    
    // 生成订单号
    const orderNo = 'REF' + Date.now() + Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const order = await WithdrawalOrder.create({
      userId: req.user.id,
      orderNo,
      amount: amount || cooperation.totalAmount,
      withdrawalMethod: 'manual',
      reason: 'refund',
      cooperationId,
      status: 'pending',
      remark
    });
    
    res.status(201).json({
      success: true,
      message: '退款申请已提交，等待管理员审核',
      data: order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 申请提现
router.post('/withdraw', requireAuth, async (req, res) => {
  try {
    const { amount, withdrawalMethod, accountInfo, remark } = req.body;
    
    // 查询用户余额
    const user = await User.findByPk(req.user.id);
    
    if (user.depositAmount < amount) {
      return res.status(400).json({ success: false, message: '保证金余额不足' });
    }
    
    if (amount > 5000) {
      return res.status(400).json({ success: false, message: '单次提现金额不能超过5000元' });
    }
    
    if (!['wechat', 'alipay', 'bank'].includes(withdrawalMethod)) {
      return res.status(400).json({ success: false, message: '无效的提现方式' });
    }
    
    // 生成订单号
    const orderNo = 'WTH' + Date.now() + Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const order = await WithdrawalOrder.create({
      userId: req.user.id,
      orderNo,
      amount,
      withdrawalMethod,
      accountInfo,
      reason: 'user_request',
      status: 'pending',
      remark
    });
    
    res.status(201).json({
      success: true,
      message: '提现申请已提交，等待管理员审核',
      data: order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
module.exports.requireAuth = requireAuth;
