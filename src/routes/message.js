const router = require('express').Router();
const { authenticate } = require('../middleware/auth');

// 获取消息列表
router.get('/', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 发送消息
router.post('/', authenticate, async (req, res) => {
  try {
    const { to, content } = req.body;
    res.json({
      success: true,
      message: '消息已发送'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
