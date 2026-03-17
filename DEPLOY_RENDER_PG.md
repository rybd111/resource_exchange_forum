# GitHub + Render 部署步骤（PostgreSQL 版本）

## 步骤 1：创建 GitHub 仓库

### 1.1 访问 GitHub
打开浏览器，访问：https://github.com/new

### 1.2 创建新仓库
- **Repository name**: `resource_exchange_forum`
- **Description**: `资源能力交易撮合平台`
- **Public/Private**: 选择 **Public**（免费）
- **不要勾选** "Initialize with README"

点击 **"Create repository"** 按钮

---

## 步骤 2：代码已推送到 GitHub

✅ 代码已上传到：https://github.com/rybd111/resource_exchange_forum

---

## 步骤 3：在 Render 部署

### 3.1 注册 Render
1. 访问：https://render.com
2. 点击 **"Sign Up"**
3. 使用 GitHub 账号登录

### 3.2 创建 Web Service

1. 点击 **"New"** → **"Web Service"**
2. 点击 **"Connect GitHub"**（需要授权）
3. 找到并选择 `resource_exchange_forum` 仓库
4. 点击 **"Connect"**

### 3.3 创建 PostgreSQL 数据库（重要！）

1. 在部署 Web Service 之前，先创建数据库
2. 点击 **"New"** → **"PostgreSQL"**
3. 数据库名：`resource_platform_db`
4. 区域：选择和 Web Service 相同的区域
5. 点击 **"Create Database"**

创建后，在数据库页面获取连接信息：
- **Internal Database URL**: 复制这个链接

### 3.4 配置 Web Service 部署

| 配置项 | 值 |
|--------|-----|
| **Name** | `resource-exchange-forum` |
| **Region** | 选择离你最近的区域 |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node src/app.js` |

### 3.5 添加环境变量

点击 **"Advanced"** → **"Add Environment Variable"**：

| Key | Value |
|-----|-------|
| `DB_DIALECT` | `postgres` |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |

**重要**：不需要手动配置数据库连接信息！
- Render 会自动注入 `PGDATABASE`、`PGUSER`、`PGPASSWORD` 等环境变量
- 应用会自动读取这些环境变量连接到数据库

### 3.6 关联数据库

在 Web Service 页面：
1. 找到 **"Environment"** 部分
2. 点击数据库的 **"Connect"** 按钮
3. 选择刚才创建的 `resource_platform_db`
4. 这会自动添加数据库连接环境变量

### 3.7 开始部署

点击 **"Create Web Service"**

🎉 等待 3-5 分钟，Render 会自动部署！

---

## 步骤 4：访问你的应用

部署完成后，Render 会给你一个访问地址，类似：
```
https://resource-exchange-forum.onrender.com
```

点击这个地址就能访问你的应用了！

---

## 步骤 5：初始化数据库表

首次访问应用后，Sequelize 会自动创建数据库表。

或者你可以在 Render 的 **"Shell"** 中执行：

```bash
cd /opt/render/project/src
node models/init.js
```

---

## 📝 重要说明

### 数据库

- ✅ 使用 Render 免费版 PostgreSQL
- ✅ 自动注入连接信息
- ✅ 不需要手动配置

### 为什么改用 PostgreSQL？

- Render 免费提供 PostgreSQL
- SQLite3 有系统兼容性问题
- PostgreSQL 更适合生产环境

---

## 🔧 常见问题

### Q1：部署失败怎么办？
A: 查看 Render 的部署日志，检查数据库是否正确连接

### Q2：如何查看数据库？
A: 在 Render 数据库页面，点击 **"External Database URL"** 获取连接信息

### Q3：数据库数据会丢失吗？
A: Render 免费版 PostgreSQL 会保留数据，但有存储限制（1GB）

### Q4：如何重新部署？
A:
- 方式1：在 GitHub 提交新代码，Render 自动重新部署
- 方式2：在 Render 点击 **"Manual Deploy"**

---

## 🔗 有用的链接

- Render 官网：https://render.com
- Render 文档：https://render.com/docs
- GitHub 官网：https://github.com
- PostgreSQL 文档：https://www.postgresql.org/docs

---

## 📦 已修改的文件

- `package.json` - 移除 sqlite3，添加 pg
- `src/config/database.js` - 支持 PostgreSQL
- `.env` 和 `.env.example` - 更新数据库配置
- `README.md` - 更新部署说明

---

部署完成后，告诉我你的访问地址！🎉
