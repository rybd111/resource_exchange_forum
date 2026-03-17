# 资源集散地平台

> 资源能力交易撮合平台 - 让能力创造价值

## 项目简介

这是一个To B轻量级资源交易平台，支持个人和企业发布自己的资源/服务，并通过平台进行撮合交易。

## 功能特点

- ✅ 用户认证：实名认证 + 手机绑定
- ✅ 资源发布：6大类资源分类支持
- ✅ 合作撮合：意向期 + 保证金机制
- ✅ 协议签订：电子协议具有法律效力
- ✅ 信用评价：完善的信用体系

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | HTML5 + CSS3 + JavaScript |
| 后端 | Node.js + Express |
| 数据库 | MySQL |
| 认证 | JWT + bcrypt |

## 快速开始

### 1. 安装依赖

```bash
cd resource-platform
npm install
```

### 2. 配置环境

```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库等信息
```

### 3. 初始化数据库

```bash
# 创建数据库
mysql -u root -p < schema.sql

# 或使用Sequelize自动同步
node src/models/init.js
```

### 4. 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

### 5. 访问平台

浏览器打开：http://localhost:3000

## 目录结构

```
resource-platform/
├── public/                 # 静态文件
│   ├── css/
│   │   └── style.css      # 样式
│   ├── js/
│   │   └── app.js         # 前端逻辑
│   ├── images/
│   └── index.html         # 首页
├── src/
│   ├── config/
│   │   └── database.js   # 数据库配置
│   ├── models/
│   │   ├── User.js       # 用户模型
│   │   ├── Resource.js    # 资源模型
│   │   └── Cooperation.js # 合作模型
│   ├── routes/
│   │   ├── auth.js        # 认证路由
│   │   ├── user.js       # 用户路由
│   │   ├── resource.js   # 资源路由
│   │   └── cooperation.js # 合作路由
│   └── app.js            # 应用入口
├── uploads/              # 上传文件
├── .env.example          # 环境变量示例
├── package.json
└── README.md
```

## API接口

### 认证接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录 |
| GET | /api/auth/me | 获取当前用户 |

### 资源接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/resources | 获取资源列表 |
| GET | /api/resources/:id | 获取资源详情 |
| POST | /api/resources | 发布资源（需登录） |
| PUT | /api/resources/:id | 更新资源 |
| DELETE | /api/resources/:id | 删除资源 |

### 合作接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/cooperation | 发起合作 |
| GET | /api/cooperation | 获取合作列表 |
| PUT | /api/cooperation/:id | 更新合作状态 |
| POST | /api/cooperation/:id/cancel | 取消合作 |

## 资源分类

1. **技术服务类** - 软件开发、数据分析、设计制作
2. **制造加工类** - 机械加工、3D打印、产品设计
3. **生活服务类** - 汽车维修、家政服务、教育培训
4. **企业服务类** - 财税代理、法律咨询、营销策划
5. **产品供应类** - 原材料供应、成品批发
6. **投资合作类** - 项目融资、股权投资、资源置换

## 保证金规则

| 账户类型 | 基础保证金 | 最高合作额度 |
|---------|-----------|-------------|
| 个人 | 1000元 | 1万元 |
| 企业 | 5000元 | 50万元 |

## 合规要求

- 禁止发布违规违法内容
- 禁止涉黄、赌、毒、诈骗
- 禁止侵犯知识产权
- 需遵守中国法律法规

## 许可证

MIT License
