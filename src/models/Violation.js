const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Violation = sequelize.define('Violation', {
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
  type: {
    type: DataTypes.ENUM('political', 'pornography', 'violence', 'gambling', 'fraud', 'insult', 'other'),
    allowNull: false
  },
  level: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  resourceId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'resource_id'
  },
  commentId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'comment_id'
  },
  action: {
    type: DataTypes.ENUM('warn', 'delete', 'ban'),
    defaultValue: 'warn'
  },
  description: {
    type: DataTypes.TEXT
  },
  processedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'processed_by'
  },
  processedAt: {
    type: DataTypes.DATE,
    field: 'processed_at'
  }
}, {
  tableName: 'violations',
  underscored: true,
  timestamps: true
});

module.exports = Violation;
