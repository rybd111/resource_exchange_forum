const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Comment = sequelize.define('Comment', {
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
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id'
  },
  parentId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'parent_id'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  contentFiltered: {
    type: DataTypes.TEXT,
    field: 'content_filtered'
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'deleted'),
    defaultValue: 'pending'
  },
  rejectReason: {
    type: DataTypes.STRING(200),
    field: 'reject_reason'
  },
  likeCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'like_count'
  },
  isAutoModerated: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_auto_moderated'
  }
}, {
  tableName: 'comments',
  underscored: true,
  timestamps: true
});

module.exports = Comment;
