# GitHub 部署指南

## 方式一：GitHub Pages（静态部署）

适合纯前端项目，但我们的项目有后端，所以不推荐。

---

## 方式二：GitHub Actions + Vercel/Render（推荐）

### 步骤 1：推送到 GitHub

```bash
# 初始化 Git
cd resource-platform
git init

# 添加文件
git add .
git commit -m "初始提交：资源交易平台"

# 关联远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/你的用户名/resource-platform.git

# 推送
git branch -M main
git push -u origin main
```

### 步骤 2：使用 Render 部署（推荐，免费）

1. 访问 https://render.com 注册账号
2. 选择 "New Web Service"
3. 连接你的 GitHub 账号
4. 选择 `resource-platform` 仓库
5. 配置：
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/app.js`
   - **Environment Variables**:
     ```
     DB_DIALECT=sqlite
     DB_STORAGE=./database.sqlite
     JWT_SECRET=your_secret_key_here
     NODE_ENV=production
     ```
6. 点击 "Create Web Service"

Render 会自动部署，几分钟后就能访问！

### 步骤 3：使用 Railway（备选方案）

1. 访问 https://railway.app
2. 点击 "New Project"
3. 选择 "Deploy from GitHub repo"
4. 选择 `resource-platform` 仓库
5. Railway 会自动检测 Node.js 项目
6. 添加环境变量（同上）
7. 点击 "Deploy"

---

## 方式三：使用 Vercel（最简单）

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
cd resource-platform
vercel
```

按照提示操作，Vercel 会自动部署！

---

## 方式四：自建服务器 + GitHub Actions

### 1. 创建 GitHub Actions 工作流

创建文件：`.github/workflows/deploy.yml`

```yaml
name: Deploy to Server

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /path/to/project
            git pull origin main
            npm install
            pm2 restart resource-platform
```

### 2. 配置 Secrets

在 GitHub 仓库设置中添加：
- `SERVER_HOST`: 服务器IP
- `SERVER_USER`: 服务器用户名
- `SSH_KEY`: 私钥内容

### 3. 在服务器上安装 PM2

```bash
npm install -g pm2
pm2 start src/app.js --name resource-platform
pm2 save
pm2 startup
```

---

## 推荐方案

对于您的情况，我推荐：

### 🥇 Render（免费、简单）
- 注册：https://render.com
- 连接 GitHub，一键部署
- 免费额度充足
- 自动 HTTPS

### 🥈 Vercel（最简单）
- 注册：https://vercel.com
- 安装 CLI：`npm i -g vercel`
- 一行命令部署：`vercel`

---

需要我帮您做什么吗？
- 创建 GitHub Actions 配置文件？
- 打包项目代码？
- 其他操作？
