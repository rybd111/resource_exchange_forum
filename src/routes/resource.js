const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Resource = require('../models/Resource');
const User = require('../models/User');

// 获取资源列表
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      status = 'published',
      visibility = 'public',
      search 
    } = req.query;
    
    const where = { status };
    
    if (visibility) {
      where[Op.or] = [
        { visibility },
        { visibility: 'public' }
      ];
    }
    
    if (category) {
      where.category = category;
    }
    
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }
    
    const offset = (page - 1) * limit;
    
    const { rows, count } = await Resource.findAndCountAll({
      where,
      include: [{
        model: User,
        attributes: ['id', 'username', 'realName', 'creditLevel', 'accountType']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      data: {
        rows,
        count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page)
      }
    });
  } catch (error) {
    console.error('获取资源列表错误:', error);
    res.status(500).json({ success: false, message: '获取资源列表失败' });
  }
});

// 获取资源详情
router.get('/:id', async (req, res) => {
  try {
    const resource = await Resource.findByPk(req.params.id, {
      include: [{
        model: User,
        attributes: ['id', 'username', 'realName', 'creditLevel', 'accountType', 'depositAmount']
      }]
    });
    
    if (!resource) {
      return res.status(404).json({ success: false, message: '资源不存在' });
    }
    
    // 增加浏览量
    await resource.increment('viewCount');
    
    res.json({
      success: true,
      data: resource
    });
  } catch (error) {
    console.error('获取资源详情错误:', error);
    res.status(500).json({ success: false, message: '获取资源详情失败' });
  }
});

// 发布资源（需登录）
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      title,
      category,
      subCategory,
      description,
      priceModel,
      priceMin,
      priceMax,
      cooperationType,
      visibility,
      region,
      serviceScope
    } = req.body;
    
    const resource = await Resource.create({
      userId: req.user.id,
      title,
      category,
      subCategory,
      description,
      priceModel,
      priceMin,
      priceMax,
      cooperationType,
      visibility,
      region,
      serviceScope,
      status: 'draft' // 默认草稿状态
    });
    
    res.status(201).json({
      success: true,
      data: resource
    });
  } catch (error) {
    console.error('发布资源错误:', error);
    res.status(500).json({ success: false, message: '发布资源失败' });
  }
});

// 更新资源
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const resource = await Resource.findByPk(req.params.id);
    
    if (!resource) {
      return res.status(404).json({ success: false, message: '资源不存在' });
    }
    
    if (resource.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: '无权限操作' });
    }
    
    await resource.update(req.body);
    
    res.json({
      success: true,
      data: resource
    });
  } catch (error) {
    console.error('更新资源错误:', error);
    res.status(500).json({ success: false, message: '更新资源失败' });
  }
});

// 删除资源
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const resource = await Resource.findByPk(req.params.id);
    
    if (!resource) {
      return res.status(404).json({ success: false, message: '资源不存在' });
    }
    
    if (resource.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: '无权限操作' });
    }
    
    await resource.update({ status: 'deleted' });
    
    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除资源错误:', error);
    res.status(500).json({ success: false, message: '删除资源失败' });
  }
});

// 中间件
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '请先登录' });
  }
  
  const jwt = require('jsonwebtoken');
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
