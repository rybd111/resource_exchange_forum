const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WithdrawalOrder = sequelize.define('WithdrawalOrder', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id'
  },
  orderNo: {
    type: DataTypes.STRING(64),
    unique: true,
    allowNull: false,
    field: 'order_no'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  withdrawalMethod: {
    type: DataTypes.ENUM('wechat', 'alipay', 'bank'),
    allowNull: false,
    field: 'withdrawal_method'
  },
  accountInfo: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'account_info'
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  reason: {
    type: DataTypes.ENUM('user_request', 'refund', 'admin_manual'),
    defaultValue: 'user_request',
    field: 'reason'
  },
  cooperationId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'cooperation_id'
  },
  remark: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  processedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'processed_by'
  },
  processedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'processed_at'
  }
}, {
  tableName: 'withdrawal_orders',
  underscored: true,
  timestamps: true
});

module.exports = WithdrawalOrder;
