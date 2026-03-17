# GitHub + Render 部署步骤

## 步骤 1：创建 GitHub 仓库

### 1.1 访问 GitHub
打开浏览器，访问：https://github.com/new

### 1.2 创建新仓库
- **Repository name**: `resource-platform`
- **Description**: `资源能力交易撮合平台`
- **Public/Private**: 选择 **Public**（免费）
- **不要勾选** "Initialize with README"

点击 **"Create repository"** 按钮

---

## 步骤 2：关联远程仓库并推送

复制以下命令，在服务器终端执行：

```bash
cd /workspace/projects/workspace/resource-platform

# 关联远程仓库（替换为你的 GitHub 用户名）
git remote add origin https://github.com/你的用户名/resource-platform.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

**注意**：如果提示输入 GitHub 账号密码，请输入：
- 用户名：你的 GitHub 用户名
- 密码：使用 **Personal Access Token**（不是登录密码）

### 2.1 创建 Personal Access Token（如果需要）

1. 访问：https://github.com/settings/tokens
2. 点击 **"Generate new token"**
3. Token 名称：`resource-platform`
4. 权限勾选：`repo`
5. 点击 **"Generate token"**
6. 复制生成的 token（只显示一次！）

推送时，密码输入这个 token。

---

## 步骤 3：在 Render 部署

### 3.1 注册 Render
1. 访问：https://render.com
2. 点击 **"Sign Up"**
3. 使用 GitHub 账号登录

### 3.2 创建 Web Service

1. 点击 **"New"** → **"Web Service"**
2. 点击 **"Connect GitHub"**（需要授权）
3. 找到并选择 `resource-platform` 仓库
4. 点击 **"Connect"**

### 3.3 配置部署

| 配置项 | 值 |
|--------|-----|
| **Name** | `resource-platform` |
| **Region** | 选择离你最近的区域 |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node src/app.js` |

### 3.4 添加环境变量

点击 **"Advanced"** → **"Add Environment Variable"**：

| Key | Value |
|-----|-------|
| `DB_DIALECT` | `sqlite` |
| `DB_STORAGE` | `./database.sqlite` |
| `JWT_SECRET` | `your_super_secret_key_12345` |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |

### 3.5 开始部署

点击 **"Create Web Service"**

🎉 等待 3-5 分钟，Render 会自动部署！

---

## 步骤 4：访问你的应用

部署完成后，Render 会给你一个访问地址，类似：
```
https://resource-platform.onrender.com
```

点击这个地址就能访问你的应用了！

---

## 步骤 5：绑定自定义域名（可选）

如果你有自己的域名：

1. 在 Render 应用页面点击 **"Domains"**
2. 点击 **"Add Domain"**
3. 输入你的域名（如 `app.yourdomain.com`）
4. 按照提示配置 DNS 记录

---

## 📝 常见问题

### Q1：部署失败怎么办？
A: 查看 Render 的部署日志，检查错误信息

### Q2：如何重新部署？
A: 
- 方式1：在 GitHub 提交新代码，Render 自动重新部署
- 方式2：在 Render 点击 **"Manual Deploy"**

### Q3：数据库数据会丢失吗？
A: Render 免费版会定期重启，建议使用外部数据库（如 PostgreSQL）

### Q4：如何查看日志？
A: 在 Render 应用页面点击 **"Logs"** 标签

---

## 🔗 有用的链接

- Render 官网：https://render.com
- Render 文档：https://render.com/docs
- GitHub 官网：https://github.com
- Node.js 文档：https://nodejs.org/docs

---

部署完成后，告诉我你的访问地址！🎉
