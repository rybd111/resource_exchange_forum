const router = require('express').Router();
const { authenticate } = require('../middleware/auth');

// 获取用户信息
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 更新用户信息
router.put('/me', authenticate, async (req, res) => {
  try {
    // TODO: 实现更新逻辑
    res.json({
      success: true,
      message: '用户信息更新成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
