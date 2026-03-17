const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

// 注册
router.post('/register', [
  body('username').isLength({ min: 3, max: 20 }).withMessage('用户名长度3-20字符'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6位'),
  body('phone').isMobilePhone('zh-CN').withMessage('请输入有效手机号'),
  body('realName').notEmpty().withMessage('请输入真实姓名')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { username, password, phone, realName, idCard, accountType, enterpriseName, enterpriseCode } = req.body;

    // 检查用户是否存在
    const existingUser = await User.findOne({
      where: { phone }
    });
    if (existingUser) {
      return res.status(400).json({ success: false, message: '该手机号已注册' });
    }

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(400).json({ success: false, message: '用户名已被使用' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const user = await User.create({
      username,
      password: hashedPassword,
      phone,
      realName,
      idCard: idCard ? idCard.slice(0, 6) + '********' + idCard.slice(14) : null, // 脱敏
      accountType: accountType || 'personal',
      enterpriseName: accountType === 'enterprise' ? enterpriseName : null,
      enterpriseCode: accountType === 'enterprise' ? enterpriseCode : null
    });

    // 生成Token
    const token = jwt.sign(
      { id: user.id, phone: user.phone },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          realName: user.realName,
          phone: user.phone,
          accountType: user.accountType,
          creditScore: user.creditScore,
          creditLevel: user.creditLevel
        }
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ success: false, message: '注册失败' });
  }
});

// 登录
router.post('/login', [
  body('phone').isMobilePhone('zh-CN').withMessage('请输入有效手机号'),
  body('password').notEmpty().withMessage('请输入密码')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { phone, password } = req.body;

    // 查找用户
    const user = await User.findOne({ where: { phone } });
    if (!user) {
      return res.status(401).json({ success: false, message: '手机号或密码错误' });
    }

    // 检查密码
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: '手机号或密码错误' });
    }

    // 检查账户状态
    if (user.status === 'banned') {
      return res.status(403).json({ success: false, message: '账户已被封禁' });
    }
    if (user.status === 'frozen') {
      return res.status(403).json({ success: false, message: '账户已被冻结' });
    }

    // 更新最后登录时间
    await user.update({ lastLoginAt: new Date() });

    // 生成Token
    const token = jwt.sign(
      { id: user.id, phone: user.phone },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          realName: user.realName,
          phone: user.phone,
          accountType: user.accountType,
          creditScore: user.creditScore,
          creditLevel: user.creditLevel,
          depositAmount: user.depositAmount,
          faceVerified: user.faceVerified,
          idVerified: user.idVerified
        }
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ success: false, message: '登录失败' });
  }
});

// 获取当前用户信息
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取用户信息失败' });
  }
});

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

module.exports = router;
module.exports.requireAuth = requireAuth;
