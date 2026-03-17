const router = require('express').Router();
const { authenticate } = require('../middleware/auth');

// 获取合作列表
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

// 发起合作
router.post('/', authenticate, async (req, res) => {
  try {
    const { resourceId, message } = req.body;
    res.json({
      success: true,
      message: '合作申请已发送'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 取消合作
router.post('/:id/cancel', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      message: '合作已取消'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
