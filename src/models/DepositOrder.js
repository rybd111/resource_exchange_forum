const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DepositOrder = sequelize.define('DepositOrder', {
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
  paymentMethod: {
    type: DataTypes.ENUM('wechat', 'alipay', 'bank', 'manual'),
    allowNull: false,
    field: 'payment_method'
  },
  transactionId: {
    type: DataTypes.STRING(128),
    allowNull: true,
    field: 'transaction_id'
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
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
  tableName: 'deposit_orders',
  underscored: true,
  timestamps: true
});

module.exports = DepositOrder;
