const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      message: '请先登录'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_key_12345');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: '无效的令牌'
    });
  }
};

module.exports = { authenticate };
