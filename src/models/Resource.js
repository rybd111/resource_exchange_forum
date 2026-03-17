const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Resource = sequelize.define('Resource', {
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
  title: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  subCategory: {
    type: DataTypes.STRING(50),
    field: 'sub_category'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  priceModel: {
    type: DataTypes.ENUM('quoted', 'negotiable', 'range'),
    defaultValue: 'negotiable',
    field: 'price_model'
  },
  priceMin: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'price_min'
  },
  priceMax: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'price_max'
  },
  cooperationType: {
    type: DataTypes.ENUM('one-time', 'long-term', 'equity'),
    defaultValue: 'one-time',
    field: 'cooperation_type'
  },
  visibility: {
    type: DataTypes.ENUM('public', 'platform-only', 'private'),
    defaultValue: 'public'
  },
  region: {
    type: DataTypes.STRING(50)
  },
  serviceScope: {
    type: DataTypes.STRING(200),
    field: 'service_scope'
  },
  caseImages: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  qualificationFiles: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  status: {
    type: DataTypes.ENUM('draft', 'pending', 'published', 'offline', 'deleted'),
    defaultValue: 'draft'
  },
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'view_count'
  },
  likeCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'like_count'
  }
}, {
  tableName: 'resources',
  underscored: true,
  timestamps: true
});

module.exports = Resource;
