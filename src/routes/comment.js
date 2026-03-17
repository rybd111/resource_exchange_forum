const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Comment = require('../models/Comment');
const Resource = require('../models/Resource');
const User = require('../models/User');
const Violation = require('../models/Violation');
const { autoModerate, shouldBanUser } = require('../utils/contentFilter');
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

// 获取资源的评论列表
router.get('/resource/:resourceId', async (req, res) => {
  try {
    const { resourceId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const offset = (page - 1) * limit;
    
    const { rows, count } = await Comment.findAndCountAll({
      where: {
        resourceId,
        status: 'approved', // 只显示已审核通过的
        parentId: null // 只显示顶级评论
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'realName', 'creditLevel']
        },
        {
          model: Comment,
          as: 'replies',
          where: { status: 'approved' },
          required: false,
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'realName', 'creditLevel']
          }]
        }
      ],
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
    console.error('获取评论列表错误:', error);
    res.status(500).json({ success: false, message: '获取评论列表失败' });
  }
});

// 发布评论
router.post('/', requireAuth, async (req, res) => {
  try {
    const { resourceId, parentId, content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: '评论内容不能为空' });
    }
    
    if (content.length > 1000) {
      return res.status(400).json({ success: false, message: '评论内容不能超过1000字' });
    }
    
    // 检查资源是否存在
    const resource = await Resource.findByPk(resourceId);
    if (!resource) {
      return res.status(404).json({ success: false, message: '资源不存在' });
    }
    
    // 自动审核内容
    const moderation = autoModerate(content);
    
    // 创建评论
    const comment = await Comment.create({
      resourceId,
      userId: req.user.id,
      parentId: parentId || null,
      content: content,
      contentFiltered: moderation.filteredContent,
      status: moderation.action === 'approve' ? 'approved' : 'rejected',
      rejectReason: moderation.action === 'reject' ? moderation.reason : null,
      isAutoModerated: true
    });
    
    // 如果内容被拒绝，记录违规
    if (moderation.action === 'reject') {
      // 记录违规
      await Violation.create({
        userId: req.user.id,
        type: moderation.violations[0]?.type || 'other',
        level: moderation.violationLevel,
        content: content,
        commentId: comment.id,
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
          message: '您的账号因多次违规已被封禁',
          violations: moderation.violations
        });
      }
      
      // 扣除信誉分
      const user = await User.findByPk(req.user.id);
      let creditDeduction = 0;
      if (moderation.violationLevel === 'high') creditDeduction = 50;
      else if (moderation.violationLevel === 'medium') creditDeduction = 30;
      else creditDeduction = 10;
      
      await user.update({
        creditScore: Math.max(0, user.creditScore - creditDeduction)
      });
      
      return res.status(400).json({
        success: false,
        message: '评论包含违规内容，已被拒绝',
        reason: moderation.reason,
        violations: moderation.violations
      });
    }
    
    // 返回评论（包含用户信息）
    const commentWithUser = await Comment.findByPk(comment.id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'realName', 'creditLevel']
      }]
    });
    
    res.status(201).json({
      success: true,
      message: moderation.violationLevel === 'low' ? '评论已发布（敏感词已过滤）' : '评论发布成功',
      data: commentWithUser
    });
    
  } catch (error) {
    console.error('发布评论错误:', error);
    res.status(500).json({ success: false, message: '发布评论失败' });
  }
});

// 删除评论
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const comment = await Comment.findByPk(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ success: false, message: '评论不存在' });
    }
    
    // 检查权限（评论作者或资源作者可以删除）
    const resource = await Resource.findByPk(comment.resourceId);
    const isCommentOwner = comment.userId === req.user.id;
    const isResourceOwner = resource && resource.userId === req.user.id;
    
    if (!isCommentOwner && !isResourceOwner) {
      return res.status(403).json({ success: false, message: '无权限删除此评论' });
    }
    
    await comment.update({ status: 'deleted' });
    
    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除评论错误:', error);
    res.status(500).json({ success: false, message: '删除评论失败' });
  }
});

// 点赞评论
router.post('/:id/like', requireAuth, async (req, res) => {
  try {
    const comment = await Comment.findByPk(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ success: false, message: '评论不存在' });
    }
    
    await comment.increment('likeCount');
    
    res.json({
      success: true,
      message: '点赞成功'
    });
  } catch (error) {
    console.error('点赞评论错误:', error);
    res.status(500).json({ success: false, message: '点赞失败' });
  }
});

module.exports = router;
module.exports.requireAuth = requireAuth;
