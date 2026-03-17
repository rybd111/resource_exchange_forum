const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  realName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'real_name'
  },
  idCard: {
    type: DataTypes.STRING(18),
    allowNull: true, // 脱敏存储
    field: 'id_card'
  },
  phone: {
    type: DataTypes.STRING(11),
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  accountType: {
    type: DataTypes.ENUM('personal', 'enterprise'),
    defaultValue: 'personal',
    field: 'account_type'
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user'
  },
  enterpriseName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'enterprise_name'
  },
  enterpriseCode: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'enterprise_code'
  },
  creditScore: {
    type: DataTypes.INTEGER,
    defaultValue: 600,
    field: 'credit_score'
  },
  creditLevel: {
    type: DataTypes.ENUM('AAA', 'AA', 'A', 'B', 'C', 'D'),
    defaultValue: 'B',
    field: 'credit_level'
  },
  depositAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'deposit_amount'
  },
  status: {
    type: DataTypes.ENUM('active', 'frozen', 'banned'),
    defaultValue: 'active'
  },
  faceVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'face_verified'
  },
  idVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'id_verified'
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    field: 'last_login_at'
  }
}, {
  tableName: 'users',
  underscored: true,
  timestamps: true
});

module.exports = User;
