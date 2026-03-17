# Render 部署环境变量配置

## 📋 环境变量说明

### 重要提示

**不再需要手动配置数据库环境变量！**

Render 会自动注入以下 PostgreSQL 环境变量：
- `PGHOST` - 数据库主机
- `PGPORT` - 数据库端口
- `PGDATABASE` - 数据库名
- `PGUSER` - 数据库用户
- `PGPASSWORD` - 数据库密码

### 推荐配置（Render 环境变量）

在 Render Web Service 的 **"Environment"** 部分添加：

| Key | Value | 说明 |
|-----|-------|------|
| `NODE_ENV` | `production` | 生产环境 |
| `PORT` | `3000` | 服务端口 |

**注意**：不要添加 `DB_DIALECT`、`DB_HOST` 等环境变量，让应用使用 Render 自动注入的 PG* 变量。

---

## 🚀 部署步骤

### 1. 创建 PostgreSQL 数据库

1. 访问 https://render.com
2. 点击 **"New"** → **"PostgreSQL"**
3. 数据库名：`resource_platform_db`
4. 区域：选择离你最近的区域
5. 点击 **"Create Database"**

### 2. 创建 Web Service 并关联数据库

1. 点击 **"New"** → **"Web Service"**
2. 连接 GitHub，选择 `resource_exchange_forum`
3. 配置：
   - **Name**: `resource-exchange-forum`
   - **Runtime**: `Node`
   - **Build**: `npm install`
   - **Start**: `node src/app.js`
4. **关联数据库**（重要！）：
   - 找到 **"Environment"** 部分
   - 点击数据库的 **"Connect"** 按钮
   - 选择 `resource_platform_db`
   - 这会自动添加所有 PG* 环境变量
5. 添加其他环境变量：
   - `NODE_ENV` = `production`
   - `PORT` = `3000`
6. 点击 **"Create Web Service"**

### 3. 等待部署完成

大约 3-5 分钟，应用会自动部署成功！

---

## 📊 数据库初始化

首次运行时，Sequelize 会自动创建所需的数据库表。

你也可以在 Render 的 **"Shell"** 中手动初始化：

```bash
cd /opt/render/project/src
# Sequelize 会自动同步表结构
node -e "require('./models').User.sync(); require('./models').Resource.sync(); require('./models').Cooperation.sync();"
```

---

## 🔧 故障排除

### 问题1：数据库连接失败

**检查**：
1. 确认已创建 PostgreSQL 数据库
2. 确认 Web Service 已关联数据库
3. 查看 Web Service 的 "Environment" 部分，确认有 PG* 环境变量

**解决**：
- 重新关联数据库
- 手动添加 PG* 环境变量（从数据库页面复制）

### 问题2：SQLite 错误

**错误信息**：`Error: Please install sqlite3 package manually`

**原因**：没有正确使用 PostgreSQL

**解决**：
- 确保代码已更新到最新提交
- 重新部署 Web Service

### 问题3：表不存在

**错误信息**：`relation "users" does not exist`

**解决**：
- 等待 Sequelize 自动同步表结构
- 或手动执行同步命令（见上方）

---

## 📝 已修复的问题

### v1.0.0 (2026-03-17)

- ✅ 移除 SQLite3 依赖
- ✅ 改用 PostgreSQL
- ✅ 修复重复声明错误
- ✅ 强制使用 PostgreSQL 配置
- ✅ 优化环境变量处理

---

## 🎯 部署成功后的访问地址

```
https://resource-exchange-forum.onrender.com
```

---

需要帮助？查看 Render 日志或告诉我错误信息！
