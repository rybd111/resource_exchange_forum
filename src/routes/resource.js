const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Resource = require('../models/Resource');
const User = require('../models/User');
const Violation = require('../models/Violation');
const { autoModerate, shouldBanUser } = require('../utils/contentFilter');
const jwt = require('jsonwebtoken');

// 配置 multer 存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/resources');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'resource-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只支持 JPG、PNG、GIF、WEBP 格式的图片'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB 限制
    files: 5 // 最多5张图片
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

// 发布资源（需登录，支持图片上传）
router.post('/', requireAuth, upload.array('images', 5), async (req, res) => {
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
    
    // 内容审核
    const moderation = autoModerate(title + ' ' + description);
    
    if (moderation.action === 'reject') {
      // 删除已上传的图片
      if (req.files) {
        req.files.forEach(file => {
          fs.unlinkSync(file.path);
        });
      }
      
      // 记录违规
      await Violation.create({
        userId: req.user.id,
        type: moderation.violations[0]?.type || 'other',
        level: moderation.violationLevel,
        content: title + ' ' + description,
        action: 'delete',
        description: moderation.reason
      });
      
      // 检查是否需要封号
      const userViolations = await Violation.findAll({
        where: { userId: req.user.id }
      });
      
      if (shouldBanUser(userViolations)) {
        await User.update(
          { status: 'banned' },
          { where: { id: req.user.id } }
        );
        
        return res.status(403).json({
          success: false,
          message: '您的账号因多次违规已被封禁'
        });
      }
      
      return res.status(400).json({
        success: false,
        message: '内容包含违规信息',
        reason: moderation.reason
      });
    }
    
    // 处理上传的图片
    const images = req.files ? req.files.map(file => ({
      url: `/uploads/resources/${file.filename}`,
      name: file.originalname,
      size: file.size
    })) : [];
    
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
      caseImages: images,
      status: 'published' // 直接发布
    });
    
    res.status(201).json({
      success: true,
      message: moderation.violationLevel === 'low' ? '发布成功（敏感词已过滤）' : '发布成功',
      data: resource
    });
  } catch (error) {
    console.error('发布资源错误:', error);
    // 删除已上传的图片
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
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

module.exports = router;
