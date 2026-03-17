const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cooperation = sequelize.define('Cooperation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  resourceId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'resource_id'
  },
  requesterId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'requester_id'
  },
  providerId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'provider_id'
  },
  status: {
    type: DataTypes.ENUM('pending', 'negotiating', 'agreed', 'intention', '正式合作', 'cancelled', 'completed', 'disputed'),
    defaultValue: 'pending'
  },
  intentionPeriod: {
    type: DataTypes.INTEGER, // 天数
    defaultValue: 30,
    field: 'intention_period'
  },
  intentionStartDate: {
    type: DataTypes.DATE,
    field: 'intention_start_date'
  },
  intentionEndDate: {
    type: DataTypes.DATE,
    field: 'intention_end_date'
  },
  depositAmount: {
    type: DataTypes.DECIMAL(10, 2),
    field: 'deposit_amount'
  },
  depositPayer: {
    type: DataTypes.ENUM('requester', 'provider', 'both'),
    field: 'deposit_payer'
  },
  depositStatus: {
    type: DataTypes.ENUM('unpaid', 'paid', 'refunded', 'forfeited'),
    defaultValue: 'unpaid',
    field: 'deposit_status'
  },
  protocolUrl: {
    type: DataTypes.STRING(255),
    field: 'protocol_url'
  },
  protocolContent: {
    type: DataTypes.TEXT,
    field: 'protocol_content'
  },
  customTerms: {
    type: DataTypes.JSON,
    defaultValue: [],
    field: 'custom_terms'
  },
  cancelReason: {
    type: DataTypes.TEXT,
    field: 'cancel_reason'
  },
  cancelBy: {
    type: DataTypes.UUID,
    field: 'cancel_by'
  },
  remark: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'cooperations',
  underscored: true,
  timestamps: true
});

module.exports = Cooperation;
